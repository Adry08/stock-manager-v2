// app/stock/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Product, ProductFormData, Currency } from "@/types";
import ProductFormModal from "@/components/modals/ProductFormModal";
import { 
  getProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  ensureSettings 
} from "@/services/products";
import { 
  Plus, 
  Warehouse, 
  AlertTriangle, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  TrendingUp,
  Package
} from "lucide-react"; 
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type AppSettings = {
  default_currency: Currency;
  exchange_rates: Record<Currency, number>;
};

const LOW_STOCK_THRESHOLD = 5;
type SortableColumn = 'name' | 'quantity' | 'estimated_selling_price';

// Skeleton pour le tableau
const TableRowSkeleton = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-right">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-16 ml-auto"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-right">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 ml-auto"></div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-right">
      <div className="flex gap-2 justify-end">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
      </div>
    </td>
  </tr>
);

// Skeleton pour les cartes de stats
const StatCardSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 animate-pulse">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3"></div>
        <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-16"></div>
      </div>
      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
    </div>
  </div>
);

export default function StockPage() {
  const { user, supabase } = useAuth();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [initialLoading, setInitialLoading] = useState(true); 
  const [dataError, setDataError] = useState<string | null>(null); 
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortableColumn>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20; // Pagination pour grands volumes

  const defaultCurrency = (settings?.default_currency || 'MGA') as Currency;
  
  const exchangeRates = useMemo<Record<Currency, number>>(() => {
    if (!settings?.exchange_rates || typeof settings.exchange_rates !== 'object') {
      return { MGA: 1, USD: 1, EUR: 1, GBP: 1 };
    }
    return settings.exchange_rates as Record<Currency, number>;
  }, [settings?.exchange_rates]);

  // Fonction de conversion
  const convertToDefaultCurrency = useCallback((amount: number, fromCurrency: Currency): number => {
    if (fromCurrency === defaultCurrency) return amount;
    const rateFrom = exchangeRates[fromCurrency] || 1;
    const rateTo = exchangeRates[defaultCurrency] || 1;
    const amountInEUR = amount / rateFrom;
    return amountInEUR * rateTo;
  }, [defaultCurrency, exchangeRates]);

  // Filtrage et tri
  const stockProducts = useMemo(() => {
    let filtered = (allProducts || [])
      .filter(p => p.status === 'stock')
      .filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );

    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'quantity':
          comparison = (a.quantity || 0) - (b.quantity || 0);
          break;
        case 'estimated_selling_price':
          comparison = (a.estimated_selling_price || 0) - (b.estimated_selling_price || 0);
          break;
        case 'name':
        default:
          comparison = a.name.localeCompare(b.name);
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [allProducts, searchTerm, sortBy, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(stockProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return stockProducts.slice(start, start + itemsPerPage);
  }, [stockProducts, currentPage]);

  // Statistiques
  const stats = useMemo(() => {
    const totalProducts = stockProducts.length;
    const lowStockCount = stockProducts.filter(p => p.quantity < LOW_STOCK_THRESHOLD).length;
    
    // Le prix estimé est déjà en MGA, pas besoin de conversion
    const totalValue = stockProducts.reduce((sum, p) => {
      const price = p.estimated_selling_price || 0;
      const qty = p.quantity || 0;
      return sum + (price * qty);
    }, 0);
    
    const totalQuantity = stockProducts.reduce((sum, p) => sum + (p.quantity || 0), 0);

    return { totalProducts, totalValue, totalQuantity, lowStockCount };
  }, [stockProducts]);

  const loadData = useCallback(async () => {
    if (!user || !supabase) {
      setInitialLoading(false);
      return;
    }

    try {
      setDataError(null); 
      setInitialLoading(true);
      
      const settingsData = await ensureSettings(user.id, supabase);
      setSettings({
        default_currency: settingsData.default_currency as Currency,
        exchange_rates: settingsData.exchange_rates as Record<Currency, number>,
      });

      const productsData = await getProducts(supabase);
      setAllProducts(productsData);
      
    } catch (err) {
      const errorMessage = "Erreur lors du chargement de l'inventaire.";
      toast.error(errorMessage);
      console.error("Erreur lors du chargement des produits:", err);
      setDataError(errorMessage); 
    } finally {
      setInitialLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setCurrentPage(1); // Reset page lors du changement de recherche
  }, [searchTerm]);

  const handleCreate = async (values: ProductFormData) => {
    if (!user || !supabase) {
      toast.error("Connexion requise.");
      return;
    }
    
    try {
      await createProduct(values, user.id, supabase);
      toast.success("Produit ajouté en stock !");
      loadData(); 
      closeModal();
    } catch (error) {
      toast.error("Échec de l'ajout du produit : " + error);
    }
  };

  const handleUpdate = async (values: ProductFormData) => {
    if (!user || !supabase || !editingProduct) return;
    
    try {
      const updatedProduct = { ...editingProduct, ...values } as Product;
      await updateProduct(updatedProduct, user.id, supabase);
      toast.success("Produit modifié !");
      loadData();
      closeModal();
    } catch (error) {
      toast.error("Échec de la modification : " + error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!supabase || !confirm("Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.")) return;
    
    setDeletingId(id);
    try {
      await deleteProduct(id, supabase);
      toast.success("Produit supprimé !");
      setAllProducts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      toast.error("Échec de la suppression.");
      console.error("Erreur lors de la suppression:", err);
    } finally {
      setDeletingId(null);
    }
  };
  
  const handleSort = (key: SortableColumn) => {
    if (sortBy === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDirection('asc');
    }
  };
  
  const SortIcon = ({ column }: { column: SortableColumn }) => {
    if (sortBy !== column) return null;
    return sortDirection === 'asc' ? <ChevronDown className="w-4 h-4 ml-1" /> : <ChevronUp className="w-4 h-4 ml-1" />;
  };

  const openModal = (product?: Product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(undefined);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getCurrencySymbol = (curr: Currency) => {
    const symbols: Record<Currency, string> = {
      MGA: 'Ar',
      USD: '$',
      EUR: '€',
      GBP: '£',
    };
    return symbols[curr] || curr;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Warehouse className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-lg text-gray-600 dark:text-gray-400">Veuillez vous connecter.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="container mx-auto max-w-full p-4 sm:p-6 lg:p-8 space-y-6 pt-[calc(3rem+env(safe-area-inset-top))] pb-[calc(3rem+env(safe-area-inset-bottom))]">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/30 dark:to-indigo-800/30 rounded-xl shadow-md">
              <Warehouse className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Inventaire Stock
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {stockProducts.length} produit{stockProducts.length > 1 ? 's' : ''} en stock
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {initialLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
        ) : stockProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Total Produits
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats.totalProducts}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    articles différents
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900/30 dark:to-indigo-800/30 rounded-lg shadow-sm">
                  <Package className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Quantité Totale
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats.totalQuantity}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    unités en stock
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg shadow-sm">
                  <Warehouse className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Valeur Estimée
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white truncate">
                    {formatCurrency(stats.totalValue)} Ar
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    prix estimé total en MGA
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-lg shadow-sm flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Stock Critique
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats.lowStockCount}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    produits à réapprovisionner
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/30 rounded-lg shadow-sm">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Barre de Contrôle */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou description..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-3 pl-10 border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm text-gray-900 dark:text-white"
              disabled={initialLoading || !!dataError}
            />
          </div>
          
          <button
            onClick={() => openModal()}
            className="flex items-center bg-gradient-to-r from-indigo-600 to-indigo-700 text-white px-6 py-3 rounded-xl shadow-lg hover:from-indigo-700 hover:to-indigo-800 transition-all active:scale-[0.98] disabled:opacity-50 text-sm font-semibold whitespace-nowrap"
            disabled={initialLoading || !!dataError} 
          >
            <Plus className="w-5 h-5 mr-2" />
            Ajouter un produit
          </button>
        </div>

        {initialLoading ? (
          <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-100 dark:border-gray-700">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nom du Produit</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Prix Estimé</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {Array.from({ length: 10 }).map((_, i) => (
                  <TableRowSkeleton key={i} />
                ))}
              </tbody>
            </table>
          </div>
        ) : dataError ? (
          <div className="text-center py-12 bg-red-50 dark:bg-red-900/20 rounded-xl shadow-lg border border-red-200 dark:border-red-800">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-700 dark:text-red-400 mb-2">Erreur de Chargement</h2>
            <p className="text-red-500 dark:text-red-300 mb-6">{dataError}</p>
            <button
              onClick={loadData}
              className="inline-flex items-center bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-colors shadow-md"
            >
              Réessayer le chargement
            </button>
          </div>
        ) : stockProducts.length === 0 && searchTerm === '' ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
            <Warehouse className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Stock vide</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Ajoutez votre premier produit en stock pour commencer.</p>
            <button
              onClick={() => openModal()}
              className="inline-flex items-center bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors shadow-md"
            >
              <Plus className="w-5 h-5 mr-2" />
              Ajouter un produit
            </button>
          </div>
        ) : stockProducts.length === 0 && searchTerm !== '' ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Aucun produit trouvé</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Vérifiez l'orthographe ou essayez un autre terme de recherche.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-100 dark:border-gray-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center">
                        Nom du Produit
                        <SortIcon column="name" />
                      </div>
                    </th>

                    <th 
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      onClick={() => handleSort('quantity')}
                    >
                      <div className="flex items-center justify-end">
                        Stock
                        <SortIcon column="quantity" />
                      </div>
                    </th>
                    
                    <th 
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      onClick={() => handleSort('estimated_selling_price')}
                    >
                      <div className="flex items-center justify-end">
                        Prix Estimé
                        <SortIcon column="estimated_selling_price" />
                      </div>
                    </th>
                    
                    <th className="relative px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {paginatedProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        <div className="max-w-xs">
                          <div className="font-semibold truncate">{product.name}</div>
                          {product.description && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                              {product.description}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <span 
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${product.quantity < LOW_STOCK_THRESHOLD 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' 
                            : product.quantity < LOW_STOCK_THRESHOLD * 2
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'}`}
                        >
                          {product.quantity}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 text-right font-medium">
                        {product.estimated_selling_price?.toLocaleString() || 'N/A'} Ar
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          onClick={() => openModal(product)} 
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-4 transition-colors font-medium"
                        >
                          Modifier
                        </button>
                        <button 
                          onClick={() => handleDelete(product.id)} 
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors font-medium"
                          disabled={deletingId === product.id}
                        >
                          {deletingId === product.id ? 'Suppr...' : 'Supprimer'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-white dark:bg-gray-800 px-6 py-4 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Page <span className="font-semibold">{currentPage}</span> sur <span className="font-semibold">{totalPages}</span>
                  <span className="ml-2 text-gray-500 dark:text-gray-400">
                    ({paginatedProducts.length} sur {stockProducts.length} produits)
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Précédent
                  </button>
                  
                  {/* Pages numbers */}
                  <div className="hidden sm:flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                            currentPage === pageNum
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        <ProductFormModal
          isOpen={modalOpen}
          onClose={closeModal}
          onSubmit={editingProduct ? handleUpdate : handleCreate}
          product={editingProduct}
          defaultCurrency={defaultCurrency}
          exchangeRates={exchangeRates}
        />
      </div>
    </div>
  );
}
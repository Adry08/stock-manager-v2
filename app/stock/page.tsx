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
import { Plus, Warehouse, AlertTriangle, Search, ChevronDown, ChevronUp } from "lucide-react"; 
import SkeletonLoader from "@/components/SkeletonLoader";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// Alias pour le type Settings (basé sur la structure utilisée)
type AppSettings = {
  default_currency: Currency;
  exchange_rates: Record<Currency, number>;
};

// Seuil de stock critique (constante simple)
const LOW_STOCK_THRESHOLD = 5;

// CORRECTION TYPAGE: Utiliser 'selling_price' au lieu de 'price' pour le tri
type SortableColumn = 'name' | 'quantity' | 'selling_price';

export default function StockPage() {
  const { user, supabase } = useAuth();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  
  const [settings, setSettings] = useState<AppSettings | null>(null);

  // État de l'UI
  const [initialLoading, setInitialLoading] = useState(true); 
  const [dataError, setDataError] = useState<string | null>(null); 
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // NOUVEAUX ÉTATS pour la gestion d'un grand volume
  const [searchTerm, setSearchTerm] = useState('');
  // CORRECTION TYPAGE: Utiliser SortableColumn
  const [sortBy, setSortBy] = useState<SortableColumn>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // --- Propriétés dérivées (Mémorisées pour la performance) ---

  const defaultCurrency = (settings?.default_currency || 'MGA') as Currency;
  
  const exchangeRates = useMemo<Record<Currency, number>>(() => {
    if (!settings?.exchange_rates || typeof settings.exchange_rates !== 'object') {
      return { MGA: 1, USD: 1, EUR: 1, GBP: 1 };
    }
    return settings.exchange_rates as Record<Currency, number>;
  }, [settings?.exchange_rates]);

  // COMBINAISON: Filtrage et tri des produits en stock
  const stockProducts = useMemo(() => {
    let filtered = (allProducts || [])
      .filter(p => p.status === 'stock')
      .filter(p => 
        // CORRECTION ERREUR 1: Suppression de la référence à 'sku' (qui n'existe pas)
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );

    // Logique de tri
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'quantity':
          comparison = (a.quantity || 0) - (b.quantity || 0);
          break;
        // CORRECTION ERREUR 3: Utilisation de 'selling_price' au lieu de 'price'
        case 'selling_price':
          comparison = (a.selling_price || 0) - (b.selling_price || 0);
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
  
  // --- Logique de Chargement des Données ---

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

  // --- Gestionnaires d'Actions (CRUD) ---

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
      toast.error("Échec de l'ajout du produit.");
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
      toast.error("Échec de la modification.");
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
  
  // Logique pour le tri
  const handleSort = (key: SortableColumn) => {
    if (sortBy === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDirection('asc');
    }
  };
  
  // Composant d'icône de tri
  const SortIcon = ({ column }: { column: SortableColumn }) => {
    if (sortBy !== column) return null;
    return sortDirection === 'asc' ? <ChevronDown className="w-4 h-4 ml-1" /> : <ChevronUp className="w-4 h-4 ml-1" />;
  };

  // --- Gestion de la Modale ---

  const openModal = (product?: Product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(undefined);
  };

  // --- Rendu de l'UI ---

  if (!user) return <p className="p-8 text-center text-gray-600">Veuillez vous connecter pour accéder à l'inventaire.</p>;

  return (
    <div className="container mx-auto max-w-full p-4 sm:p-6 lg:p-8 space-y-6 pt-[calc(3rem+env(safe-area-inset-top))] pb-[calc(3rem+env(safe-area-inset-bottom))]">
      
      {/* 1. Barre de Contrôle (Titre, Recherche, Ajouter) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b pb-3">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Stock Actuel ({stockProducts.length} produits affichés)
        </h1>
        
        <div className="flex w-full md:w-auto space-x-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full p-2.5 pl-10 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              disabled={initialLoading || !!dataError}
            />
          </div>
          
          <button
            onClick={() => openModal()}
            className="flex-shrink-0 flex items-center bg-indigo-600 text-white px-4 py-2.5 rounded-full shadow hover:bg-indigo-700 transition-colors active:scale-[0.98] disabled:opacity-50 text-sm"
            disabled={initialLoading || !!dataError} 
          >
            <Plus className="w-5 h-5 mr-2" />
            Ajouter
          </button>
        </div>
      </div>

      {initialLoading ? (
        // CORRECTION ERREUR 5: Remplacement de type="table" par type="card"
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <SkeletonLoader type="card" count={8} /> 
        </div>
      ) : dataError ? (
        <div className="text-center py-12 bg-red-50 rounded-xl shadow-lg border border-red-200">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-700 mb-2">Erreur de Chargement</h2>
          <p className="text-red-500 mb-6">{dataError}</p>
          <button
            onClick={loadData}
            className="inline-flex items-center bg-red-600 text-white px-6 py-3 rounded-full hover:bg-red-700 transition-colors shadow-md"
          >
            Réessayer le chargement
          </button>
        </div>
      ) : stockProducts.length === 0 && searchTerm === '' ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg border border-gray-100">
          <Warehouse className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Stock vide</h2>
          <p className="text-gray-500 mb-6">Ajoutez votre premier produit en stock pour commencer.</p>
          <button
            onClick={() => openModal()}
            className="inline-flex items-center bg-indigo-600 text-white px-6 py-3 rounded-full hover:bg-indigo-700 transition-colors shadow-md"
          >
            <Plus className="w-5 h-5 mr-2" />
            Ajouter un produit
          </button>
        </div>
      ) : stockProducts.length === 0 && searchTerm !== '' ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-lg border border-gray-100">
          <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Aucun produit trouvé</h2>
          <p className="text-gray-500 mb-6">Vérifiez l'orthographe ou essayez un autre terme de recherche.</p>
        </div>
      ) : (
        // 6. Affichage du Tableau des Produits (pour la densité)
        <div className="overflow-x-auto bg-white shadow-lg sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {/* En-tête de tri : Nom du Produit */}
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Nom du Produit
                    <SortIcon column="name" />
                  </div>
                </th>
                
                {/* CORRECTION ERREUR 6: Suppression de la colonne SKU qui n'existe pas dans le type Product */}
                {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU / Réf.</th> */}

                {/* En-tête de tri : Stock */}
                <th 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100"
                  onClick={() => handleSort('quantity')}
                >
                  <div className="flex items-center justify-end">
                    Stock
                    <SortIcon column="quantity" />
                  </div>
                </th>
                
                {/* En-tête de tri : Prix */}
                <th 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100"
                  // CORRECTION ERREUR 7: Le tri se fait sur 'selling_price'
                  onClick={() => handleSort('selling_price')}
                >
                  <div className="flex items-center justify-end">
                    Prix de Vente ({defaultCurrency})
                    <SortIcon column="selling_price" />
                  </div>
                </th>
                
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stockProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 max-w-xs truncate">
                    {product.name}
                  </td>
                  {/* CORRECTION ERREUR 6: Suppression de l'affichage de sku */}
                  {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.sku || 'N/A'}</td> */}

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <span 
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${product.quantity < LOW_STOCK_THRESHOLD 
                            ? 'bg-red-100 text-red-800' 
                            : product.quantity < LOW_STOCK_THRESHOLD * 2
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'}`}
                    >
                      {product.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                    {/* CORRECTION ERREUR 7: Utilisation de 'selling_price' au lieu de 'price' */}
                    {product.selling_price?.toLocaleString() || 'N/A'} {defaultCurrency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                        onClick={() => openModal(product)} 
                        className="text-indigo-600 hover:text-indigo-900 mr-3 transition-colors"
                    >
                      Modifier
                    </button>
                    <button 
                        onClick={() => handleDelete(product.id)} 
                        className="text-red-600 hover:text-red-900 transition-colors"
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
  );
}
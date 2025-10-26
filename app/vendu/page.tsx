// app/vendu/page.tsx - VERSION MISE À JOUR avec calculs centralisés
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Product, Currency, ProductFormData } from "@/types";
import { ProductItem } from "@/types/productItem";
import { Client, ClientFormData } from "@/types/client";
import ProductCard from "@/components/ProductCard";
import ProductItemsModal from "@/components/modals/ProductItemsModal";
import { getProducts, ensureSettings, updateProduct } from "@/services/products";
import { getProductItems, updateMultipleItemsStatus } from "@/services/productItems";
import { getAllClients, getClientByProductId, createClient, updateClient, deleteClient } from "@/services/clients";
import { calculateSoldStats, PageSpecificStats } from "@/services/calculations";
import { Archive, Package, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import ProductFormModal from "@/components/modals/ProductFormModal";
import ClientModal from "@/components/modals/ClientModal";

// Skeletons
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

const ProductCardSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700 animate-pulse">
    <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
      <div className="absolute top-3 right-3 w-20 h-6 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
      <div className="absolute top-3 left-3 w-12 h-6 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
    </div>
    <div className="p-4 space-y-3">
      <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
      </div>
      <div className="flex items-center justify-between pt-2">
        <div className="h-7 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
        <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
      </div>
    </div>
  </div>
);

type SoldProduct = Product & {
  sold_quantity: number;
};

export default function VenduPage() {
  const { user, supabase } = useAuth();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [soldItems, setSoldItems] = useState<ProductItem[]>([]);
  const [allClients, setAllClients] = useState<Client[]>([]);
  
  const [settings, setSettings] = useState<{ 
    default_currency: Currency; 
    exchange_rates: Record<Currency, number>; 
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();

  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const [itemsModalOpen, setItemsModalOpen] = useState(false);
  const [selectedProductForItems, setSelectedProductForItems] = useState<Product | null>(null);
  const [productItems, setProductItems] = useState<ProductItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [stats, setStats] = useState<PageSpecificStats | null>(null);

  const defaultCurrency = (settings?.default_currency || 'MGA') as Currency;
  const exchangeRates = useMemo<Record<Currency, number>>(() => {
    if (!settings?.exchange_rates || typeof settings.exchange_rates !== 'object') {
      return { MGA: 1, USD: 1, EUR: 1, GBP: 1 };
    }
    return settings.exchange_rates as Record<Currency, number>;
  }, [settings?.exchange_rates]);

  // Produits enrichis avec quantité d'items vendus
  const soldProductsWithQuantities = useMemo<SoldProduct[]>(() => {
    const itemCounts = soldItems.reduce((acc, item) => {
      acc[item.product_id] = (acc[item.product_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return allProducts
      .filter(p => itemCounts[p.id] > 0)
      .map(p => ({
        ...p,
        sold_quantity: itemCounts[p.id] || 0,
      })) as SoldProduct[];
  }, [allProducts, soldItems]);

  const soldProducts = soldProductsWithQuantities;

  // Calcul des stats avec le service centralisé
  useEffect(() => {
    const computeStats = async () => {
      if (!settings || soldItems.length === 0) {
        setStats(null);
        return;
      }

      try {
        const soldStats = await calculateSoldStats(
          allProducts,
          soldItems,
          defaultCurrency,
          exchangeRates
        );
        setStats(soldStats);
      } catch (error) {
        console.error("Erreur calcul stats vendus:", error);
      }
    };

    computeStats();
  }, [allProducts, soldItems, settings, defaultCurrency, exchangeRates]);
  
  const loadData = useCallback(async () => {
    if (!user || !supabase) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const settingsData = await ensureSettings(user.id, supabase);
      
      setSettings({
        default_currency: settingsData.default_currency as Currency,
        exchange_rates: settingsData.exchange_rates as Record<Currency, number>,
      });

      const [productsData, clientsData, itemsResult] = await Promise.all([
        getProducts(supabase),
        getAllClients(supabase),
        supabase.from('product_items').select('*').eq('status', 'vendu'),
      ]);
      
      setAllProducts(productsData);
      setAllClients(clientsData);
      setSoldItems(itemsResult.data || []);
    } catch (err) {
      toast.error("Erreur lors du chargement des produits vendus.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  const handleManageItems = async (product: Product) => {
    if (!supabase) return;
    
    setSelectedProductForItems(product);
    setItemsModalOpen(true);
    setItemsLoading(true);

    try {
      const items = await getProductItems(product.id, supabase);
      setProductItems(items);
    } catch (error) {
      toast.error("Erreur lors du chargement des items");
      console.error(error);
    } finally {
      setItemsLoading(false);
    }
  };

  const handleUpdateItems = async (itemIds: string[], newStatus: string) => {
    if (!supabase || !selectedProductForItems) return;

    try {
      await updateMultipleItemsStatus(itemIds, newStatus as 'stock' | 'livraison' | 'vendu', supabase);
      const updatedItems = await getProductItems(selectedProductForItems.id, supabase);
      setProductItems(updatedItems);
      await loadData();
      
      if (newStatus === 'stock') {
        toast.success(`${itemIds.length} item(s) remis en stock !`);
      } else if (newStatus === 'livraison') {
        toast.success(`${itemIds.length} item(s) remis en livraison !`);
      } else {
        toast.success(`${itemIds.length} item(s) mis à jour !`);
      }
    } catch (error) {
      throw error;
    }
  };

  const closeItemsModal = () => {
    setItemsModalOpen(false);
    setSelectedProductForItems(null);
    setProductItems([]);
  };

  const handleUpdate = async (values: ProductFormData) => {
    if (!user || !supabase || !editingProduct) return;
    
    try {
      const updatedProduct = { ...editingProduct, ...values } as Product;
      await updateProduct(updatedProduct, user.id, supabase);
      toast.success("Produit modifié !");
      loadData();
      closeModal();
    } catch (e) {
      toast.error("Échec de la modification");
      console.error(e);
    }
  };

  const handleClientClick = async (product: Product) => {
    if (!supabase) return;
    
    try {
      const client = await getClientByProductId(product.id, supabase);
      setSelectedProduct(product);
      setSelectedClient(client);
      setClientModalOpen(true);
    } catch (error) {
      console.error(error);
      setSelectedProduct(product);
      setSelectedClient(null);
      setClientModalOpen(true);
    }
  };

  const handleClientSubmit = async (data: ClientFormData) => {
    if (!user || !supabase || !selectedProduct) return;

    try {
      if (selectedClient) {
        await updateClient(selectedClient.id, data, supabase);
        toast.success("Client modifié avec succès !");
      } else {
        await createClient(selectedProduct.id, data, user.id, supabase);
        toast.success("Client ajouté avec succès !");
      }
      loadData();
      setClientModalOpen(false);
      setSelectedProduct(null);
      setSelectedClient(null);
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement du client.");
      console.error(error);
    }
  };

  const handleClientDelete = async () => {
    if (!supabase || !selectedClient) return;

    try {
      await deleteClient(selectedClient.id, supabase);
      toast.success("Client supprimé avec succès !");
      loadData();
      setClientModalOpen(false);
      setSelectedProduct(null);
      setSelectedClient(null);
    } catch (error) {
      toast.error("Erreur lors de la suppression du client.");
      console.error(error);
    }
  };

  const openModal = (product?: Product) => {
    setEditingProduct(product);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(undefined);
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const hasClient = useCallback((productId: string) => {
    return allClients.some(c => c.product_id === productId);
  }, [allClients]);

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <div className="p-6 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-6">
          <Archive className="w-16 h-16 text-green-600 dark:text-green-400" />
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-400">Veuillez vous connecter.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/50 via-white to-green-50/50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <div className="container mx-auto max-w-full p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Header moderne avec gradient */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl blur-lg opacity-50"></div>
              <div className="relative p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl">
                <Archive className="w-10 h-10 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-4xl font-extrabold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Produits Vendus
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Historique et statistiques de vos ventes • {stats?.totalQuantity || 0} items vendus
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards modernes */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
          </div>
        ) : soldProducts.length > 0 && stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Produits */}
            <div className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20 rounded-2xl shadow-xl p-6 border border-blue-100 dark:border-blue-900/30 hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Produits Vendus
                  </p>
                  <p className="text-4xl font-extrabold text-gray-900 dark:text-white">
                    {stats.totalProducts}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">articles différents</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl shadow-md">
                  <Package className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            {/* Total Quantité */}
            <div className="bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-purple-900/20 rounded-2xl shadow-xl p-6 border border-purple-100 dark:border-purple-900/30 hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Quantité Totale
                  </p>
                  <p className="text-4xl font-extrabold text-gray-900 dark:text-white">
                    {stats.totalQuantity}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">unités vendues</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl shadow-md">
                  <TrendingUp className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>

            {/* Revenu Total */}
            <div className="bg-gradient-to-br from-white to-emerald-50 dark:from-gray-800 dark:to-emerald-900/20 rounded-2xl shadow-xl p-6 border border-emerald-100 dark:border-emerald-900/30 hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Revenu Total
                  </p>
                  <p className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white truncate">
                    {formatCurrency(stats.totalRevenue || 0)} {getCurrencySymbol(defaultCurrency)}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">chiffre d'affaires</p>
                </div>
                <div className="p-4 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30 rounded-xl shadow-md flex-shrink-0">
                  <DollarSign className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </div>

            {/* Profit Total */}
            <div className={`rounded-2xl shadow-xl p-6 border hover:shadow-2xl transition-all duration-300 hover:scale-105 ${
              (stats.totalProfit || 0) >= 0
                ? 'bg-gradient-to-br from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 border-green-300 dark:border-green-700'
                : 'bg-gradient-to-br from-red-500 to-rose-600 dark:from-red-600 dark:to-rose-700 border-red-300 dark:border-red-700'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white/90 mb-1">
                    {(stats.totalProfit || 0) >= 0 ? 'Profit Total' : 'Perte Totale'}
                  </p>
                  <p className="text-3xl sm:text-4xl font-extrabold text-white truncate">
                    {formatCurrency(Math.abs(stats.totalProfit || 0))} {getCurrencySymbol(defaultCurrency)}
                  </p>
                  <p className="text-xs text-white/80 mt-2">
                    {(stats.totalProfit || 0) >= 0 ? 'bénéfice net' : 'déficit'}
                  </p>
                </div>
                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-xl shadow-md flex-shrink-0">
                  {(stats.totalProfit || 0) >= 0 ? (
                    <TrendingUp className="w-7 h-7 text-white" />
                  ) : (
                    <TrendingDown className="w-7 h-7 text-white" />
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : soldProducts.length === 0 ? (
          <div className="text-center py-20 bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-900/20 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
            <div className="max-w-md mx-auto px-4">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full blur-xl opacity-20"></div>
                <div className="relative p-6 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full">
                  <Archive className="w-16 h-16 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                Aucun produit vendu
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Les produits marqués comme vendus apparaîtront ici avec leurs statistiques.
              </p>
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 text-gray-700 dark:text-gray-300 rounded-xl text-sm border border-gray-200 dark:border-gray-600 shadow-md">
                <Package className="w-5 h-5" />
                <span className="font-semibold">Commencez à vendre vos produits</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {soldProducts.map((p: SoldProduct) => (
              <ProductCard 
                key={p.id} 
                product={{...p, quantity: p.sold_quantity}}
                onEdit={() => openModal(p)}
                onDelete={() => {}}
                onClientClick={handleClientClick}
                onManageItems={handleManageItems}
                isDeleting={false}
                defaultCurrency={defaultCurrency}
                exchangeRates={exchangeRates}
                hasClient={hasClient(p.id)}
              />
            ))}
          </div>
        )}

        {/* Modals */}
        <ProductFormModal
          isOpen={modalOpen}
          onClose={closeModal}
          onSubmit={handleUpdate}
          product={editingProduct}
          defaultCurrency={defaultCurrency}
          exchangeRates={exchangeRates}
        />

        {selectedProduct && (
          <ClientModal
            isOpen={clientModalOpen}
            onClose={() => {
              setClientModalOpen(false);
              setSelectedProduct(null);
              setSelectedClient(null);
            }}
            onSubmit={handleClientSubmit}
            onDelete={selectedClient ? handleClientDelete : undefined}
            client={selectedClient}
            productName={selectedProduct.name}
          />
        )}

        {selectedProductForItems && (
          <ProductItemsModal
            isOpen={itemsModalOpen}
            onClose={closeItemsModal}
            product={selectedProductForItems}
            items={productItems}
            onUpdateItems={handleUpdateItems}
            loading={itemsLoading}
          />
        )}
      </div>
    </div>
  );
}
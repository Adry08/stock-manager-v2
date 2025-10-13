// app/vendu/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getProducts, ensureSettings, updateProduct } from "@/services/products";
import { getAllClients, getClientByProductId, createClient, updateClient, deleteClient } from "@/services/clients";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import ProductCard from "@/components/ProductCard";
import { Product, Currency, ProductFormData,} from "@/types";
import {  Client, ClientFormData } from "@/types/client"
import { Archive, TrendingUp, Package, DollarSign } from "lucide-react";
import ProductFormModal from "@/components/modals/ProductFormModal";
import ClientModal from "@/components/modals/ClientModal";

// Skeleton Cards
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
      <div className="flex gap-2 pt-2">
        <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
        <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
      </div>
    </div>
  </div>
);

export default function VenduPage() {
  const { user, supabase } = useAuth();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allClients, setAllClients] = useState<Client[]>([]);
  
  const [settings, setSettings] = useState<{ 
    default_currency: Currency; 
    exchange_rates: Record<Currency, number>; 
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();

  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const defaultCurrency = (settings?.default_currency || 'MGA') as Currency;
  const exchangeRates = useMemo<Record<Currency, number>>(() => {
    if (!settings?.exchange_rates || typeof settings.exchange_rates !== 'object') {
      return { MGA: 1, USD: 1, EUR: 1, GBP: 1 };
    }
    return settings.exchange_rates as Record<Currency, number>;
  }, [settings?.exchange_rates]);

  const soldProducts = useMemo(() => {
    return allProducts.filter((p: Product) => p.status === "vendu");
  }, [allProducts]);

  const convertToDefaultCurrency = useCallback((amount: number, fromCurrency: Currency): number => {
    if (fromCurrency === defaultCurrency) return amount;
    const rateFrom = exchangeRates[fromCurrency] || 1;
    const rateTo = exchangeRates[defaultCurrency] || 1;
    const amountInEUR = amount / rateFrom;
    return amountInEUR * rateTo;
  }, [defaultCurrency, exchangeRates]);

  // Statistiques
  const stats = useMemo(() => {
    const totalProducts = soldProducts.length;
    const totalQuantity = soldProducts.reduce((sum, p) => sum + (p.quantity || 0), 0);
    
    let totalRevenue = 0;
    let totalCost = 0;
    
    soldProducts.forEach(p => {
      const qty = p.quantity || 0;
      const purchasePrice = p.purchase_price || 0;
      const sellingPrice = p.selling_price || p.estimated_selling_price || 0;
      
      const costConverted = convertToDefaultCurrency(purchasePrice, p.currency as Currency);
      const revenueConverted = sellingPrice; // Déjà en devise par défaut
      
      totalCost += costConverted * qty;
      totalRevenue += revenueConverted * qty;
    });
    
    const totalProfit = totalRevenue - totalCost;
    
    return { totalProducts, totalQuantity, totalRevenue, totalCost, totalProfit };
  }, [soldProducts, convertToDefaultCurrency]);
  
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

      const [productsData, clientsData] = await Promise.all([
        getProducts(supabase),
        getAllClients(supabase)
      ]);
      
      setAllProducts(productsData);
      setAllClients(clientsData);
    } catch (err) {
      toast.error("Erreur lors du chargement des produits vendus.");
      console.error("Erreur lors du chargement des produits:", err);
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  const handleUpdate = async (values: ProductFormData) => {
    if (!user || !supabase || !editingProduct) return;
    
    try {
      const updatedProduct = { ...editingProduct, ...values } as Product;
      await updateProduct(updatedProduct, user.id, supabase);
      toast.success("Produit modifié !");
      loadData();
      closeModal();
    } catch (e) {
      toast.error("Échec de la modification : " + e);
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
      console.error("Erreur lors de la récupération du client:", error);
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <Archive className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
        <p className="text-lg text-gray-600 dark:text-gray-400">Veuillez vous connecter.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <div className="container mx-auto max-w-full p-4 sm:p-6 lg:p-8 space-y-6 pt-[calc(3rem+env(safe-area-inset-top))] pb-[calc(3rem+env(safe-area-inset-bottom))]">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
              <Archive className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Produits Vendus
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Historique et statistiques de vos ventes
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
        ) : soldProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Total Produits */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-blue-100 dark:border-blue-900/30 hover:shadow-xl transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Produits Vendus
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats.totalProducts}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    articles différents
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg shadow-sm">
                  <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            {/* Total Quantité */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-purple-100 dark:border-purple-900/30 hover:shadow-xl transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Quantité Totale
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats.totalQuantity}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    unités vendues
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 rounded-lg shadow-sm">
                  <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>

            {/* Revenu Total */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-emerald-100 dark:border-emerald-900/30 hover:shadow-xl transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Revenu Total
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white truncate">
                    {formatCurrency(stats.totalRevenue)} {getCurrencySymbol(defaultCurrency)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    chiffre d'affaires
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/30 rounded-lg shadow-sm flex-shrink-0">
                  <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </div>

            {/* Profit Total */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 rounded-xl shadow-lg p-6 border border-green-300 dark:border-green-700 hover:shadow-xl transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/90 mb-1">
                    Profit Total
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-white truncate">
                    {formatCurrency(stats.totalProfit)} {getCurrencySymbol(defaultCurrency)}
                  </p>
                  <p className="text-xs text-white/80 mt-1">
                    bénéfice net
                  </p>
                </div>
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-lg shadow-sm flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-white" />
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
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="max-w-md mx-auto px-4">
              <div className="p-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Archive className="w-12 h-12 text-gray-400 dark:text-gray-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Aucun produit vendu
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Les produits marqués comme vendus apparaîtront ici avec leurs statistiques.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 rounded-lg text-sm border border-gray-200 dark:border-gray-600">
                <Package className="w-4 h-4" />
                <span>Commencez à vendre vos produits</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {soldProducts.map((p: Product) => (
              <ProductCard 
                key={p.id} 
                product={p} 
                onEdit={() => openModal(p)}
                onDelete={() => {}}
                onClientClick={handleClientClick}
                isDeleting={deletingId === p.id} 
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
      </div>
    </div>
  );
}
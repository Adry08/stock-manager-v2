// app/livraison/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Product, Currency, ProductFormData } from "@/types";
import ProductCard from "@/components/ProductCard";
import { getProducts, ensureSettings, updateProduct } from "@/services/products";
import { Truck, Package, Clock, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import ProductFormModal from "@/components/modals/ProductFormModal";

// Skeleton amélioré pour les cartes de stats
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

// Skeleton amélioré pour les cartes de produits
const ProductCardSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700 animate-pulse">
    {/* Image skeleton */}
    <div className="relative h-48 bg-gray-200 dark:bg-gray-700">
      <div className="absolute top-3 right-3 w-16 h-6 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
    </div>
    
    {/* Content skeleton */}
    <div className="p-4 space-y-3">
      {/* Title */}
      <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
      
      {/* Description */}
      <div className="space-y-2">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
      </div>
      
      {/* Price and quantity */}
      <div className="flex items-center justify-between pt-2">
        <div className="h-7 bg-gray-300 dark:bg-gray-600 rounded w-24"></div>
        <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
      </div>
      
      {/* Actions */}
      <div className="flex gap-2 pt-2">
        <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
        <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
      </div>
    </div>
  </div>
);

export default function LivraisonPage() {
  const { user, supabase } = useAuth();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  
  const [settings, setSettings] = useState<{ 
    default_currency: Currency; 
    exchange_rates: Record<Currency, number>; 
  } | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();

  const defaultCurrency = (settings?.default_currency || 'MGA') as Currency;
  const exchangeRates = useMemo<Record<Currency, number>>(() => {
    if (!settings?.exchange_rates || typeof settings.exchange_rates !== 'object') {
      return { MGA: 1, USD: 1, EUR: 1, GBP: 1 };
    }
    return settings.exchange_rates as Record<Currency, number>;
  }, [settings?.exchange_rates]);

  const deliveryProducts = useMemo(() => {
    return allProducts.filter(p => p.status === 'livraison');
  }, [allProducts]);

  // Fonction pour convertir un montant dans la devise par défaut
  const convertToDefaultCurrency = useCallback((amount: number, fromCurrency: Currency): number => {
    if (fromCurrency === defaultCurrency) return amount;
    
    // Convertir vers EUR (base), puis vers la devise cible
    const rateFrom = exchangeRates[fromCurrency] || 1;
    const rateTo = exchangeRates[defaultCurrency] || 1;
    
    // Si la base est EUR (taux = 1), on fait : amount / rateFrom * rateTo
    const amountInEUR = amount / rateFrom;
    return amountInEUR * rateTo;
  }, [defaultCurrency, exchangeRates]);

  // Calcul des statistiques avec conversion de devises
  const stats = useMemo(() => {
    const totalProducts = deliveryProducts.length;
    
    // Calculer la valeur totale en convertissant chaque produit dans la devise par défaut
    const totalValue = deliveryProducts.reduce((sum, p) => {
      const price = p.purchase_price || 0;
      const qty = p.quantity || 0;
      const productValue = price * qty;
      
      // Convertir la valeur du produit dans la devise par défaut
      const convertedValue = convertToDefaultCurrency(productValue, p.currency as Currency);
      
      return sum + convertedValue;
    }, 0);
    
    const totalQuantity = deliveryProducts.reduce((sum, p) => sum + (p.quantity || 0), 0);

    return { totalProducts, totalValue, totalQuantity };
  }, [deliveryProducts, convertToDefaultCurrency]);
  
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

      const productsData = await getProducts(supabase);
      setAllProducts(productsData);
    } catch (err) {
      toast.error("Erreur lors du chargement des produits en livraison.");
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
    } catch (error) {
      toast.error("Échec de la modification.");
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Truck className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
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
            <div className="p-3 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 rounded-xl shadow-md">
              <Truck className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Produits en Transit
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Suivez vos produits en cours de livraison
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards with Skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
        ) : deliveryProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
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
                <div className="p-3 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 rounded-lg shadow-sm">
                  <Package className="w-6 h-6 text-orange-600 dark:text-orange-400" />
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
                    unités en transit
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg shadow-sm">
                  <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Valeur Totale
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white truncate">
                    {formatCurrency(stats.totalValue)} {getCurrencySymbol(defaultCurrency)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    en {defaultCurrency}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-lg shadow-sm flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Products Grid with Enhanced Skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : deliveryProducts.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="max-w-md mx-auto px-4">
              <div className="p-4 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Truck className="w-12 h-12 text-orange-600 dark:text-orange-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Aucun produit en transit
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Les produits en cours de livraison apparaîtront ici.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-lg text-sm border border-orange-200 dark:border-orange-800/50">
                <Clock className="w-4 h-4 animate-pulse" />
                <span>En attente de livraisons...</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {deliveryProducts.map((p: Product) => (
              <ProductCard
                key={p.id}
                product={p}
                onEdit={() => openModal(p)}
                onDelete={() => {}}
                isDeleting={deletingId === p.id} 
                defaultCurrency={defaultCurrency}
                exchangeRates={exchangeRates}
              />
            ))}
          </div>
        )}

        <ProductFormModal
          isOpen={modalOpen}
          onClose={closeModal}
          onSubmit={handleUpdate}
          product={editingProduct}
          defaultCurrency={defaultCurrency}
          exchangeRates={exchangeRates}
        />
      </div>
    </div>
  );
}
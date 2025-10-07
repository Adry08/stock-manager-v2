// app/livraison/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Product, Currency, ProductFormData } from "@/types";
import ProductCard from "@/components/ProductCard";
import { getProducts, ensureSettings, updateProduct } from "@/services/products";
import { Truck, Package, Clock, TrendingUp } from "lucide-react";
import SkeletonLoader from "@/components/SkeletonLoader";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import ProductFormModal from "@/components/modals/ProductFormModal";

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

  // Calcul des statistiques
  const stats = useMemo(() => {
    const totalProducts = deliveryProducts.length;
    const totalValue = deliveryProducts.reduce((sum, p) => {
      const price = p.purchase_price || 0;
      const qty = p.quantity || 0;
      return sum + (price * qty);
    }, 0);
    const totalQuantity = deliveryProducts.reduce((sum, p) => sum + (p.quantity || 0), 0);

    return { totalProducts, totalValue, totalQuantity };
  }, [deliveryProducts]);
  
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
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
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

        {/* Stats Cards */}
        {!loading && deliveryProducts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Total Produits
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats.totalProducts}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Package className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Quantité Totale
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {stats.totalQuantity}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Valeur Totale
                  </p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(stats.totalValue)} {getCurrencySymbol(defaultCurrency)}
                  </p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <SkeletonLoader type="card" count={8} />
          </div>
        ) : deliveryProducts.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="max-w-md mx-auto">
              <div className="p-4 bg-orange-100 dark:bg-orange-900/30 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <Truck className="w-12 h-12 text-orange-600 dark:text-orange-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                Aucun produit en transit
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Les produits en cours de livraison apparaîtront ici.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 rounded-lg text-sm">
                <Clock className="w-4 h-4" />
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
                onEdit={() => openModal(p)} // ✅ Ajout de l'édition
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
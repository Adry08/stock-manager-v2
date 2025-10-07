// app/vendu/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { getProducts, ensureSettings, updateProduct } from "@/services/products";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import ProductCard from "@/components/ProductCard";
import { Product, Currency, ProductFormData } from "@/types";
import SkeletonLoader from "@/components/SkeletonLoader";
import { Archive } from "lucide-react";
import ProductFormModal from "@/components/modals/ProductFormModal";

export default function VenduPage() {
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

  const soldProducts = useMemo(() => {
    return allProducts.filter((p: Product) => p.status === "vendu");
  }, [allProducts]);
  
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

  if (!user) return <p className="p-8 text-center text-gray-600">Veuillez vous connecter.</p>;

  return (
    <div className="container mx-auto max-w-full p-4 sm:p-6 lg:p-8 space-y-6 pt-[calc(3rem+env(safe-area-inset-top))] pb-[calc(3rem+env(safe-area-inset-bottom))]">
        <div className="flex justify-between items-center mb-8 border-b pb-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Produits Vendus ({soldProducts.length})
            </h1>
        </div>

        {soldProducts.length === 0 ? (
             <div className="text-center py-12 bg-white rounded-xl shadow-lg border border-gray-100">
                <Archive className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-lg text-gray-500">Aucun produit n'a été marqué comme vendu.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {soldProducts.map((p: Product) => (
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
  );
}
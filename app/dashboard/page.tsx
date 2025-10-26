// app/dashboard/page.tsx - VERSION MISE À JOUR avec calculs centralisés
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Product, ProductFormData, Currency } from "@/types";
import { ProductItem } from "@/types/productItem";
import { getProducts, updateProduct, deleteProduct, createProduct, ensureSettings } from "@/services/products";
import { calculateGlobalStats, GlobalStats } from "@/services/calculations";
import { Plus, Package, RefreshCw, Warehouse, Truck, Archive, TrendingUp, TrendingDown, Percent, Target, Zap, ShoppingCart, Coins, DollarSign, MinusCircle } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import ProductFormModal from "@/components/modals/ProductFormModal";
import SkeletonLoader from "@/components/SkeletonLoader";
import KpiCard from "@/components/KpiCard";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import ValueChart, { EvolutionData } from "@/components/ValueChart";

export default function DashboardPage() {
  const { user, supabase } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [allItems, setAllItems] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<{ 
    default_currency: Currency; 
    exchange_rates: Record<Currency, number>; 
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [evolutionData, setEvolutionData] = useState<EvolutionData[]>([]);
  const [stats, setStats] = useState<GlobalStats | null>(null);

  const defaultCurrency = (settings?.default_currency || "MGA") as Currency;
  const exchangeRates = useMemo<Record<Currency, number>>(() => {
    if (!settings?.exchange_rates || typeof settings.exchange_rates !== 'object') {
      return { MGA: 1, USD: 1, EUR: 1, GBP: 1 };
    }
    return settings.exchange_rates as Record<Currency, number>;
  }, [settings?.exchange_rates]);

  // Calcul des stats avec le service centralisé
  useEffect(() => {
    const computeStats = async () => {
      if (products.length === 0 || allItems.length === 0 || !settings) {
        setStats(null);
        return;
      }

      try {
        const globalStats = await calculateGlobalStats(
          products,
          allItems,
          defaultCurrency,
          exchangeRates
        );
        setStats(globalStats);
      } catch (error) {
        console.error("Erreur calcul des stats:", error);
      }
    };

    computeStats();
  }, [products, allItems, settings, defaultCurrency, exchangeRates]);

  // Produits récents (8 derniers)
  const recentProducts = useMemo(() => products.slice(0, 8), [products]);

  const refreshData = useCallback(async () => {
    if (!user || !supabase) return;
    setIsRefreshing(true);
    try {
      const settingsData = await ensureSettings(user.id, supabase);
      setSettings({
        default_currency: settingsData.default_currency as Currency,
        exchange_rates: settingsData.exchange_rates as Record<Currency, number>,
      });
      
      const productsData = await getProducts(supabase);
      setProducts(productsData);
      
      // Récupération de tous les items
      const { data: itemsData } = await supabase
        .from('product_items')
        .select('*')
        .order('created_at', { ascending: false });
      
      setAllItems(itemsData || []);
      toast.success("Données mises à jour");
    } catch (error) {
      toast.error("Erreur lors du rafraîchissement");
      console.error(error);
    } finally {
      setIsRefreshing(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    const loadData = async () => {
      if (!user || !supabase) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const settingsData = await ensureSettings(user.id, supabase);
        setSettings({
          default_currency: settingsData.default_currency as Currency,
          exchange_rates: settingsData.exchange_rates as Record<Currency, number>,
        });
        
        const productsData = await getProducts(supabase);
        setProducts(productsData);
        
        const { data: itemsData } = await supabase
          .from('product_items')
          .select('*')
          .order('created_at', { ascending: false });
        
        setAllItems(itemsData || []);
      } catch (error) {
        toast.error("Échec du chargement de l'inventaire");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user, supabase]);

  // Génération données d'évolution (simplifiée)
  useEffect(() => {
    if (!stats || allItems.length === 0) {
      setEvolutionData([]);
      return;
    }

    const soldItems = allItems.filter(i => i.status === 'vendu');
    
    if (soldItems.length === 0) {
      setEvolutionData([]);
      return;
    }

    // Grouper par date
    const dailyChanges: { [key: string]: { vendu: number; profit: number } } = {};
    
    soldItems.forEach(item => {
      const product = products.find(p => p.id === item.product_id);
      if (!product) return;
      
      const date = new Date(item.updated_at || item.created_at);
      const dayKey = date.toISOString().split("T")[0];
      
      if (!dailyChanges[dayKey]) {
        dailyChanges[dayKey] = { vendu: 0, profit: 0 };
      }
      
      dailyChanges[dayKey].vendu += 1;
      
      const sellingPrice = item.selling_price || product.selling_price || product.estimated_selling_price || 0;
      const purchasePrice = product.purchase_price || 0;
      dailyChanges[dayKey].profit += (sellingPrice - purchasePrice);
    });

    const sortedDays = Object.keys(dailyChanges).sort();
    const cumulativeData: EvolutionData[] = [{ date: "Début", stock: 0, livraison: 0, vendu: 0, profit: 0 }];
    
    let runningTotals = { vendu: 0, profit: 0 };
    
    sortedDays.forEach(dayKey => {
      runningTotals.vendu += dailyChanges[dayKey].vendu;
      runningTotals.profit += dailyChanges[dayKey].profit;
      
      cumulativeData.push({
        date: new Date(dayKey).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
        stock: 0,
        livraison: 0,
        vendu: runningTotals.vendu,
        profit: Math.round(runningTotals.profit),
      });
    });
    
    setEvolutionData(cumulativeData.length > 1 ? cumulativeData : []);
  }, [stats, allItems, products]);

  const openModal = (product: Product | null = null) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const handleSubmitProduct = async (values: ProductFormData) => {
    if (!user || !supabase) {
      toast.error("Connexion requise.");
      return;
    }
    try {
      if (selectedProduct) {
        await updateProduct({ ...selectedProduct, ...values } as Product, user.id, supabase);
        toast.success("Produit modifié !");
      } else {
        await createProduct(values, user.id, supabase);
        toast.success("Produit ajouté !");
      }
      closeModal();
      setTimeout(() => refreshData(), 500);
    } catch (error) {
      toast.error("Échec de la sauvegarde du produit.");
      console.error(error);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!supabase || !confirm("Êtes-vous sûr de vouloir supprimer ce produit ?")) return;
    
    setDeletingProductId(id);
    try {
      await deleteProduct(id, supabase);
      toast.success("Produit supprimé !");
      setTimeout(() => refreshData(), 500);
    } catch (error) {
      toast.error("Échec de la suppression.");
      console.error(error);
    } finally {
      setDeletingProductId(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-full p-2 sm:p-4 lg:p-8 space-y-4 pt-[calc(3rem+env(safe-area-inset-top))] pb-[calc(3rem+env(safe-area-inset-bottom))]">
        <SkeletonLoader type="kpi" count={12} className="mb-6 sm:mb-10" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-full p-4 sm:p-6 lg:p-8 space-y-6 pt-[calc(3rem+env(safe-area-inset-top))] pb-[calc(3rem+env(safe-area-inset-bottom))]">
      {/* Header avec gradient moderne */}
      <div className="flex justify-between items-center mb-6 sm:mb-8 pb-3 sm:pb-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl blur-lg opacity-50"></div>
            <div className="relative p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl">
              <Package className="w-10 h-10 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Tableau de bord
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Vue complète de votre activité • {stats?.totalItems || 0} items au total
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refreshData}
            disabled={isRefreshing}
            className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 p-2 sm:px-4 sm:py-2 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center font-medium active:scale-95 disabled:opacity-50 border border-gray-200 dark:border-gray-700"
          >
            <RefreshCw className={`w-5 h-5 sm:mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>
          <button
            onClick={() => openModal()}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-2 sm:px-5 sm:py-2.5 rounded-xl shadow-lg hover:shadow-2xl transition-all flex items-center font-semibold active:scale-95"
          >
            <Plus className="w-5 h-5 sm:mr-2" />
            <span className="hidden sm:inline">Ajouter</span>
          </button>
        </div>
      </div>

      {/* Grille KPI avec design moderne - 12 cartes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-10">
        
        {/* Ligne 1: Items par statut */}
        <KpiCard
          title="EN STOCK"
          value={stats?.stockItems || 0}
          icon={<Warehouse className="w-6 h-6" />}
          color="blue"
        />
        <KpiCard
          title="EN TRANSIT"
          value={stats?.deliveryItems || 0}
          icon={<Truck className="w-6 h-6" />}
          color="orange"
        />
        <KpiCard
          title="VENDUS"
          value={stats?.soldItems || 0}
          icon={<Archive className="w-6 h-6" />}
          color="green"
        />
        <KpiCard
          title="ROTATION"
          value={stats?.rotationRate || 0}
          fullValue={stats?.rotationRate || 0}
          unit="%"
          icon={<Zap className="w-6 h-6" />}
          color="blue"
          expandable={true}
        />
        <KpiCard
          title="MARGE MOY."
          value={stats?.averageMargin || 0}
          fullValue={stats?.averageMargin || 0}
          unit="%"
          icon={<Percent className="w-6 h-6" />}
          color="indigo"
          expandable={true}
        />
        <KpiCard
          title="GAIN TOTAL"
          value={stats?.totalPotentialProfit || 0}
          fullValue={stats?.totalPotentialProfit || 0}
          unit="Ar"
          icon={<Target className="w-6 h-6" />}
          color="purple"
          expandable={true}
        />

        {/* Ligne 2: Valeurs et Gains */}
        <KpiCard
          title="ACHAT TOTAL"
          value={stats?.totalPurchaseValue || 0}
          fullValue={stats?.totalPurchaseValue || 0}
          unit="Ar"
          icon={<ShoppingCart className="w-6 h-6" />}
          color="gray"
          expandable={true}
        />
        <KpiCard
          title="VALEUR STOCK"
          value={stats?.stockPurchaseValue || 0}
          fullValue={stats?.stockPurchaseValue || 0}
          unit="Ar"
          icon={<Coins className="w-6 h-6" />}
          color="yellow"
          expandable={true}
        />
        <KpiCard
          title="COÛT VENDUS"
          value={stats?.soldPurchaseCost || 0}
          fullValue={stats?.soldPurchaseCost || 0}
          unit="Ar"
          icon={<MinusCircle className="w-6 h-6" />}
          color="red"
          expandable={true}
        />
        <KpiCard
          title="REVENU RÉEL"
          value={stats?.actualRevenue || 0}
          fullValue={stats?.actualRevenue || 0}
          unit="Ar"
          icon={<DollarSign className="w-6 h-6" />}
          color="green"
          expandable={true}
        />
        <KpiCard
          title="GAIN RÉEL"
          value={stats?.realizedProfit || 0}
          fullValue={stats?.realizedProfit || 0}
          unit="Ar"
          icon={<TrendingUp className="w-6 h-6" />}
          color={(stats?.realizedProfit || 0) >= 0 ? "green" : "red"}
          expandable={true}
        />
        <KpiCard
          title="GAIN POTENTIEL"
          value={stats?.potentialProfit || 0}
          fullValue={stats?.potentialProfit || 0}
          unit="Ar"
          icon={<TrendingDown className="w-6 h-6" />}
          color="blue"
          expandable={true}
        />
      </div>

      {/* Graphique avec design moderne */}
      <div className="mb-6 sm:mb-10 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-4 sm:p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-xl">
            <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200">
              Évolution des Ventes et Bénéfices
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Suivi cumulé de vos performances
            </p>
          </div>
        </div>
        <ValueChart data={evolutionData} defaultCurrency={defaultCurrency} />
      </div>

      {/* Section produits récents avec design amélioré */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-xl">
              <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200">
              Derniers produits ajoutés
            </h2>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            {recentProducts.length} produit{recentProducts.length > 1 ? 's' : ''}
          </span>
        </div>

        {recentProducts.length === 0 ? (
          <div className="text-center py-16 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
            <div className="relative inline-block mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full blur-xl opacity-20"></div>
              <div className="relative p-6 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-full">
                <Package className="w-16 h-16 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">
              Aucun produit
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Commencez à ajouter des produits pour suivre votre inventaire
            </p>
            <button
              onClick={() => openModal()}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-2xl transition-all font-semibold active:scale-95"
            >
              <Plus className="w-5 h-5" />
              Ajouter un produit
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {recentProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={openModal}
                onDelete={handleDeleteProduct}
                isDeleting={deletingProductId === product.id}
                defaultCurrency={defaultCurrency}
                exchangeRates={exchangeRates}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modale avec style amélioré */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSubmit={handleSubmitProduct}
        product={selectedProduct || undefined}
        defaultCurrency={defaultCurrency}
        exchangeRates={exchangeRates}
      />
    </div>
  );
}
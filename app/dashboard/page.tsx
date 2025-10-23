// app/dashboard/page.tsx - DASHBOARD REVENDEUR COMPLET (Corrigé)
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Product, ProductFormData, Settings, Currency } from "@/types";
import { getProducts, updateProduct, deleteProduct, createProduct, ensureSettings } from "@/services/products";
import { Plus, Package, RefreshCw, TrendingUp, Percent, Archive, Warehouse, Truck, Coins, DollarSign, TrendingDown, ShoppingCart, Target, Zap, MinusCircle } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import ProductFormModal from "@/components/modals/ProductFormModal";
import SkeletonLoader from "@/components/SkeletonLoader";
import KpiCard from "@/components/KpiCard";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import ValueChart, { EvolutionData } from "@/components/ValueChart";
import { convertProductsToDefaultCurrency, formatPrice, convertToDefaultCurrency } from "@/services/currency";

// CORRECTION : Définition d'un type pour les statistiques pour le useState
type ResellerStats = {
  totalItems: number;
  stockItems: number;
  livraisonItems: number;
  venduItems: number;
  totalProducts: number;
  totalPurchaseValue: number;
  stockPurchaseValue: number;
  totalEstimatedSaleValue: number;
  stockEstimatedValue: number;
  realRevenue: number;
  realCost: number; // Ajouté pour le KPI
  realProfit: number;
  potentialProfit: number;
  totalPotential: number;
  averageMargin: number;
  rotationRate: number;
};

export default function DashboardPage() {
  const { user, supabase } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [evolutionData, setEvolutionData] = useState<EvolutionData[]>([]);

  // CORRECTION : Ajout d'un useState pour les statistiques calculées en async
  const [resellerStats, setResellerStats] = useState<ResellerStats | null>(null);

  const defaultCurrency = (settings?.default_currency || "MGA") as Currency;
  const exchangeRates = useMemo<Record<Currency, number>>(() => {
    if (!settings?.exchange_rates || typeof settings.exchange_rates !== 'object') {
      return { MGA: 1, USD: 1, EUR: 1, GBP: 1 };
    }
    return settings.exchange_rates as Record<Currency, number>;
  }, [settings?.exchange_rates]);

  // Produits par statut (inchangé)
  const productsByStatus = useMemo(() => {
    return {
      stock: products.filter(p => p.status === 'stock'),
      livraison: products.filter(p => p.status === 'livraison'),
      vendu: products.filter(p => p.status === 'vendu'),
    };
  }, [products]);

  // ----------------------------------------------------------------
  // CORRECTION : Logique des statistiques déplacée de useMemo vers useEffect
  // Ceci est nécessaire car useMemo ne peut pas être 'async'
  // ----------------------------------------------------------------
  useEffect(() => {
    const calculateStats = async () => {
      if (products.length === 0 || !settings) {
        setResellerStats(null);
        return;
      }

      // Comptage des items par statut
      const totalItems = products.reduce((sum, p) => sum + (p.quantity || 0), 0);
      const stockItems = productsByStatus.stock.reduce((sum, p) => sum + (p.quantity || 0), 0);
      const livraisonItems = productsByStatus.livraison.reduce((sum, p) => sum + (p.quantity || 0), 0);
      const venduItems = productsByStatus.vendu.reduce((sum, p) => sum + (p.quantity || 0), 0);

      // Valeur totale d'achat (tout l'inventaire en MGA)
      let totalPurchaseValue = 0;
      // CORRECTION : Utilisation de 'for...of' pour permettre 'await'
      for (const p of products) {
        const qty = p.quantity || 0;
        const purchasePrice = p.purchase_price || 0;
        const convertedPrice = await convertToDefaultCurrency(
          purchasePrice,
          (p.currency || defaultCurrency) as Currency,
          defaultCurrency,
          exchangeRates
        );
        totalPurchaseValue += convertedPrice * qty;
      }

      // Valeur estimée de vente (tout l'inventaire)
      let totalEstimatedSaleValue = 0;
      products.forEach(p => {
        const qty = p.quantity || 0;
        const salePrice = p.estimated_selling_price || 0;
        totalEstimatedSaleValue += salePrice * qty;
      });

      // Valeur stock uniquement (en MGA)
      let stockPurchaseValue = 0;
      let stockEstimatedValue = 0;
      // CORRECTION : Utilisation de 'for...of' pour permettre 'await'
      for (const p of productsByStatus.stock) {
        const qty = p.quantity || 0;
        const purchasePrice = p.purchase_price || 0;
        const convertedPrice = await convertToDefaultCurrency(
          purchasePrice,
          (p.currency || defaultCurrency) as Currency,
          defaultCurrency,
          exchangeRates
        );
        stockPurchaseValue += convertedPrice * qty;
        stockEstimatedValue += (p.estimated_selling_price || 0) * qty;
      }

      // Revenu réel (produits vendus)
      let realRevenue = 0;
      let realCost = 0;
      // CORRECTION : Utilisation de 'for...of' pour permettre 'await'
      for (const p of productsByStatus.vendu) {
        const qty = p.quantity || 0;
        const purchasePrice = p.purchase_price || 0;
        const convertedPrice = await convertToDefaultCurrency(
          purchasePrice,
          (p.currency || defaultCurrency) as Currency,
          defaultCurrency,
          exchangeRates
        );
        realCost += convertedPrice * qty;
        // Utilise le prix de vente réel s'il existe, sinon l'estimé
        realRevenue += (p.selling_price || p.estimated_selling_price || 0) * qty;
      }

      const realProfit = realRevenue - realCost;

      // Gain potentiel sur stock
      const potentialProfit = stockEstimatedValue - stockPurchaseValue;
      
      // Gain total (réel + potentiel)
      const totalPotential = realProfit + potentialProfit;

      // Marge moyenne globale
      const totalValidProducts = products.filter(p =>
        p.purchase_price && p.purchase_price > 0 &&
        p.estimated_selling_price && p.estimated_selling_price > 0
      );

      let totalMarginPercentage = 0;
      // CORRECTION : Utilisation de 'for...of' pour permettre 'await'
      for (const p of totalValidProducts) {
        const purchasePrice = await convertToDefaultCurrency(
          p.purchase_price,
          (p.currency || defaultCurrency) as Currency,
          defaultCurrency,
          exchangeRates
        );
        const salePrice = p.estimated_selling_price || 0; // Marge basée sur l'estimé
        if (purchasePrice > 0) {
          totalMarginPercentage += ((salePrice - purchasePrice) / purchasePrice) * 100;
        }
      }
      const averageMargin = totalValidProducts.length > 0
        ? totalMarginPercentage / totalValidProducts.length
        : 0;

      // Taux de rotation (% vendus par rapport au total)
      const rotationRate = totalItems > 0 ? (venduItems / totalItems) * 100 : 0;

      // CORRECTION : Stockage des stats dans le useState
      setResellerStats({
        totalItems,
        stockItems,
        livraisonItems,
        venduItems,
        totalProducts: products.length,
        totalPurchaseValue: Math.round(totalPurchaseValue),
        stockPurchaseValue: Math.round(stockPurchaseValue),
        totalEstimatedSaleValue: Math.round(totalEstimatedSaleValue),
        stockEstimatedValue: Math.round(stockEstimatedValue),
        realRevenue: Math.round(realRevenue),
        realCost: Math.round(realCost), // Ajouté
        realProfit: Math.round(realProfit),
        potentialProfit: Math.round(potentialProfit),
        totalPotential: Math.round(totalPotential), // Ajouté
        averageMargin: Math.round(averageMargin * 10) / 10,
        rotationRate: Math.round(rotationRate * 10) / 10,
      });
    };

    calculateStats();
  }, [products, productsByStatus, defaultCurrency, exchangeRates, settings]); // Dépendances du calcul

  // --- Fin de la correction des stats ---

  const refreshData = useCallback(async () => {
    if (!user || !supabase) return;
    setIsRefreshing(true);
    try {
      const settingsData = await ensureSettings(user.id, supabase);
      setSettings(settingsData);
      const productsData = (await getProducts(supabase)) as Product[];
      setProducts(productsData);
      toast.success("Données mises à jour");
    } catch (error) {
      toast.error("Erreur lors du rafraîchissement : " + error);
    } finally {
      setIsRefreshing(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    const loadData = async () => {
      if (!user || !supabase) {
        setLoading(false);
        setProducts([]);
        setSettings(null);
        return;
      }
      setLoading(true);
      try {
        const settingsData = await ensureSettings(user.id, supabase);
        setSettings(settingsData);
        const productsData = await getProducts(supabase);
        setProducts(productsData);
      } catch (error) {
        toast.error("Échec du chargement de l'inventaire : " + error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user, supabase]);

  // ----------------------------------------------------------------
  // CORRECTION : Graphique d'évolution simplifié et corrigé
  // Se base uniquement sur les produits VENDUS pour un suivi
  // chronologique correct du profit et du volume des ventes.
  // ----------------------------------------------------------------
  useEffect(() => {
    const generateProfitEvolution = async () => {
      if (productsByStatus.vendu.length === 0 || !settings || Object.keys(exchangeRates).length === 0) {
        setEvolutionData([]);
        return;
      }

      const soldProducts = productsByStatus.vendu;

      // Trie les produits vendus par date (en supposant que updated_at = date de vente)
      const sortedSoldProducts = [...soldProducts].sort((a, b) =>
        new Date(a.updated_at || a.created_at).getTime() -
        new Date(b.updated_at || b.created_at).getTime()
      );

      const dailyChanges: { [key: string]: { vendu: number; profit: number } } = {};

      for (const product of sortedSoldProducts) {
        const date = new Date(product.updated_at || product.created_at);
        const dayKey = date.toISOString().split("T")[0];

        if (!dailyChanges[dayKey]) {
          dailyChanges[dayKey] = { vendu: 0, profit: 0 };
        }

        const qty = product.quantity || 1;
        const purchasePrice = await convertToDefaultCurrency(
          product.purchase_price || 0,
          product.currency || defaultCurrency,
          defaultCurrency,
          exchangeRates
        );
        const sellingPrice = product.selling_price || product.estimated_selling_price || 0;
        const profit = (sellingPrice - purchasePrice) * qty;
        
        dailyChanges[dayKey].vendu += qty;
        dailyChanges[dayKey].profit += profit;
      }

      const sortedDays = Object.keys(dailyChanges).sort();
      const cumulativeData: EvolutionData[] = [];
      let runningTotals = { vendu: 0, profit: 0 };

      // Ajoute un point de départ
      cumulativeData.push({ date: "Début", stock: 0, livraison: 0, vendu: 0, profit: 0 });

      for (const dayKey of sortedDays) {
        runningTotals.vendu += dailyChanges[dayKey].vendu;
        runningTotals.profit += dailyChanges[dayKey].profit;

        cumulativeData.push({
          date: new Date(dayKey).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
          stock: 0, // Simplifié : on ne montre que les ventes et le profit
          livraison: 0, // Simplifié
          vendu: runningTotals.vendu,
          profit: Math.round(runningTotals.profit),
        });
      }
      
      // Gère le cas où il n'y a qu'un seul jour de données (en plus de "Début")
      if (cumulativeData.length === 2) {
         setEvolutionData(cumulativeData);
      } else if (cumulativeData.length > 2) {
         setEvolutionData(cumulativeData);
      } else {
         // Si "Début" est le seul point, n'affiche rien
         setEvolutionData([]);
      }
    };

    generateProfitEvolution();
  }, [productsByStatus.vendu, settings, defaultCurrency, exchangeRates]); // Se base que sur les produits vendus

  // --- Fin de la correction du graphique ---


  const recentProducts = useMemo(() => products.slice(0, 8), [products]);

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
      toast.error("Échec de la sauvegarde du produit. : " + error);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!supabase) {
      toast.error("Client Supabase indisponible.");
      return;
    }
    setDeletingProductId(id);
    try {
      await deleteProduct(id, supabase);
      toast.success("Produit supprimé !");
      setTimeout(() => refreshData(), 500);
    } catch (error) {
      toast.error("Échec de la suppression. : " + error);
    } finally {
      setDeletingProductId(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-full p-2 sm:p-4 lg:p-8 space-y-4 pt-[calc(3rem+env(safe-area-inset-top))] pb-[calc(3rem+env(safe-area-inset-bottom))]">
        {/* CORRECTION : Augmentation du nombre de skeletons à 12 */}
        <SkeletonLoader type="kpi" count={12} className="mb-6 sm:mb-10" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-full p-4 sm:p-6 lg:p-8 space-y-6 pt-[calc(3rem+env(safe-area-inset-top))] pb-[calc(3rem+env(safe-area-inset-bottom))]">
      {/* Header (inchangé) */}
      <div className="flex justify-between items-center mb-6 sm:mb-8 border-b pb-3 sm:pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Tableau de bord Revendeur
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Vue complète de votre activité commerciale
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refreshData}
            disabled={isRefreshing}
            className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 p-2 sm:px-4 sm:py-2 rounded-full shadow hover:bg-gray-200 dark:hover:bg-gray-700 transition flex items-center font-medium active:scale-[0.98] disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 sm:mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>
          <button
            onClick={() => openModal()}
            className="bg-indigo-600 text-white p-2 sm:px-5 sm:py-2.5 rounded-full shadow-lg hover:bg-indigo-700 transition flex items-center font-medium active:scale-[0.98]"
          >
            <Plus className="w-5 h-5 sm:mr-2" />
            <span className="hidden sm:inline">Ajouter</span>
          </button>
        </div>
      </div>

      {/* CORRECTION : Grille de KPI mise à jour pour 12 cartes (xl:grid-cols-6) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-10">
        
        {/* Ligne 1: Statuts des items */}
        <KpiCard
          title="EN STOCK"
          value={resellerStats?.stockItems || 0}
          icon={<Warehouse className="w-6 h-6" />}
          color="blue"
        />
        <KpiCard
          title="EN TRANSIT"
          value={resellerStats?.livraisonItems || 0}
          icon={<Truck className="w-6 h-6" />}
          color="orange"
        />
        <KpiCard
          title="VENDUS"
          value={resellerStats?.venduItems || 0}
          icon={<Archive className="w-6 h-6" />}
          color="green"
        />
        <KpiCard
          title="ROTATION"
          value={resellerStats?.rotationRate || 0}
          fullValue={resellerStats?.rotationRate || 0}
          unit="%"
          icon={<Zap className="w-6 h-6" />}
          color="blue"
          expandable={true}
        />
        <KpiCard
          title="MARGE MOY."
          value={resellerStats?.averageMargin || 0}
          fullValue={resellerStats?.averageMargin || 0}
          unit="%"
          icon={<Percent className="w-6 h-6" />}
          color="indigo"
          expandable={true}
        />
        <KpiCard
          title="GAIN TOTAL"
          value={resellerStats?.totalPotential || 0}
          fullValue={resellerStats?.totalPotential || 0}
          unit="Ar"
          icon={<Target className="w-6 h-6" />}
          color="purple"
          expandable={true}
        />

        {/* Ligne 2: Valeurs et Gains */}
         <KpiCard
          title="ACHAT TOTAL"
          value={resellerStats?.totalPurchaseValue || 0}
          fullValue={resellerStats?.totalPurchaseValue || 0}
          unit="Ar"
          icon={<ShoppingCart className="w-6 h-6" />}
          color="gray"
          expandable={true}
        />
        <KpiCard
          title="VALEUR STOCK"
          value={resellerStats?.stockPurchaseValue || 0}
          fullValue={resellerStats?.stockPurchaseValue || 0}
          unit="Ar"
          icon={<Coins className="w-6 h-6" />}
          color="yellow"
          expandable={true}
        />
        <KpiCard
          title="COÛT VENDUS"
          value={resellerStats?.realCost || 0}
          fullValue={resellerStats?.realCost || 0}
          unit="Ar"
          icon={<MinusCircle className="w-6 h-6" />}
          color="red"
          expandable={true}
        />
         <KpiCard
          title="REVENU RÉEL"
          value={resellerStats?.realRevenue || 0}
          fullValue={resellerStats?.realRevenue || 0}
          unit="Ar"
          icon={<DollarSign className="w-6 h-6" />}
          color="green"
          expandable={true}
        />
        <KpiCard
          title="GAIN RÉEL"
          value={resellerStats?.realProfit || 0}
          fullValue={resellerStats?.realProfit || 0}
          unit="Ar"
          icon={<TrendingUp className="w-6 h-6" />}
          color={(resellerStats?.realProfit || 0) >= 0 ? "green" : "red"}
          expandable={true}
        />
        <KpiCard
          title="GAIN POTENTIEL"
          value={resellerStats?.potentialProfit || 0}
          fullValue={resellerStats?.potentialProfit || 0}
          unit="Ar"
          icon={<TrendingDown className="w-6 h-6" />} // Potentiel = pas encore réalisé
          color="blue"
          expandable={true}
        />
      </div>

      {/* Graphique (inchangé, il lira les nouvelles 'evolutionData') */}
      <div className="mb-6 sm:mb-10 bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-lg">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200 mb-3 sm:mb-4 border-b pb-2 sm:pb-3">
          Évolution des Ventes et Bénéfices (Cumulés)
        </h2>
        <ValueChart data={evolutionData} defaultCurrency={defaultCurrency} />
      </div>

      {/* Produits récents (inchangé) */}
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 border-b pb-2 sm:pb-3">
        8 derniers produits ajoutés
      </h2>
      {recentProducts.length === 0 ? (
        <div className="text-center py-8 sm:py-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 font-medium">
            Aucun produit n&apos;a été ajouté pour l&apos;instant.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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

      {/* Modale (inchangée) */}
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
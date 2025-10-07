// app/dashboard/page.tsx (ou page.tsx selon votre structure)
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Product, ProductFormData, Settings, Currency } from "@/types";
import { getProducts, updateProduct, deleteProduct, createProduct, ensureSettings } from "@/services/products";
import { Plus, Package, RefreshCw, TrendingUp, Percent, Archive, Warehouse, Truck, Coins } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import ProductFormModal from "@/components/modals/ProductFormModal";
import SkeletonLoader from "@/components/SkeletonLoader";
import KpiCard from "@/components/KpiCard";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import ValueChart from "@/components/ValueChart";
import { convertProductsToDefaultCurrency, formatPrice, convertToDefaultCurrency } from "@/services/currency";

export default function DashboardPage() {
  const { user, supabase } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [monetaryStats, setMonetaryStats] = useState({ purchaseValue: 0, estimatedSaleValue: 0 });
  const [profitStats, setProfitStats] = useState({ realizedProfit: 0, averageMargin: 0 });
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const defaultCurrency = (settings?.default_currency || 'MGA') as Currency;
  
  // 🔥 CORRECTION: Typage strict et valeur par défaut
  const exchangeRates = useMemo<Record<Currency, number>>(() => {
    if (!settings?.exchange_rates || typeof settings.exchange_rates !== 'object') {
      return { MGA: 1, USD: 1, EUR: 1, GBP: 1 };
    }
    return settings.exchange_rates as Record<Currency, number>;
  }, [settings?.exchange_rates]);

  const refreshData = useCallback(async () => {
    if (!user || !supabase) return;

    setIsRefreshing(true);
    try {
      const settingsData = await ensureSettings(user.id, supabase);
      setSettings(settingsData);
      const productsData = await getProducts(supabase) as Product[];
      setProducts(productsData);
      toast.success("Données mises à jour");
    } catch (error) {
      toast.error("Erreur lors du rafraîchissement");
      console.error(error);
    } finally {
      setIsRefreshing(false);
    }
  }, [user, supabase]);

  // Chargement initial
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
        toast.error("Échec du chargement de l'inventaire.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, supabase]);

  // Statistiques de comptage
  const countStats = useMemo(() => {
    let totalProducts = 0;
    let inStock = 0;
    let pendingSale = 0;

    products.forEach(p => {
      const qty = p.quantity || 1;
      totalProducts += qty;
      if (p.status === 'stock') inStock += qty;
      else if (p.status === 'livraison') pendingSale += qty;
    });

    return { totalProducts, inStock, pendingSale };
  }, [products]);

  const recentProducts = useMemo(() => products.slice(0, 8), [products]);

  // Données graphique

// app/dashboard/page.tsx (autour de la ligne 153)

  // Données graphique
  type ChartData = {
    date: string; // Nom du produit sur l'axe X
    purchaseValue: number; // Prix unitaire converti
    estimatedSaleValue: number; // Prix unitaire (déjà en MGA)
  };

  const [chartData, setChartData] = useState<ChartData[]>([]);

  // 🔥 NOUVEL EFFECT : Comparaison unitaire des 8 derniers produits
  useEffect(() => {
    const generateUnitChartData = async () => {
      const chartArray: ChartData[] = [];
      
      for (const p of recentProducts) {
        const productCurrency = (p.currency || defaultCurrency) as Currency;

        // 1. Valeur d'achat (Conversion unitaire nécessaire)
        const purchasePriceConverted = await convertToDefaultCurrency(
          parseFloat(String(p.purchase_price)) || 0,
          productCurrency,
          defaultCurrency,
          exchangeRates
        );
        
        // 2. Valeur de vente estimée (AUCUNE conversion - déjà en MGA, Valeur unitaire)
        const estimatedSalePriceValue = parseFloat(String(p.estimated_selling_price)) || 0;


        chartArray.push({
          date: p.name, 
          // Valeurs UNITAIRES (sans multiplication par la quantité)
          purchaseValue: purchasePriceConverted,
          estimatedSaleValue: estimatedSalePriceValue,
        });
      }
      
      // On affiche du plus ancien au plus récent des 8
      setChartData(chartArray.reverse());
    };

    if (recentProducts.length > 0) {
      generateUnitChartData();
    } else {
      setChartData([]);
    }
  }, [recentProducts, defaultCurrency, exchangeRates]); 

// ...

//    ////

  const openModal = (product: Product | null = null) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const soldProducts = useMemo(() => {
    return products.filter(p => p.status === 'vendu');
  }, [products]);

  const [top3SoldProducts, setTop3SoldProducts] = useState<Array<Product & { revenue: number }>>([]);

  // Calcul des statistiques monétaires
  useEffect(() => {
    if (products.length === 0 || !settings || Object.keys(exchangeRates).length === 0) {
      setMonetaryStats({ purchaseValue: 0, estimatedSaleValue: 0 });
      setProfitStats({ realizedProfit: 0, averageMargin: 0 });
      return;
    }

    const calculateStats = async () => {
      try {
        const { purchaseValue, estimatedSaleValue } = await convertProductsToDefaultCurrency(
          products,
          defaultCurrency,
          exchangeRates
        );

        let realizedProfit = 0;

        for (const product of soldProducts) {
          const quantity = Math.max(1, product.quantity || 1);

          const purchasePriceConverted = await convertToDefaultCurrency(
            product.purchase_price || 0,
            product.currency || defaultCurrency,
            defaultCurrency,
            exchangeRates
          );

          const sellingPrice = product.selling_price ?? product.estimated_selling_price ?? 0;
          const unitProfit = sellingPrice - purchasePriceConverted;
          const totalProductProfit = unitProfit * quantity;
          realizedProfit += totalProductProfit;
        }

        let totalMargin = 0;
        let validProductsForMargin = 0;

        for (const product of products) {
          if (product.purchase_price > 0 && product.estimated_selling_price && product.estimated_selling_price > 0) {
            const purchasePriceConverted = await convertToDefaultCurrency(
              product.purchase_price,
              product.currency || defaultCurrency,
              defaultCurrency,
              exchangeRates
            );

            const sellingPriceConverted = product.estimated_selling_price;

            if (purchasePriceConverted > 0) {
              const margin = ((sellingPriceConverted - purchasePriceConverted) / purchasePriceConverted);
              totalMargin += margin;
              validProductsForMargin++;
            }
          }
        }

        const averageMargin = validProductsForMargin > 0 ? (totalMargin / validProductsForMargin) * 100 : 0;

        setMonetaryStats({ purchaseValue, estimatedSaleValue });
        setProfitStats({
          realizedProfit: Math.round(realizedProfit * 100) / 100,
          averageMargin: Math.round(averageMargin * 10) / 10
        });
      } catch (error) {
        console.error("Erreur calcul stats:", error);
        toast.error("Erreur lors du calcul des statistiques.");
        setMonetaryStats({ purchaseValue: 0, estimatedSaleValue: 0 });
        setProfitStats({ realizedProfit: 0, averageMargin: 0 });
      }
    };

    calculateStats();
  }, [products, settings, defaultCurrency, exchangeRates, soldProducts]);

  // Top 3 produits vendus
  useEffect(() => {
    if (soldProducts.length === 0) {
      setTop3SoldProducts([]);
      return;
    }

    const calculateTop3 = async () => {
      const productsWithRevenue = [];

      for (const product of soldProducts) {
        const quantity = Math.max(1, product.quantity || 1);
        const sellingPrice = product.selling_price ?? product.estimated_selling_price ?? 0;
        const revenue = sellingPrice * quantity;

        productsWithRevenue.push({ ...product, revenue });
      }

      const top3 = productsWithRevenue
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 3);

      setTop3SoldProducts(top3);
    };

    calculateTop3();
  }, [soldProducts]);

  const maxRevenue = top3SoldProducts.length > 0 ? top3SoldProducts[0].revenue : 1;

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
      toast.error("Échec de la suppression.");
      console.error(error);
    } finally {
      setDeletingProductId(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto max-w-full p-2 sm:p-4 lg:p-8 space-y-4 pt-[calc(3rem+env(safe-area-inset-top))] pb-[calc(3rem+env(safe-area-inset-bottom))]">
        <div className="flex justify-between items-center mb-6 sm:mb-8 border-b pb-3 sm:pb-4">
          <div className="h-8 sm:h-10 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="flex gap-2">
            <div className="h-8 sm:h-10 w-8 sm:w-24 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-8 sm:h-10 w-8 sm:w-20 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </div>
        <SkeletonLoader type="kpi" count={6} className="mb-6 sm:mb-10" />
        <SkeletonLoader type="podium" className="mb-6 sm:mb-10" />
        <SkeletonLoader type="chart" className="mb-6 sm:mb-10" />
        <div className="h-6 bg-gray-200 rounded w-64 mb-4 animate-pulse"></div>
        <SkeletonLoader type="card" count={8} />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-full p-4 sm:p-6 lg:p-8 space-y-6 pt-[calc(3rem+env(safe-area-inset-top))] pb-[calc(3rem+env(safe-area-inset-bottom))]">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 sm:mb-8 border-b pb-3 sm:pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight truncate">
          Tableau de bord
        </h1>
        <div className="flex gap-2">
          <button
            onClick={refreshData}
            disabled={isRefreshing}
            className="bg-gray-100 text-gray-700 p-2 sm:px-4 sm:py-2 rounded-full shadow hover:bg-gray-200 transition duration-150 flex items-center justify-center sm:justify-start font-medium active:scale-[0.98] disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 sm:mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>
          <button
            onClick={() => openModal()}
            className="bg-indigo-600 text-white p-2 sm:px-5 sm:py-2.5 rounded-full shadow-lg hover:bg-indigo-700 transition duration-150 flex items-center justify-center sm:justify-start font-medium active:scale-[0.98]"
          >
            <Plus className="w-5 h-5 sm:mr-2" />
            <span className="hidden sm:inline">Ajouter</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-10">
        <KpiCard title="TOTAL" value={countStats.totalProducts} icon={<Archive className="w-6 h-6" />} color="gray" />
        <KpiCard title="STOCK" value={countStats.inStock} icon={<Warehouse className="w-6 h-6" />} color="blue" />
        <KpiCard title="TRANSIT" value={countStats.pendingSale} icon={<Truck className="w-6 h-6" />} color="orange" />
        <KpiCard title="VALEUR" value={monetaryStats.purchaseValue} fullValue={monetaryStats.purchaseValue} unit={defaultCurrency} icon={<Coins className="w-6 h-6" />} color="yellow" expandable={true} />
        <KpiCard title="GAIN" value={profitStats.realizedProfit} fullValue={profitStats.realizedProfit} unit={defaultCurrency} icon={<TrendingUp className="w-6 h-6" />} color="green" expandable={true} />
        <KpiCard title="MARGE" value={profitStats.averageMargin} fullValue={profitStats.averageMargin} unit="%" icon={<Percent className="w-6 h-6" />} color="indigo" expandable={true} />
      </div>

      {/* Podium Top 3 */}
      {top3SoldProducts.length > 0 && (
        <div className="mb-6 sm:mb-10 bg-white p-4 sm:p-6 rounded-xl shadow-lg overflow-x-auto">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4 border-b pb-2 sm:pb-3">
            Top 3 des Produits Vendus
          </h2>
          <div className="flex justify-around items-end gap-3 sm:gap-4 pt-2 h-[200px] sm:h-[250px]">
            {top3SoldProducts.map((product, index) => {
              const barHeight = Math.max(15, (product.revenue / maxRevenue) * 100);
              return (
                <div
                  key={product.id}
                  className={`flex flex-col justify-end w-1/3 text-center ${index === 0 ? 'order-2' : index === 1 ? 'order-1' : 'order-3'}`}
                >
                  <div className="mb-1 sm:mb-2">
                    <p className="font-bold text-sm truncate">{product.name}</p>
                    <p className="text-xs text-gray-600">{formatPrice(product.revenue, defaultCurrency)}</p>
                  </div>
                  <div
                    className="bg-indigo-500 rounded-t-lg transition-all duration-500"
                    style={{ height: `${barHeight}%` }}
                  >
                    <span className="font-extrabold text-xl sm:text-2xl text-white drop-shadow-md">
                      #{index + 1}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Graphique */}
      <div className="mb-6 sm:mb-10 bg-white p-4 sm:p-6 rounded-xl shadow-lg overflow-x-auto">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4 border-b pb-2 sm:pb-3">
          Valeur des 8 derniers produits
        </h2>
        <ValueChart data={chartData} defaultCurrency={defaultCurrency} />
      </div>

      {/* Produits récents */}
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 border-b pb-2 sm:pb-3">
        8 derniers produits ajoutés
      </h2>

      {recentProducts.length === 0 ? (
        <div className="text-center py-8 sm:py-12 bg-white rounded-xl shadow-lg border border-gray-100">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-base sm:text-lg text-gray-600 font-medium">
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

      {/* Modale */}
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
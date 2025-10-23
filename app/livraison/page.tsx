// app/livraison/page.tsx - VERSION CORRIGÉE avec calculs basés sur les ITEMS en livraison
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Product, Currency, ProductFormData} from "@/types";
import { ProductItem } from "@/types/productItem";
import { Client, ClientFormData } from "@/types/client";
import ProductCard from "@/components/ProductCard";
import ProductItemsModal from "@/components/modals/ProductItemsModal";
import { getProducts, ensureSettings, updateProduct } from "@/services/products";
import { 
  getProductItems, 
  updateMultipleItemsStatus
} from "@/services/productItems";
import { getAllClients, getClientByProductId, createClient, updateClient, deleteClient } from "@/services/clients";
import { Truck, Package, Clock, TrendingUp, Filter, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import ProductFormModal from "@/components/modals/ProductFormModal";
import ClientModal from "@/components/modals/ClientModal";
import DeliveryCalendar from "@/components/DeliveryCalendar";
import { Button } from "@/components/ui/button";
import MobileCalendarSheet from "@/components/MobileCalendarSheet";

// (Le code des Skeletons reste inchangé)

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

const CalendarSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 animate-pulse">
    <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-48 mb-4"></div>
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
      ))}
    </div>
  </div>
);

// --- Début des modifications majeures ---

// Nouveau type pour les produits enrichis avec la quantité réelle en livraison
type DeliveryProduct = Product & {
  delivery_quantity: number;
};

export default function LivraisonPage() {
  const { user, supabase } = useAuth();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  // NOUVEL ÉTAT pour stocker tous les items en statut 'livraison'
  const [deliveryItems, setDeliveryItems] = useState<ProductItem[]>([]);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  
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

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showCalendar] = useState(false);

  // États pour la gestion unitaire des items
  const [itemsModalOpen, setItemsModalOpen] = useState(false);
  const [selectedProductForItems, setSelectedProductForItems] = useState<Product | null>(null);
  const [productItems, setProductItems] = useState<ProductItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  const defaultCurrency = (settings?.default_currency || 'MGA') as Currency;
  const exchangeRates = useMemo<Record<Currency, number>>(() => {
    if (!settings?.exchange_rates || typeof settings.exchange_rates !== 'object') {
      return { MGA: 1, USD: 1, EUR: 1, GBP: 1 };
    }
    return settings.exchange_rates as Record<Currency, number>;
  }, [settings?.exchange_rates]);

  // NOUVEAU: Liste des produits enrichis avec la quantité réelle d'items en livraison
  const deliveryProductsWithQuantities = useMemo<DeliveryProduct[]>(() => {
    const itemCounts = deliveryItems.reduce((acc, item) => {
      acc[item.product_id] = (acc[item.product_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return allProducts
      .filter(p => itemCounts[p.id] > 0) // Ne garde que les produits qui ont au moins 1 item en livraison
      .map(p => ({
        ...p,
        // La quantité affichée doit être la quantité réelle d'items en livraison
        delivery_quantity: itemCounts[p.id] || 0,
        // On conserve la 'quantity' originale pour d'autres usages, mais on se base sur delivery_quantity pour l'affichage
      })) as DeliveryProduct[];
  }, [allProducts, deliveryItems]);


  // REMPLACEMENT de deliveryProducts par deliveryProductsWithQuantities
  const deliveryProducts = deliveryProductsWithQuantities;


  const filteredProducts = useMemo(() => {
    if (!selectedDate) return deliveryProducts;
    
    // FILTRAGE basé sur les clients
    const clientsForDate = allClients.filter(c => c.delivery_date === selectedDate);
    const productIdsForDate = clientsForDate.map(c => c.product_id);
    
    return deliveryProducts.filter(p => productIdsForDate.includes(p.id));
  }, [deliveryProducts, allClients, selectedDate]);

  const convertToDefaultCurrency = useCallback((amount: number, fromCurrency: Currency): number => {
    if (fromCurrency === defaultCurrency) return amount;
    const rateFrom = exchangeRates[fromCurrency] || 1;
    const rateTo = exchangeRates[defaultCurrency] || 1;
    const amountInEUR = amount / rateFrom;
    return amountInEUR * rateTo;
  }, [defaultCurrency, exchangeRates]);

  // CORRECTION: Calcul des stats sur TOUS les produits en livraison, basé sur delivery_quantity
  const stats = useMemo(() => {
    const totalProducts = deliveryProducts.length; 
    const totalValue = deliveryProducts.reduce((sum, p) => {
      // Utilise la delivery_quantity pour le calcul de la valeur totale
      const price = p.purchase_price || 0;
      const qty = p.delivery_quantity || 0; // UTILISE delivery_quantity
      const productValue = price * qty;
      const convertedValue = convertToDefaultCurrency(productValue, p.currency as Currency);
      return sum + convertedValue;
    }, 0);
    // Utilise la delivery_quantity pour la quantité totale
    const totalQuantity = deliveryProducts.reduce((sum, p) => sum + (p.delivery_quantity || 0), 0); 
    
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

      // MODIFICATION: Fetch en parallèle des produits, des clients, ET des items en livraison
      const [productsData, clientsData, itemsResult] = await Promise.all([
        getProducts(supabase), // Récupère tous les produits de la base (potentiellement tous statuts)
        getAllClients(supabase),
        // Requête directe pour récupérer tous les items en statut 'livraison'
        supabase.from('product_items').select('*').eq('status', 'livraison'), 
      ]);
      
      setAllProducts(productsData);
      setAllClients(clientsData);
      setDeliveryItems(itemsResult.data || []); // Stocke les items en livraison
    } catch (err) {
      toast.error("Erreur lors du chargement des données.");
      console.error("Erreur:", err);
    } finally {
      setLoading(false);
    }
  }, [user, supabase]);

  // Ouvrir la modal de gestion des items
  const handleManageItems = async (product: Product) => {
    // Reste inchangé, il faut toujours charger tous les items pour cette modal.
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

  // Mettre à jour plusieurs items (permet de passer en vendu)
  const handleUpdateItems = async (itemIds: string[], newStatus: string) => {
    // Reste inchangé, mais on s'assure de recharger les données après.
    if (!supabase || !selectedProductForItems) return;

    try {
      await updateMultipleItemsStatus(
        itemIds, 
        newStatus as 'stock' | 'livraison' | 'vendu',
        supabase
      );

      // Recharger les items de la modal
      const updatedItems = await getProductItems(selectedProductForItems.id, supabase);
      setProductItems(updatedItems);

      // Recharger TOUTES les données pour mettre à jour la liste deliveryProductsWithQuantities et les stats
      await loadData();
      
      // Message personnalisé selon le nouveau statut
      if (newStatus === 'vendu') {
        toast.success(`${itemIds.length} item(s) marqué(s) comme vendu(s) !`);
      } else if (newStatus === 'stock') {
        toast.success(`${itemIds.length} item(s) remis en stock !`);
      } else {
        toast.success(`${itemIds.length} item(s) mis à jour !`);
      }
    } catch (error) {
      throw error;
    }
  };

  // Fermer la modal des items
  const closeItemsModal = () => {
    setItemsModalOpen(false);
    setSelectedProductForItems(null);
    setProductItems([]);
  };

  const handleUpdate = async (values: ProductFormData) => {
    if (!user || !supabase || !editingProduct) return;
    
    try {
      // NOTE: La modification d'un produit ne doit pas écraser la 'quantity' agrégée
      const updatedProduct = { ...editingProduct, ...values } as Product;
      await updateProduct(updatedProduct, user.id, supabase);
      toast.success("Produit modifié !");
      loadData();
      closeModal();
    } catch (error) {
      toast.error("Échec de la modification : " + error);
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

  // Le reste des fonctions (handleClientSubmit, handleClientDelete, openModal, closeModal, formatCurrency, getCurrencySymbol, hasClient) reste inchangé
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-white to-amber-50/50 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <div className="container mx-auto max-w-full p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Header amélioré */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl shadow-xl">
                <Truck className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  Produits en Transit
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {selectedDate 
                    ? `Livraisons du ${new Date(selectedDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`
                    : 'Suivez vos produits en cours de livraison (basé sur les items)' // Texte mis à jour
                  }
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {selectedDate && (
                <Button
                  variant="outline"
                  onClick={() => setSelectedDate(null)}
                  className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="w-4 h-4" />
                  <span className="hidden sm:inline">Réinitialiser</span>
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={() => setIsMobileSheetOpen(true)}
                className="flex items-center gap-2 lg:hidden"
              >
                <Filter className="w-4 h-4" />
                Calendrier
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards améliorées - AFFICHENT MAINTENANT TOUS LES PRODUITS EN LIVRAISON (selon items) */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
        ) : deliveryProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-orange-100 dark:border-orange-900/30 hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Total Produits Uniques
                  </p>
                  <p className="text-4xl font-extrabold text-gray-900 dark:text-white">
                    {stats.totalProducts}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    {selectedDate 
                      ? `${filteredProducts.length} produits uniques pour cette date` 
                      : 'articles en transit'
                    }
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 rounded-xl shadow-md">
                  <Package className="w-7 h-7 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-blue-100 dark:border-blue-900/30 hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Quantité Totale (Items)
                  </p>
                  <p className="text-4xl font-extrabold text-gray-900 dark:text-white">
                    {stats.totalQuantity}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    {selectedDate 
                      ? `${filteredProducts.reduce((sum, p) => sum + (p as DeliveryProduct).delivery_quantity, 0)} unités pour cette date` 
                      : 'unités d\'items en transit' // Texte mis à jour
                    }
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl shadow-md">
                  <Clock className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 border border-green-100 dark:border-green-900/30 hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Valeur Totale
                  </p>
                  <p className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white truncate">
                    {formatCurrency(stats.totalValue)} {getCurrencySymbol(defaultCurrency)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    {selectedDate 
                      ? `Valeur filtrée: ${formatCurrency(
                          filteredProducts.reduce((sum, p) => {
                            const dp = p as DeliveryProduct;
                            const price = dp.purchase_price || 0;
                            const qty = dp.delivery_quantity || 0; // UTILISE delivery_quantity
                            const productValue = price * qty;
                            const convertedValue = convertToDefaultCurrency(productValue, dp.currency as Currency);
                            return sum + convertedValue;
                          }, 0)
                        )} ${getCurrencySymbol(defaultCurrency)}`
                      : `en ${defaultCurrency}`
                    }
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-xl shadow-md flex-shrink-0">
                  <TrendingUp className="w-7 h-7 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Grid avec produits et calendrier */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`${showCalendar ? 'hidden lg:block' : 'block'} lg:col-span-2`}>
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
                <div className="max-w-md mx-auto px-4">
                  <div className="p-6 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-6 shadow-xl">
                    <Truck className="w-16 h-16 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                    {selectedDate ? 'Aucune livraison ce jour' : 'Aucun produit en transit'}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    {selectedDate 
                      ? 'Sélectionnez une autre date dans le calendrier.'
                      : 'Les produits (items) en cours de livraison apparaîtront ici.'
                    }
                  </p>
                  {selectedDate && (
                    <Button
                      onClick={() => setSelectedDate(null)}
                      variant="outline"
                      className="mx-auto"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Voir tous les produits
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {filteredProducts.map((p: DeliveryProduct) => (
                  <ProductCard
                    key={p.id}
                    // Le composant ProductCard doit utiliser p.delivery_quantity pour afficher la quantité
                    // Je m'assure que le ProductCard est bien typé pour recevoir un Product
                    // mais il utilisera p.delivery_quantity si elle existe. 
                    // Pour le moment, je passe juste 'p' et j'assume que ProductCard gère ce nouveau champ.
                    // Si ProductCard n'est pas corrigé, il faudra renommer 'delivery_quantity' en 'quantity' ici.
                    product={{...p, quantity: p.delivery_quantity}} // FORCE la quantité du produit affiché à la quantité d'items en livraison
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
          </div>

          <div className={`${showCalendar ? 'block' : 'hidden lg:block'} lg:col-span-1`}>
            {loading ? (
              <div className="sticky top-24">
                <CalendarSkeleton />
              </div>
            ) : (
              <div className="sticky top-24">
                <DeliveryCalendar
                  clients={allClients}
                  // Les produits pour le calendrier sont tous les produits qui ont des items en livraison
                  products={deliveryProducts} 
                  onDateSelect={setSelectedDate}
                  selectedDate={selectedDate}
                />
              </div>
            )}
          </div>
        </div>

        {selectedDate && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 lg:hidden">
            <Button
              onClick={() => setSelectedDate(null)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-2xl rounded-full px-6 py-3 flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              <span>Filtre actif</span>
              <X className="w-4 h-4" />
            </Button>
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

        {/* Modal de gestion des items */}
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

        <MobileCalendarSheet
          isOpen={isMobileSheetOpen}
          onClose={() => setIsMobileSheetOpen(false)}
          clients={allClients}
          products={deliveryProducts}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />
      </div>
    </div>
  );
}
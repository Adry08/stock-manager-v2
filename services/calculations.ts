// services/calculations.ts
// 🎯 SERVICE CENTRALISÉ POUR TOUS LES CALCULS DE KPI
// Basé sur la structure réelle de la base de données avec product_items

import { Product, Currency } from "@/types";
import { ProductItem } from "@/types/productItem";
import { Client } from "@/types/client";
import { convertToDefaultCurrency } from "./currency";

// ============================================================================
// 📊 TYPES POUR LES STATISTIQUES
// ============================================================================

export interface GlobalStats {
  // Comptage des items
  totalItems: number;
  stockItems: number;
  deliveryItems: number;
  soldItems: number;
  
  // Comptage des produits uniques
  totalProducts: number;
  stockProducts: number;
  deliveryProducts: number;
  soldProducts: number;
  
  // Valeurs financières
  totalPurchaseValue: number;
  stockPurchaseValue: number;
  deliveryPurchaseValue: number;
  soldPurchaseCost: number;
  
  // Valeurs de vente
  totalEstimatedSaleValue: number;
  stockEstimatedValue: number;
  deliveryEstimatedValue: number;
  actualRevenue: number;
  
  // Profits
  realizedProfit: number;
  potentialProfit: number;
  totalPotentialProfit: number;
  
  // Indicateurs
  averageMargin: number;
  rotationRate: number;
  conversionRate: number;
}

export interface PageSpecificStats {
  // Stats spécifiques à chaque page
  totalProducts: number;
  totalQuantity: number;
  totalValue: number;
  totalRevenue?: number;
  totalProfit?: number;
  totalCost?: number;
  lowStockCount?: number;
  pendingDeliveries?: number;
}

// ============================================================================
// 🔧 FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Groupe les items par produit et compte leur quantité
 */
export function groupItemsByProduct(
  items: ProductItem[],
  products: Product[]
): Map<string, { product: Product; itemCount: number; items: ProductItem[] }> {
  const grouped = new Map<string, { product: Product; itemCount: number; items: ProductItem[] }>();
  
  items.forEach(item => {
    const product = products.find(p => p.id === item.product_id);
    if (!product) return;
    
    if (!grouped.has(item.product_id)) {
      grouped.set(item.product_id, {
        product,
        itemCount: 0,
        items: []
      });
    }
    
    const entry = grouped.get(item.product_id)!;
    entry.itemCount++;
    entry.items.push(item);
  });
  
  return grouped;
}

/**
 * Convertit le prix d'achat d'un produit vers la devise par défaut
 */
export async function convertProductPrice(
  product: Product,
  targetCurrency: Currency,
  exchangeRates: Record<Currency, number>
): Promise<number> {
  return await convertToDefaultCurrency(
    product.purchase_price || 0,
    product.currency as Currency,
    targetCurrency,
    exchangeRates
  );
}

// ============================================================================
// 📈 CALCULS GLOBAUX (pour dashboard)
// ============================================================================

/**
 * Calcule toutes les statistiques globales de l'application
 */
export async function calculateGlobalStats(
  products: Product[],
  allItems: ProductItem[],
  defaultCurrency: Currency,
  exchangeRates: Record<Currency, number>
): Promise<GlobalStats> {
  
  // 1️⃣ COMPTAGE DES ITEMS PAR STATUT
  const stockItems = allItems.filter(i => i.status === 'stock');
  const deliveryItems = allItems.filter(i => i.status === 'livraison');
  const soldItems = allItems.filter(i => i.status === 'vendu');
  
  // 2️⃣ COMPTAGE DES PRODUITS UNIQUES (qui ont au moins 1 item dans ce statut)
  const stockProductIds = new Set(stockItems.map(i => i.product_id));
  const deliveryProductIds = new Set(deliveryItems.map(i => i.product_id));
  const soldProductIds = new Set(soldItems.map(i => i.product_id));
  
  // 3️⃣ CALCUL DES VALEURS D'ACHAT
  let totalPurchaseValue = 0;
  let stockPurchaseValue = 0;
  let deliveryPurchaseValue = 0;
  let soldPurchaseCost = 0;
  
  for (const product of products) {
    const convertedPrice = await convertProductPrice(product, defaultCurrency, exchangeRates);
    
    const productStockItems = stockItems.filter(i => i.product_id === product.id).length;
    const productDeliveryItems = deliveryItems.filter(i => i.product_id === product.id).length;
    const productSoldItems = soldItems.filter(i => i.product_id === product.id).length;
    
    stockPurchaseValue += convertedPrice * productStockItems;
    deliveryPurchaseValue += convertedPrice * productDeliveryItems;
    soldPurchaseCost += convertedPrice * productSoldItems;
    totalPurchaseValue += convertedPrice * (productStockItems + productDeliveryItems + productSoldItems);
  }
  
  // 4️⃣ CALCUL DES VALEURS DE VENTE ESTIMÉES
  let totalEstimatedSaleValue = 0;
  let stockEstimatedValue = 0;
  let deliveryEstimatedValue = 0;
  
  products.forEach(product => {
    const estimatedPrice = product.estimated_selling_price || 0;
    
    const productStockItems = stockItems.filter(i => i.product_id === product.id).length;
    const productDeliveryItems = deliveryItems.filter(i => i.product_id === product.id).length;
    const productSoldItems = soldItems.filter(i => i.product_id === product.id).length;
    
    stockEstimatedValue += estimatedPrice * productStockItems;
    deliveryEstimatedValue += estimatedPrice * productDeliveryItems;
    totalEstimatedSaleValue += estimatedPrice * (productStockItems + productDeliveryItems + productSoldItems);
  });
  
  // 5️⃣ CALCUL DU REVENU RÉEL (items vendus avec leur prix de vente réel)
  let actualRevenue = 0;
  
  soldItems.forEach(item => {
    const product = products.find(p => p.id === item.product_id);
    if (!product) return;
    
    // Utilise le selling_price de l'item s'il existe, sinon le prix du produit
    const sellingPrice = item.selling_price || product.selling_price || product.estimated_selling_price || 0;
    actualRevenue += sellingPrice;
  });
  
  // 6️⃣ CALCUL DES PROFITS
  const realizedProfit = actualRevenue - soldPurchaseCost;
  const potentialProfit = stockEstimatedValue - stockPurchaseValue;
  const totalPotentialProfit = realizedProfit + potentialProfit;
  
  // 7️⃣ CALCUL DE LA MARGE MOYENNE
  const productsWithMargin = products.filter(p => 
    p.purchase_price && 
    p.purchase_price > 0 && 
    p.estimated_selling_price && 
    p.estimated_selling_price > 0
  );
  
  let totalMarginPercentage = 0;
  for (const product of productsWithMargin) {
    const purchasePrice = await convertProductPrice(product, defaultCurrency, exchangeRates);
    const salePrice = product.estimated_selling_price || 0;
    
    if (purchasePrice > 0) {
      const margin = ((salePrice - purchasePrice) / purchasePrice) * 100;
      totalMarginPercentage += margin;
    }
  }
  
  const averageMargin = productsWithMargin.length > 0 
    ? totalMarginPercentage / productsWithMargin.length 
    : 0;
  
  // 8️⃣ CALCUL DES TAUX
  const rotationRate = allItems.length > 0 
    ? (soldItems.length / allItems.length) * 100 
    : 0;
    
  const conversionRate = (stockItems.length + deliveryItems.length) > 0
    ? (soldItems.length / (stockItems.length + deliveryItems.length + soldItems.length)) * 100
    : 0;
  
  return {
    // Comptage des items
    totalItems: allItems.length,
    stockItems: stockItems.length,
    deliveryItems: deliveryItems.length,
    soldItems: soldItems.length,
    
    // Comptage des produits uniques
    totalProducts: products.length,
    stockProducts: stockProductIds.size,
    deliveryProducts: deliveryProductIds.size,
    soldProducts: soldProductIds.size,
    
    // Valeurs financières
    totalPurchaseValue: Math.round(totalPurchaseValue),
    stockPurchaseValue: Math.round(stockPurchaseValue),
    deliveryPurchaseValue: Math.round(deliveryPurchaseValue),
    soldPurchaseCost: Math.round(soldPurchaseCost),
    
    // Valeurs de vente
    totalEstimatedSaleValue: Math.round(totalEstimatedSaleValue),
    stockEstimatedValue: Math.round(stockEstimatedValue),
    deliveryEstimatedValue: Math.round(deliveryEstimatedValue),
    actualRevenue: Math.round(actualRevenue),
    
    // Profits
    realizedProfit: Math.round(realizedProfit),
    potentialProfit: Math.round(potentialProfit),
    totalPotentialProfit: Math.round(totalPotentialProfit),
    
    // Indicateurs
    averageMargin: Math.round(averageMargin * 10) / 10,
    rotationRate: Math.round(rotationRate * 10) / 10,
    conversionRate: Math.round(conversionRate * 10) / 10,
  };
}

// ============================================================================
// 📦 CALCULS POUR LA PAGE STOCK
// ============================================================================

export async function calculateStockStats(
  products: Product[],
  stockItems: ProductItem[],
  defaultCurrency: Currency,
  exchangeRates: Record<Currency, number>,
  lowStockThreshold: number = 5
): Promise<PageSpecificStats> {
  
  // Produits qui ont au moins 1 item en stock
  const stockProductIds = new Set(stockItems.map(i => i.product_id));
  const stockProducts = products.filter(p => stockProductIds.has(p.id));
  
  // Valeur totale du stock
  let totalValue = 0;
  
  for (const product of stockProducts) {
    const itemCount = stockItems.filter(i => i.product_id === product.id).length;
    const convertedPrice = await convertProductPrice(product, defaultCurrency, exchangeRates);
    totalValue += convertedPrice * itemCount;
  }
  
  // Stock critique (produits avec moins de X items)
  const lowStockProducts = stockProducts.filter(product => {
    const itemCount = stockItems.filter(i => i.product_id === product.id).length;
    return itemCount < lowStockThreshold;
  });
  
  return {
    totalProducts: stockProducts.length,
    totalQuantity: stockItems.length,
    totalValue: Math.round(totalValue),
    lowStockCount: lowStockProducts.length,
  };
}

// ============================================================================
// 🚚 CALCULS POUR LA PAGE LIVRAISON
// ============================================================================

export async function calculateDeliveryStats(
  products: Product[],
  deliveryItems: ProductItem[],
  clients: Client[],
  defaultCurrency: Currency,
  exchangeRates: Record<Currency, number>
): Promise<PageSpecificStats> {
  
  const deliveryProductIds = new Set(deliveryItems.map(i => i.product_id));
  const deliveryProducts = products.filter(p => deliveryProductIds.has(p.id));
  
  let totalValue = 0;
  
  for (const product of deliveryProducts) {
    const itemCount = deliveryItems.filter(i => i.product_id === product.id).length;
    const convertedPrice = await convertProductPrice(product, defaultCurrency, exchangeRates);
    totalValue += convertedPrice * itemCount;
  }
  
  // Livraisons en attente (produits avec client mais pas encore livrés)
  const pendingDeliveries = clients.filter(c => 
    deliveryProductIds.has(c.product_id)
  ).length;
  
  return {
    totalProducts: deliveryProducts.length,
    totalQuantity: deliveryItems.length,
    totalValue: Math.round(totalValue),
    pendingDeliveries,
  };
}

// ============================================================================
// 💰 CALCULS POUR LA PAGE VENDU
// ============================================================================

export async function calculateSoldStats(
  products: Product[],
  soldItems: ProductItem[],
  defaultCurrency: Currency,
  exchangeRates: Record<Currency, number>
): Promise<PageSpecificStats> {
  
  const soldProductIds = new Set(soldItems.map(i => i.product_id));
  const soldProducts = products.filter(p => soldProductIds.has(p.id));
  
  let totalCost = 0;
  let totalRevenue = 0;
  
  for (const product of soldProducts) {
    const productSoldItems = soldItems.filter(i => i.product_id === product.id);
    const convertedPrice = await convertProductPrice(product, defaultCurrency, exchangeRates);
    
    totalCost += convertedPrice * productSoldItems.length;
    
    // Calcul du revenu avec le prix de vente de chaque item
    productSoldItems.forEach(item => {
      const sellingPrice = item.selling_price || product.selling_price || product.estimated_selling_price || 0;
      totalRevenue += sellingPrice;
    });
  }
  
  const totalProfit = totalRevenue - totalCost;
  
  return {
    totalProducts: soldProducts.length,
    totalQuantity: soldItems.length,
    totalValue: Math.round(totalCost),
    totalRevenue: Math.round(totalRevenue),
    totalProfit: Math.round(totalProfit),
    totalCost: Math.round(totalCost),
  };
}

// ============================================================================
// 🎯 HELPER POUR FORMATTER LES VALEURS
// ============================================================================

export function formatCompactValue(num: number): string {
  const negative = num < 0;
  const absNum = Math.abs(num);

  if (absNum >= 1_000_000) {
    return (negative ? '-' : '') + (absNum / 1_000_000).toFixed(1) + 'M';
  }
  if (absNum >= 1_000) {
    return (negative ? '-' : '') + (absNum / 1_000).toFixed(1) + 'K';
  }
  return (negative ? '-' : '') + absNum.toLocaleString('fr-FR');
}

export function formatFullValue(num: number): string {
  return num.toLocaleString('fr-FR');
}
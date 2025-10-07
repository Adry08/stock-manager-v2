// services/currency.ts
import { Product, Currency } from "@/types";

// -------------------
// CONVERSION PRINCIPALE  
// -------------------
export async function convertToDefaultCurrency(
  amount: number,
  fromCurrency: Currency,
  targetCurrency: Currency,
  customRates: Record<Currency, number>
): Promise<number> {
  // 🎯 CORRECTION: Validation stricte
  if (!customRates || typeof customRates !== 'object') {
    console.error("❌ customRates invalide:", customRates);
    return 0;
  }

  // Si même devise, pas de conversion
  if (fromCurrency === targetCurrency) {
    return amount;
  }

  // Vérifier que les taux existent
  const fromRate = customRates[fromCurrency];
  const targetRate = customRates[targetCurrency];

  if (!fromRate || !targetRate || fromRate === 0 || targetRate === 0) {
    console.warn(
      "⚠️ Taux de change manquant ou invalide", 
      { fromCurrency, targetCurrency, fromRate, targetRate }
    );
    return 0;
  }

  // Conversion: (montant / taux_source) * taux_cible
  const result = (amount / fromRate) * targetRate;
  
  return Math.round(result * 100) / 100;
}

// -------------------
// CONVERSION PRODUIT
// -------------------
export async function convertProductPurchasePrice(
  product: Product,
  targetCurrency: Currency,
  customRates: Record<Currency, number>
): Promise<number> {
  const fromCurrency = product.currency as Currency;
  
  return convertToDefaultCurrency(
    product.purchase_price || 0,
    fromCurrency,
    targetCurrency,
    customRates
  );
}

interface MonetaryStats {
  purchaseValue: number;
  estimatedSaleValue: number;
}

export async function convertProductsToDefaultCurrency(
  products: Product[],
  targetCurrency: Currency,
  customRates: Record<Currency, number>
): Promise<MonetaryStats> {
  if (!products || products.length === 0) {
    return { purchaseValue: 0, estimatedSaleValue: 0 };
  }

  if (!customRates || typeof customRates !== 'object') {
    console.error("❌ Taux de change invalides dans convertProductsToDefaultCurrency");
    return { purchaseValue: 0, estimatedSaleValue: 0 };
  }

  let totalPurchaseValue = 0;
  let totalEstimatedSaleValue = 0;

  for (const product of products) {
    const quantity = Math.max(1, product.quantity || 1);

    // Conversion prix d'achat
    const purchasePriceConverted = await convertProductPurchasePrice(
      product,
      targetCurrency,
      customRates
    );
    const purchaseTotal = purchasePriceConverted * quantity;
    totalPurchaseValue += purchaseTotal;

    // Prix de vente (supposé déjà en devise cible)
    const sellingPrice = product.selling_price ?? product.estimated_selling_price ?? 0;
    const saleTotal = sellingPrice * quantity;
    totalEstimatedSaleValue += saleTotal;
  }

  return {
    purchaseValue: Math.round(totalPurchaseValue * 100) / 100,
    estimatedSaleValue: Math.round(totalEstimatedSaleValue * 100) / 100,
  };
}

// -------------------
// FORMATAGE  
// -------------------
export function formatPrice(
  amount: number,
  currency: Currency,
  locale = "fr-FR"
): string {
  if (!isFinite(amount)) amount = 0;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency as string,
    minimumFractionDigits: 0,
    maximumFractionDigits: currency === "MGA" ? 0 : 2,
  }).format(amount);
}

export async function convertAndFormatPrice(
  amount: number,
  fromCurrency: Currency,
  targetCurrency: Currency,
  customRates: Record<Currency, number>
): Promise<string> {
  const converted = await convertToDefaultCurrency(
    amount,
    fromCurrency,
    targetCurrency,
    customRates
  );
  return formatPrice(converted, targetCurrency);
}
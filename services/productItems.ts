// services/productItems.ts
// Service pour gérer les items unitaires des produits - VERSION COMPLÈTE

import { SupabaseClient } from "@supabase/supabase-js";
import { ProductItem, ProductItemFormData, ProductItemsByStatus, ProductItemsStats } from "@/types/productItem";

/**
 * 🔹 Récupère tous les items d'un produit
 */
export async function getProductItems(
  productId: string,
  client: SupabaseClient
): Promise<ProductItem[]> {
  const { data, error } = await client
    .from("product_items")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data || []) as ProductItem[];
}

/**
 * 🔹 Récupère les items d'un produit groupés par statut
 */
export async function getProductItemsByStatus(
  productId: string,
  client: SupabaseClient
): Promise<ProductItemsByStatus> {
  const items = await getProductItems(productId, client);
  
  return {
    stock: items.filter(item => item.status === 'stock'),
    livraison: items.filter(item => item.status === 'livraison'),
    vendu: items.filter(item => item.status === 'vendu'),
    total: items.length
  };
}

/**
 * 🔹 Crée des items pour un produit
 * Utilisé lors de la création d'un produit avec quantity > 1
 */
export async function createProductItems(
  productId: string,
  quantity: number,
  initialStatus: 'stock' | 'livraison' | 'vendu' = 'stock',
  client: SupabaseClient
): Promise<ProductItem[]> {
  if (quantity < 1) {
    throw new Error("La quantité doit être au moins 1");
  }

  // Créer un tableau d'items à insérer
  const itemsToCreate = Array.from({ length: quantity }, () => ({
    product_id: productId,
    status: initialStatus,
  }));

  const { data, error } = await client
    .from("product_items")
    .insert(itemsToCreate)
    .select();

  if (error) throw new Error(error.message);
  return (data || []) as ProductItem[];
}

/**
 * 🔹 Met à jour le statut d'un item unique
 */
export async function updateProductItemStatus(
  itemId: string,
  newStatus: 'stock' | 'livraison' | 'vendu',
  client: SupabaseClient
): Promise<ProductItem> {
  const { data, error } = await client
    .from("product_items")
    .update({ 
      status: newStatus,
      updated_at: new Date().toISOString() 
    })
    .eq("id", itemId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as ProductItem;
}

/**
 * 🔹 Met à jour le statut de plusieurs items en une seule fois
 */
export async function updateMultipleItemsStatus(
  itemIds: string[],
  newStatus: 'stock' | 'livraison' | 'vendu',
  client: SupabaseClient
): Promise<ProductItem[]> {
  if (itemIds.length === 0) {
    return [];
  }

  const { data, error } = await client
    .from("product_items")
    .update({ 
      status: newStatus,
      updated_at: new Date().toISOString() 
    })
    .in("id", itemIds)
    .select();

  if (error) throw new Error(error.message);
  return (data || []) as ProductItem[];
}

/**
 * 🆕 Met à jour le prix de vente d'un item (lors de la vente)
 */
export async function updateItemSellingPrice(
  itemId: string,
  sellingPrice: number,
  client: SupabaseClient
): Promise<ProductItem> {
  const { data, error } = await client
    .from("product_items")
    .update({ 
      selling_price: sellingPrice,
      status: 'vendu',
      updated_at: new Date().toISOString() 
    })
    .eq("id", itemId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as ProductItem;
}

/**
 * 🔹 Supprime un item
 */
export async function deleteProductItem(
  itemId: string,
  client: SupabaseClient
): Promise<void> {
  const { error } = await client
    .from("product_items")
    .delete()
    .eq("id", itemId);

  if (error) throw new Error(error.message);
}

/**
 * 🔹 Supprime tous les items d'un produit
 * Utilisé lors de la suppression d'un produit (normalement géré par CASCADE)
 */
export async function deleteAllProductItems(
  productId: string,
  client: SupabaseClient
): Promise<void> {
  const { error } = await client
    .from("product_items")
    .delete()
    .eq("product_id", productId);

  if (error) throw new Error(error.message);
}

/**
 * 🔹 Ajoute des items supplémentaires à un produit existant
 * Utilisé quand on veut augmenter la quantité
 */
export async function addProductItems(
  productId: string,
  quantityToAdd: number,
  status: 'stock' | 'livraison' | 'vendu' = 'stock',
  client: SupabaseClient
): Promise<ProductItem[]> {
  return await createProductItems(productId, quantityToAdd, status, client);
}

/**
 * 🔹 Calcule les statistiques des items d'un produit
 */
export async function getProductItemsStats(
  productId: string,
  client: SupabaseClient
): Promise<ProductItemsStats> {
  const items = await getProductItems(productId, client);
  const total = items.length;

  if (total === 0) {
    return {
      totalItems: 0,
      inStock: 0,
      inDelivery: 0,
      sold: 0,
      percentageInStock: 0,
      percentageInDelivery: 0,
      percentageSold: 0,
    };
  }

  const inStock = items.filter(item => item.status === 'stock').length;
  const inDelivery = items.filter(item => item.status === 'livraison').length;
  const sold = items.filter(item => item.status === 'vendu').length;

  return {
    totalItems: total,
    inStock,
    inDelivery,
    sold,
    percentageInStock: (inStock / total) * 100,
    percentageInDelivery: (inDelivery / total) * 100,
    percentageSold: (sold / total) * 100,
  };
}

/**
 * 🆕 Récupère les items avec leurs informations détaillées (via la vue SQL)
 */
export async function getProductItemsDetailed(
  productId: string,
  client: SupabaseClient
): Promise<any[]> {
  const { data, error } = await client
    .from("product_items_detailed")
    .select("*")
    .eq("product_id", productId)
    .order("item_created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * 🆕 Récupère tous les items vendus avec leurs profits
 */
export async function getSoldItemsWithProfit(
  client: SupabaseClient
): Promise<any[]> {
  const { data, error } = await client
    .from("product_items_detailed")
    .select("*")
    .eq("status", "vendu")
    .not("profit", "is", null)
    .order("sold_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * 🔹 Synchronise manuellement la quantité du produit
 * (normalement géré automatiquement par le trigger SQL)
 */
export async function syncProductQuantity(
  productId: string,
  client: SupabaseClient
): Promise<void> {
  const items = await getProductItems(productId, client);
  const stockCount = items.filter(item => item.status === 'stock').length;

  const { error } = await client
    .from("products")
    .update({ 
      quantity: stockCount,
      updated_at: new Date().toISOString() 
    })
    .eq("id", productId);

  if (error) throw new Error(error.message);
}


// services/products.ts - VERSION MISE À JOUR avec gestion des items
import { supabase } from "@/lib/supabaseClient";
import { Product, ProductFormData, Settings } from "@/types";
import { SupabaseClient } from "@supabase/supabase-js";
import { createProductItems } from "./productItems";

/** 🔹 Récupère les settings ou les crée s'ils n'existent pas */
export async function ensureSettings(
  userId: string, 
  client?: SupabaseClient
): Promise<Settings> {
  const supa = client || supabase;

  let { data: existingSettings, error: selectError } = await supa
    .from("settings")
    .select("*")
    .eq("user_id", userId) 
    .maybeSingle();

  if (selectError && selectError.code !== 'PGRST116') {
    throw new Error(selectError.message);
  }
  
  let settingsData = existingSettings as Settings;

  if (!existingSettings) {
    const { data: newSettings, error: insertError } = await supa
      .from("settings")
      .insert({ user_id: userId })
      .select("*")
      .single();

    if (insertError) throw new Error(insertError.message);
    settingsData = newSettings as Settings;
  }
  
  // Injection des taux de change globaux si nécessaire
  if (!settingsData.exchange_rates || Object.keys(settingsData.exchange_rates).length < 2) { 
    console.log("🔄 Taux de change vides dans settings utilisateur. Lecture des taux globaux...");
    
    const baseCurrencyForRates = 'EUR'; 
    
    const { data: globalRates, error: ratesError } = await supa
      .from("exchange_rates")
      .select("rates")
      .eq("base_currency", baseCurrencyForRates)
      .maybeSingle();
      
    if (!ratesError && globalRates && globalRates.rates) {
      console.log("✅ Taux globaux injectés pour le chargement de la page.");
      return {
        ...settingsData,
        exchange_rates: globalRates.rates
      } as Settings;
    } else {
      console.warn("⚠️ Pas de taux trouvés dans la table globale.");
    }
  }

  return settingsData;
}

/** Récupère tous les produits */
export async function getProducts(client?: SupabaseClient): Promise<Product[]> {
  const supa = client || supabase;
  const { data, error } = await supa
    .from("products")
    .select("*")
    .order("created_at", { ascending: false }); 
  
  if (error) throw new Error(error.message);
  return (data || []) as Product[];
}

/**
 * 🆕 Crée un produit AVEC création automatique des items
 * Si quantity > 1, crée automatiquement les items correspondants
 */
export async function createProduct(
  productData: ProductFormData,
  userId: string,
  client?: SupabaseClient
): Promise<Product> {
  const supa = client || supabase;

  // 1. Créer le produit parent
  const productToInsert = {
    ...productData,
    added_by: userId,
    last_modified_by: userId,
  };

  const { data: newProduct, error: productError } = await supa
    .from("products")
    .insert(productToInsert)
    .select("*")
    .single();

  if (productError) throw new Error(productError.message);

  // 2. Créer les items automatiquement si quantity > 0
  const quantity = productData.quantity || 1;
  const initialStatus = productData.status || 'stock';
  
  try {
    await createProductItems(
      newProduct.id, 
      quantity, 
      initialStatus,
      supa
    );
    console.log(`✅ ${quantity} items créés pour le produit ${newProduct.name}`);
  } catch (itemError) {
    console.error("Erreur lors de la création des items:", itemError);
    // On ne fait pas échouer toute la création si les items échouent
    // Le trigger SQL synchronisera la quantité
  }

  return newProduct as Product;
}

/**
 * 🔄 Met à jour un produit
 * Note: La modification de quantity n'affecte PAS les items existants
 * Pour gérer les items, utilisez les fonctions de productItems.ts
 */
export async function updateProduct(
  product: Product,
  userId: string,
  client?: SupabaseClient
): Promise<Product> {
  const supa = client || supabase;

  const productToUpdate = {
    ...product,
    last_modified_by: userId,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supa
    .from("products")
    .update(productToUpdate)
    .eq("id", product.id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  return data as Product;
}

/**
 * 🆕 Change le statut de TOUS les items d'un produit
 * Utilisé pour changer rapidement tous les items en même temps
 */
export async function updateProductStatusBulk(
  productId: string,
  newStatus: 'stock' | 'livraison' | 'vendu',
  userId: string,
  client?: SupabaseClient
): Promise<void> {
  const supa = client || supabase;

  // Mettre à jour tous les items du produit
  const { error: itemsError } = await supa
    .from("product_items")
    .update({ 
      status: newStatus,
      updated_at: new Date().toISOString() 
    })
    .eq("product_id", productId);

  if (itemsError) throw new Error(itemsError.message);

  // Mettre à jour le statut du produit parent
  const { error: productError } = await supa
    .from("products")
    .update({ 
      status: newStatus,
      last_modified_by: userId,
      updated_at: new Date().toISOString() 
    })
    .eq("id", productId);

  if (productError) throw new Error(productError.message);
}

/**
 * 🚨 Supprime un produit et tous ses items (CASCADE)
 */
export async function deleteProduct(
  id: string,
  client?: SupabaseClient
): Promise<void> {
  const supa = client || supabase;
  
  // La suppression des items est automatique grâce à ON DELETE CASCADE
  const { error } = await supa
    .from("products")
    .delete()
    .eq("id", id);
  
  if (error) {
    if (error.message.includes("violates foreign key constraint")) {
      console.error("ERREUR CLÉ ÉTRANGÈRE : Vérifiez la configuration CASCADE.");
    }
    throw new Error(error.message);
  }
}
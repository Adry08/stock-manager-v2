// services/products.ts

import { supabase } from "@/lib/supabaseClient";
import { Product, ProductFormData, Settings } from "@/types";
import { SupabaseClient } from "@supabase/supabase-js";

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

  // 1. Crée les settings s'ils n'existent pas
  if (!existingSettings) {
    const { data: newSettings, error: insertError } = await supa
      .from("settings")
      .insert({ user_id: userId })
      .select("*")
      .single();

    if (insertError) throw new Error(insertError.message);
    settingsData = newSettings as Settings;
  }
  
  // 2. LOGIQUE DE LECTURE SEULE DES TAUX : 
  //    Si les taux de l'utilisateur sont vides, on les lit de la table globale et on les injecte
  //    dans l'objet retourné, SANS TENTER D'ÉCRIRE dans la DB (pour éviter l'erreur de permission).
  if (!settingsData.exchange_rates || Object.keys(settingsData.exchange_rates).length < 2) { 
      console.log("🔄 Taux de change vides dans settings utilisateur. Lecture des taux globaux...");
      
      const baseCurrencyForRates = 'EUR'; 
      
      const { data: globalRates, error: ratesError } = await supa
        .from("exchange_rates")
        .select("rates")
        .eq("base_currency", baseCurrencyForRates)
        .maybeSingle();
        
      if (!ratesError && globalRates && globalRates.rates) {
          console.log("✅ Taux globaux injectés pour le chargement de la page. (Pas d'UPDATE DB)");
          // Retourne l'objet settings complété avec les taux globaux
          return {
              ...settingsData,
              exchange_rates: globalRates.rates
          } as Settings;
          
      } else {
           console.warn("⚠️ Pas de taux trouvés dans la table globale. Vérifiez l'endpoint /api/updaterates.");
      }
  }

  // Retourne les settings originaux ou complétés
  return settingsData;
}

/** Récupère tous les produits */
export async function getProducts(client?: SupabaseClient): Promise<Product[]> {
  const supa = client || supabase;
  const { data, error } = await supa.from("products").select("*").order("created_at", { ascending: false }); 
  if (error) throw new Error(error.message);
  return (data || []) as Product[];
}

/** Crée un produit */
export async function createProduct(
  productData: ProductFormData,
  userId: string,
  client?: SupabaseClient
): Promise<Product> {
  const supa = client || supabase;

  const productToInsert = {
    ...productData,
    added_by: userId,
    last_modified_by: userId,
  };

  const { data, error } = await supa
    .from("products")
    .insert(productToInsert)
    .select("*")
    .single();

  if (error) throw new Error(error.message);

  return data as Product;
}

/** Met à jour un produit */
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

/** 🚨 ATTENTION : Suppression de produit (nécessite ON DELETE CASCADE sur la table movements) */
export async function deleteProduct(
  id: string,
  client?: SupabaseClient
): Promise<void> {
  const supa = client || supabase;
  
  // NOTE: La suppression ici échouera tant que la contrainte ON DELETE CASCADE 
  // n'est pas appliquée à la clé étrangère dans la table movements.
  const { error } = await supa.from("products").delete().eq("id", id);
  if (error) {
    // Si l'erreur est de type "Foreign Key Violation", l'expliquer clairement
    if (error.message.includes("violates foreign key constraint")) {
        console.error("ERREUR CLÉ ÉTRANGÈRE : Le produit ne peut être supprimé car il a des mouvements associés. Exécutez le SQL ALTER TABLE avec ON DELETE CASCADE.");
    }
    throw new Error(error.message);
  }
}
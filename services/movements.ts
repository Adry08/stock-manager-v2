// services/movements.ts
import { supabase } from "@/lib/supabaseClient";
import { Movement } from "@/types";
import { SupabaseClient } from "@supabase/supabase-js";

/** Récupère tous les mouvements */
export async function getMovements(client?: SupabaseClient): Promise<Movement[]> {
  const supa = client || supabase;
  const { data, error } = await supa
    .from("movements")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as Movement[];
}

/** Récupère les mouvements d'un produit spécifique */
export async function getMovementsByProduct(
  productId: string,
  client?: SupabaseClient
): Promise<Movement[]> {
  const supa = client || supabase;
  const { data, error } = await supa
    .from("movements")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as Movement[];
}

/** Helpers pour l'affichage des mouvements */
export function formatMovementAction(movement: Movement): string {
  const actions: Record<string, string> = {
    insert: "Création",
    delete: "Suppression",
    update: "Modification",
    status: "Changement de statut",
    quantity: "Modification de quantité",
    purchase_price: "Modification du prix d'achat",
    selling_price: "Modification du prix de vente",
    estimated_selling_price: "Modification du prix estimé",
    name: "Modification du nom",
    description: "Modification de la description",
    image_url: "Modification de l'image",
  };
  return actions[movement.field_changed || ""] || `Modification (${movement.field_changed})`;
}

export function formatMovementChange(movement: Movement): string {
  if (movement.field_changed === "status") {
    return `${movement.previous_status || "Aucun"} → ${movement.new_status || "Supprimé"}`;
  }
  if (movement.field_changed === "insert") return "Produit créé";
  if (movement.field_changed === "delete") return "Produit supprimé";
  if (movement.field_changed === "update") return "Produit modifié";
  return `${movement.old_value || "N/A"} → ${movement.new_value || "N/A"}`;
}

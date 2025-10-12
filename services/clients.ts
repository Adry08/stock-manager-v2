// services/clients.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { Client, ClientFormData } from "@/types/client";

export async function getClientByProductId(
  productId: string,
  supabase: SupabaseClient
): Promise<Client | null> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("product_id", productId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Erreur lors de la récupération du client:", error);
    throw error;
  }

  return data;
}

export async function getAllClients(
  supabase: SupabaseClient
): Promise<Client[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("delivery_date", { ascending: true });

  if (error) {
    console.error("Erreur lors de la récupération des clients:", error);
    throw error;
  }

  return data || [];
}

export async function createClient(
  productId: string,
  clientData: ClientFormData,
  userId: string,
  supabase: SupabaseClient
): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .insert({
      product_id: productId,
      ...clientData,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error("Erreur lors de la création du client:", error);
    throw error;
  }

  return data;
}

export async function updateClient(
  clientId: string,
  clientData: Partial<ClientFormData>,
  supabase: SupabaseClient
): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .update({
      ...clientData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", clientId)
    .select()
    .single();

  if (error) {
    console.error("Erreur lors de la mise à jour du client:", error);
    throw error;
  }

  return data;
}

export async function deleteClient(
  clientId: string,
  supabase: SupabaseClient
): Promise<void> {
  const { error } = await supabase
    .from("clients")
    .delete()
    .eq("id", clientId);

  if (error) {
    console.error("Erreur lors de la suppression du client:", error);
    throw error;
  }
}
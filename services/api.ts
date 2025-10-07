// services/api.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, Movement, Settings, Profile, DeletedProduct, ExchangeRate } from '@/types';

// ----------------------
// Supabase Client
// ----------------------
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL ou Key manquant dans les variables d\'environnement');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

// ----------------------
// Products API
// ----------------------
export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function addProduct(
  product: Omit<Product, 'id' | 'created_at' | 'updated_at'>
): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .insert([product])
    .select()
    .single();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Produit non créé');
  return data;
}

export async function updateProduct(product: Product): Promise<Product> {
  const { id, ...rest } = product;
  const { data, error } = await supabase
    .from('products')
    .update({ ...rest, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Produit non mis à jour');
  return data;
}

export async function updateProductStatus({
  id,
  status,
}: {
  id: string;
  status: Product['status'];
}): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Statut non mis à jour');
  return data;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function getDeletedProducts(): Promise<DeletedProduct[]> {
  const { data, error } = await supabase
    .from('deleted_products')
    .select('*')
    .order('deleted_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

// ----------------------
// Movements API (lecture seule)
// ----------------------
export async function getMovements(page: number = 0, limit: number = 20): Promise<Movement[]> {
  const start = page * limit;
  const end = (page + 1) * limit - 1;
  const { data, error } = await supabase
    .from('movements')
    .select('*')
    .order('created_at', { ascending: false })
    .range(start, end);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getMovementsByProduct(productId: string): Promise<Movement[]> {
  const { data, error } = await supabase
    .from('movements')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getMovementsByUser(userId: string): Promise<Movement[]> {
  const { data, error } = await supabase
    .from('movements')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

// ----------------------
// Settings API
// ----------------------
export async function getSettings(userId?: string): Promise<Settings> {
  let query = supabase.from('settings').select('*');
  
  if (userId) {
    query = query.eq('user_id', userId);
  }
  
  const { data, error } = await query.single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateSettings(
  userId: string,
  settings: Partial<Omit<Settings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<Settings> {
  const { data, error } = await supabase
    .from('settings')
    .update({ ...settings, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function createSettings(userId: string): Promise<Settings> {
  const { data, error } = await supabase
    .from('settings')
    .insert([{
      user_id: userId,
      default_currency: 'MGA',
      exchange_rates: {
        EUR: 1,
        USD: 1.08,
        GBP: 0.85,
        MGA: 4500,
      }
    }])
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// ----------------------
// Profiles API
// ----------------------
export async function getProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateProfile(
  userId: string,
  profile: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...profile, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// ----------------------
// Exchange Rates API
// ----------------------
export async function getExchangeRates(): Promise<ExchangeRate> {
  const { data, error } = await supabase
    .from('exchange_rates')
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function updateExchangeRates(
  rates: Record<string, number>
): Promise<ExchangeRate> {
  const { data, error } = await supabase
    .from('exchange_rates')
    .update({ 
      rates, 
      updated_at: new Date().toISOString() 
    })
    .eq('base_currency', 'EUR')
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data;
}
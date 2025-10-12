// types/client.ts - Ajoutez ceci à votre fichier types existant

export interface Client {
  id: string;
  product_id: string;
  client_name: string;
  contact_number: string;
  delivery_address: string;
  delivery_date: string;
  delivery_time: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface ClientFormData {
  client_name: string;
  contact_number: string;
  delivery_address: string;
  delivery_date: string;
  delivery_time: string;
  notes?: string;
}
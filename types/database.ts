// types/database.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      products: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          purchase_price: number;
          currency: "MGA" | "USD" | "EUR" | "GBP";
          quantity: number;
          status: "stock" | "vendu" | "livraison";
          image_url: string | null;
          created_at: string;
          updated_at: string;
          added_by: string;
          estimated_selling_price: number | null;
          last_modified_by: string | null;
          selling_price: number | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          purchase_price: number;
          currency?: "MGA" | "USD" | "EUR" | "GBP";
          quantity: number;
          status?: "stock" | "vendu" | "livraison";
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
          added_by: string;
          estimated_selling_price?: number | null;
          last_modified_by?: string | null;
          selling_price?: number | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          purchase_price?: number;
          currency?: "MGA" | "USD" | "EUR" | "GBP";
          quantity?: number;
          status?: "stock" | "vendu" | "livraison";
          image_url?: string | null;
          created_at?: string;
          updated_at?: string;
          added_by?: string;
          estimated_selling_price?: number | null;
          last_modified_by?: string | null;
          selling_price?: number | null;
        };
      };
      
      movements: {
        Row: {
          id: string;
          product_id: string | null; // 🔥 CORRECTION: peut être null après suppression
          previous_status: "stock" | "vendu" | "livraison" | null;
          new_status: "stock" | "vendu" | "livraison" | null;
          quantity: number;
          created_at: string;
          user_id: string | null; // 🔥 CORRECTION: peut être null
          field_changed: string | null;
          old_value: Json | null;
          new_value: Json | null;
        };
        Insert: {
          id?: string;
          product_id: string;
          previous_status?: "stock" | "vendu" | "livraison" | null;
          new_status: "stock" | "vendu" | "livraison" | null;
          quantity: number;
          created_at?: string;
          user_id: string;
          field_changed?: string | null;
          old_value?: Json | null;
          new_value?: Json | null;
        };
        Update: {
          id?: string;
          product_id?: string | null;
          previous_status?: "stock" | "vendu" | "livraison" | null;
          new_status?: "stock" | "vendu" | "livraison" | null;
          quantity?: number;
          created_at?: string;
          user_id?: string | null;
          field_changed?: string | null;
          old_value?: Json | null;
          new_value?: Json | null;
        };
      };
      
      settings: {
        Row: {
          id: string;
          user_id: string;
          default_currency: "MGA" | "USD" | "EUR" | "GBP";
          exchange_rates: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          default_currency?: "MGA" | "USD" | "EUR" | "GBP";
          exchange_rates?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          default_currency?: "MGA" | "USD" | "EUR" | "GBP";
          exchange_rates?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: "user" | "admin";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: "user" | "admin";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: "user" | "admin";
          created_at?: string;
          updated_at?: string;
        };
      };

      deleted_products: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          purchase_price: number | null;
          currency: "MGA" | "USD" | "EUR" | "GBP" | null;
          quantity: number | null;
          status: "stock" | "vendu" | "livraison" | null;
          image_url: string | null;
          created_at: string | null;
          updated_at: string | null;
          added_by: string | null;
          estimated_selling_price: number | null;
          last_modified_by: string | null;
          selling_price: number | null;
          deleted_at: string;
        };
        Insert: {
          id: string;
          name: string;
          description?: string | null;
          purchase_price?: number | null;
          currency?: "MGA" | "USD" | "EUR" | "GBP" | null;
          quantity?: number | null;
          status?: "stock" | "vendu" | "livraison" | null;
          image_url?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          added_by?: string | null;
          estimated_selling_price?: number | null;
          last_modified_by?: string | null;
          selling_price?: number | null;
          deleted_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          purchase_price?: number | null;
          currency?: "MGA" | "USD" | "EUR" | "GBP" | null;
          quantity?: number | null;
          status?: "stock" | "vendu" | "livraison" | null;
          image_url?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          added_by?: string | null;
          estimated_selling_price?: number | null;
          last_modified_by?: string | null;
          selling_price?: number | null;
          deleted_at?: string;
        };
      };

      exchange_rates: {
        Row: {
          id: number;
          base_currency: string;
          rates: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          base_currency?: string;
          rates: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          base_currency?: string;
          rates?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
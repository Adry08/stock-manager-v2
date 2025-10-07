// types/index.ts
import { Database } from "./database";

// UUID type
export type UUID = string;

// Alias des Rows pour commodité
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Movement = Database["public"]["Tables"]["movements"]["Row"];
export type Settings = Database["public"]["Tables"]["settings"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type DeletedProduct = Database["public"]["Tables"]["deleted_products"]["Row"];
export type ExchangeRate = Database["public"]["Tables"]["exchange_rates"]["Row"];

// ProductFormData pour les formulaires
export type ProductFormData = Partial<Omit<Product, "id" | "created_at" | "updated_at" | "added_by" | "last_modified_by">> & {
  name: string;
  added_by?: string;
  last_modified_by?: string | null;
  purchase_price?: number;
  quantity?: number;
  estimated_selling_price?: number;
};

// Currency enum
export type Currency = "MGA" | "USD" | "EUR" | "GBP";

// Product status enum
export type ProductStatus = "stock" | "vendu" | "livraison";

// User role enum
export type UserRole = "user" | "admin";
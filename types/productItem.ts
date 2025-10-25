// types/productItem.ts
// Types pour la gestion des items unitaires

export type ProductItemStatus = 'stock' | 'livraison' | 'vendu';

export interface ProductItem {
  id: string;
  product_id: string;
  status: ProductItemStatus;
  created_at: string;
  updated_at: string;
}

export interface ProductItemFormData {
  status: ProductItemStatus;
}

// Extension du type Database pour inclure product_items
export interface ProductItemsTable {
  Row: ProductItem;
  Insert: Omit<ProductItem, 'id' | 'created_at' | 'updated_at'> & {
    id?: string;
    created_at?: string;
    updated_at?: string;
  };
  Update: Partial<Omit<ProductItem, 'id' | 'product_id' | 'created_at'>>;
}

// Type pour regrouper les items par statut
export interface ProductItemsByStatus {
  stock: ProductItem[];
  livraison: ProductItem[];
  vendu: ProductItem[];
  total: number;
}

// Type pour les statistiques d'items
export interface ProductItemsStats {
  totalItems: number;
  inStock: number;
  inDelivery: number;
  sold: number;
  percentageInStock: number;
  percentageInDelivery: number;
  percentageSold: number;
}

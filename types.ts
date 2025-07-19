export enum ProductCategory {
  FOOD = 'Alimentos',
  APPLIANCES = 'Electrodomésticos',
  TECHNOLOGY = 'Tecnología',
  CLOTHING = 'Ropa',
  OTHER = 'Otros',
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: ProductCategory | string;
  imageUrl?: string;
  created_at: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface SaleItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Sale {
  id: string;
  created_at: string;
  items: SaleItem[];
  total: number;
}

export type AppView = 'DASHBOARD' | 'POS' | 'PRODUCTS' | 'REPORTS';

// Supabase DB schema
export interface Database {
  public: {
    Tables: {
      products: {
        Row: Product;
        Insert: {
          id: string;
          name: string;
          description: string;
          price: number;
          stock: number;
          category: ProductCategory | string;
          imageUrl?: string;
        };
        Update: Partial<{
          name: string;
          description: string;
          price: number;
          stock: number;
          category: ProductCategory | string;
          imageUrl?: string;
        }>;
      };
      sales: {
        Row: Sale;
        Insert: {
          items: Json;
          total: number;
        };
        Update: Partial<{
          items: Json;
          total: number;
        }>;
      };
    };
    Views: {
      [_ in never]: never
    };
    Functions: {
        decrement_product_stock: {
            Args: {
                product_id_in: string,
                quantity_sold: number
            },
            Returns: void
        }
    };
  };
}

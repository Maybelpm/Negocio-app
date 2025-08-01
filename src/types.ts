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
  sale_price: number;     // precio de venta en BD
  cost_price: number;     // precio de compra en BD
  stock: number;
  stock_minimum: number;  // umbral de alerta
  category: string;
  imageurl: string;   // columna original
  imageUrl: string;   // alias uniforme para consumir en React
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
  id: string; // UUID
  created_at: string;
  items: SaleItem[];
  total: number;
}

export type AppView = 'DASHBOARD' | 'POS' | 'PRODUCTS' | 'REPORTS';

// Supabase DB schema matching the README.md SQL script
export interface Database {
  public: {
    Tables: {
      products: {
        Row: Product;
        Insert: {
          name: string;
          description: string;
          price: number;
          stock: number;
          category: string;
          imageUrl?: string;
        };
        Update: Partial<{
          name: string;
          description: string;
          price: number;
          stock: number;
          category: string;
          imageUrl?: string;
        }>;
      };
      sales: {
        Row: Sale;
        Insert: {
          items: SaleItem[];
          total: number;
        };
        Update: Partial<{
          items: SaleItem[];
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
                product_id_in: string, // UUID
                quantity_sold: number
            },
            Returns: void
        }
    };
  };
}
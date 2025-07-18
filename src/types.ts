export enum ProductCategory {
  FOOD = 'Alimentos',
  APPLIANCES = 'Electrodomésticos',
  TECHNOLOGY = 'Tecnología',
  CLOTHING = 'Ropa',
  OTHER = 'Otros',
}

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
        Insert: Omit<Product, 'created_at'>;
        Update: Partial<Omit<Product, 'id' | 'created_at'>>;
      };
      sales: {
        Row: Sale;
        Insert: Omit<Sale, 'created_at'>;
        Update: Partial<Omit<Sale, 'id' | 'created_at'>>;
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

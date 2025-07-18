
export enum ProductCategory {
  FOOD = 'Alimentos',
  APPLIANCES = 'Electrodomésticos',
  OTHER = 'Otros'
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: ProductCategory;
  imageUrl: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Sale {
  id:string;
  date: string;
  items: CartItem[];
  total: number;
}

export type AppView = 'DASHBOARD' | 'POS' | 'PRODUCTS' | 'REPORTS';

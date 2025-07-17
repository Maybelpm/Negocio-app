
export enum ProductCategory {
  FOOD = 'Alimentos',
  APPLIANCES = 'Electrodomésticos',
  OTHER = 'Otros'
}

export enum LocationType {
  WAREHOUSE = 'Almacén',
  STORE = 'Tienda'
}

export interface Location {
  id: string;
  name: string;
  type: LocationType;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: ProductCategory;
  imageUrl: string;
}

export interface ProductWithStock extends Product {
  stock: number;
}

export interface InventoryItem {
    id: string;
    productId: string;
    locationId: string;
    stock: number;
}

export interface CartItem extends Product {
  quantity: number;
  stock: number; // Stock available at the current location
}

export interface Sale {
  id:string;
  date: string;
  items: Omit<CartItem, 'stock'>[];
  total: number;
  locationId: string;
}

export type AppView = 'DASHBOARD' | 'POS' | 'PRODUCTS' | 'REPORTS';
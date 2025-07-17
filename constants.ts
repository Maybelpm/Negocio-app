
import { Product, ProductCategory, Location, LocationType, InventoryItem } from './types';

export const INITIAL_LOCATIONS: Location[] = [
    { id: 'loc_main_wh', name: 'Almacén Principal', type: LocationType.WAREHOUSE },
    { id: 'loc_store_1', name: 'Tienda Centro', type: LocationType.STORE },
    { id: 'loc_store_2', name: 'Tienda Norte', type: LocationType.STORE },
];

export const INITIAL_CATALOG: Product[] = [
  {
    id: 'prod_1',
    name: 'Refrigerador Inteligente',
    description: 'Refrigerador de 2 puertas con dispensador de agua y conexión Wi-Fi.',
    price: 1299.99,
    category: ProductCategory.APPLIANCES,
    imageUrl: 'https://picsum.photos/seed/fridge/400/400',
  },
  {
    id: 'prod_2',
    name: 'Cafetera Espresso Automática',
    description: 'Prepara cappuccinos y lattes con solo tocar un botón.',
    price: 349.50,
    category: ProductCategory.APPLIANCES,
    imageUrl: 'https://picsum.photos/seed/coffee/400/400',
  },
  {
    id: 'prod_3',
    name: 'Aceite de Oliva Extra Virgen',
    description: 'Botella de 750ml de aceite de oliva prensado en frío.',
    price: 12.99,
    category: ProductCategory.FOOD,
    imageUrl: 'https://picsum.photos/seed/oil/400/400',
  },
  {
    id: 'prod_4',
    name: 'Arroz Basmati Premium',
    description: 'Paquete de 5kg de arroz basmati de grano largo.',
    price: 22.00,
    category: ProductCategory.FOOD,
    imageUrl: 'https://picsum.photos/seed/rice/400/400',
  },
  {
    id: 'prod_5',
    name: 'Licuadora de Alta Potencia',
    description: '1200W de potencia para triturar hielo, frutas y vegetales.',
    price: 89.99,
    category: ProductCategory.APPLIANCES,
    imageUrl: 'https://picsum.photos/seed/blender/400/400',
  },
  {
    id: 'prod_6',
    name: 'Pasta de Tomate Orgánica',
    description: 'Lata de 400g de pasta de tomate sin conservantes.',
    price: 2.50,
    category: ProductCategory.FOOD,
    imageUrl: 'https://picsum.photos/seed/tomato/400/400',
  },
    {
    id: 'prod_7',
    name: 'Microondas Inverter',
    description: 'Horno de microondas con tecnología inverter para una cocción uniforme.',
    price: 199.99,
    category: ProductCategory.APPLIANCES,
    imageUrl: 'https://picsum.photos/seed/microwave/400/400',
  },
  {
    id: 'prod_8',
    name: 'Cereal de Avena y Miel',
    description: 'Caja de 500g de cereal integral de avena con miel.',
    price: 5.75,
    category: ProductCategory.FOOD,
    imageUrl: 'https://picsum.photos/seed/cereal/400/400',
  }
];

export const INITIAL_INVENTORY: InventoryItem[] = INITIAL_CATALOG.flatMap(product => [
    // High stock in warehouse
    { id: `inv_${product.id}_loc_main_wh`, productId: product.id, locationId: 'loc_main_wh', stock: Math.floor(Math.random() * 200) + 50 },
    // Lower, varied stock in stores
    { id: `inv_${product.id}_loc_store_1`, productId: product.id, locationId: 'loc_store_1', stock: Math.floor(Math.random() * 30) + 5 },
    { id: `inv_${product.id}_loc_store_2`, productId: product.id, locationId: 'loc_store_2', stock: Math.floor(Math.random() * 40) + 10 },
]);

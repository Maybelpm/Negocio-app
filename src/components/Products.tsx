import React from 'react';
import { Product } from '@/types';

interface ProductsViewProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>; // This prop might be used later for optimistic updates
}

const ProductsView: React.FC<ProductsViewProps> = ({ products }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-white">Gestión de Productos</h1>
        <button className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-500 disabled:bg-gray-500" disabled>
          Añadir Producto
        </button>
      </div>
       <div className="bg-yellow-900/50 border border-yellow-600 text-yellow-200 p-4 mb-6 rounded-lg" role="alert">
        <p className="font-bold">Funcionalidad en Desarrollo</p>
        <p>La edición y creación de productos estará disponible en una futura actualización.</p>
      </div>
      <div className="bg-gray-800/50 backdrop-blur-sm border border-white/10 rounded-lg shadow">
         <ul className="divide-y divide-gray-700">
            {products.map(product => (
                 <li key={product.id} className="p-4 flex justify-between items-center hover:bg-gray-700/50">
                    <div className="flex items-center gap-4">
                        <img src={product.imageUrl || `https://picsum.photos/seed/${product.id}/50`} alt={product.name} className="h-12 w-12 rounded-md object-cover"/>
                        <div>
                            <p className="text-white font-semibold">{product.name}</p>
                            <p className="text-sm text-gray-400">{product.category}</p>
                        </div>
                    </div>
                    <div className="text-right">
                         <p className="text-white">${product.price.toFixed(2)}</p>
                         <p className={`text-sm font-semibold ${product.stock > 10 ? 'text-green-400' : 'text-red-400'}`}>
                            Stock: {product.stock}
                         </p>
                    </div>
                </li>
            ))}
         </ul>
      </div>
    </div>
  );
};

export default ProductsView;
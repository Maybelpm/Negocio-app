import React, { useState } from 'react';
import { Product } from '@/types';

interface ProductsViewProps {
  products: Product[];
  setProducts: (products: Product[] | ((p: Product[]) => Product[])) => void;
}

const ProductsView: React.FC<ProductsViewProps> = ({ products, setProducts }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Gestión de Productos</h1>
        {/* <button className="bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">
          Añadir Producto
        </button> */}
      </div>
       <input
          type="text"
          placeholder="Buscar por nombre o categoría..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 bg-gray-800 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-700 text-gray-300 uppercase text-sm">
              <tr>
                <th className="p-4">Imagen</th>
                <th className="p-4">Nombre</th>
                <th className="p-4">Categoría</th>
                <th className="p-4 text-right">Precio</th>
                <th className="p-4 text-right">Stock</th>
              </tr>
            </thead>
            <tbody className="text-gray-200">
              {filteredProducts.map(product => (
                <tr key={product.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                  <td className="p-4">
                    <img src={product.imageUrl} alt={product.name} className="h-12 w-12 object-cover rounded-md"/>
                  </td>
                  <td className="p-4 font-medium">{product.name}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${product.category === 'Alimentos' ? 'bg-green-500/20 text-green-300' : 'bg-blue-500/20 text-blue-300'}`}>
                      {product.category}
                    </span>
                  </td>
                  <td className="p-4 text-right font-mono">${product.price.toFixed(2)}</td>
                  <td className={`p-4 text-right font-mono ${product.stock < 20 ? 'text-red-400' : 'text-green-400'}`}>
                    {product.stock}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredProducts.length === 0 && (
            <p className="p-6 text-center text-gray-400">No se encontraron productos.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductsView;

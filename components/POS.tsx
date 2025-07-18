import React, { useState, useMemo } from 'react';
import { Product, CartItem } from '@/types';
import { ShoppingCartIcon, TrashIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/solid';

interface POSViewProps {
  products: Product[];
  onSale: (cartItems: CartItem[]) => void;
}

const POSView: React.FC<POSViewProps> = ({ products, onSale }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) && p.stock > 0
    );
  }, [products, searchTerm]);

  const addToCart = (product: Product) => {
    setCart(currentCart => {
      const existingItem = currentCart.find(item => item.id === product.id);
      if (existingItem) {
        if (existingItem.quantity < product.stock) {
          return currentCart.map(item =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          );
        }
        return currentCart;
      }
      return [...currentCart, { ...product, quantity: 1 }];
    });
  };
  
  const updateQuantity = (productId: string, newQuantity: number) => {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      if (newQuantity <= 0) {
          removeFromCart(productId);
      } else if (newQuantity <= product.stock) {
          setCart(cart.map(item => item.id === productId ? { ...item, quantity: newQuantity } : item));
      }
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  };
  
  const total = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [cart]);

  const handleCompleteSale = () => {
    if (cart.length === 0) return;
    onSale(cart);
    setCart([]);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full gap-6">
      {/* Products List */}
      <div className="lg:w-3/5 flex flex-col bg-gray-800 rounded-lg shadow-lg p-4">
        <h1 className="text-2xl font-bold text-white mb-4">Punto de Venta</h1>
        <input
          type="text"
          placeholder="Buscar productos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 mb-4 bg-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-gray-700 rounded-lg p-4 flex flex-col justify-between shadow-md hover:bg-gray-600 transition-colors">
                <div>
                  <img src={product.imageUrl} alt={product.name} className="w-full h-32 object-cover rounded-md mb-2"/>
                  <h2 className="font-bold text-white text-md">{product.name}</h2>
                  <p className="text-sm text-gray-300">{product.category}</p>
                   <p className="text-xs text-gray-400">Stock: {product.stock}</p>
                </div>
                <div className="flex justify-between items-center mt-3">
                  <p className="text-lg font-semibold text-green-400">${product.price.toFixed(2)}</p>
                  <button
                    onClick={() => addToCart(product)}
                    className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors disabled:bg-gray-500"
                    disabled={product.stock <= (cart.find(item => item.id === product.id)?.quantity || 0)}
                  >
                    <PlusIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cart */}
      <div className="lg:w-2/5 flex flex-col bg-gray-800 rounded-lg shadow-lg p-4">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center"><ShoppingCartIcon className="h-6 w-6 mr-2"/> Carrito</h2>
        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <p className="text-gray-400 text-center mt-10">El carrito está vacío.</p>
          ) : (
            <ul className="space-y-3">
              {cart.map(item => (
                <li key={item.id} className="flex items-center justify-between bg-gray-700 p-3 rounded-md">
                  <div className="flex-1">
                    <p className="font-semibold text-white">{item.name}</p>
                    <p className="text-sm text-gray-300">${item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 rounded-full bg-gray-600 hover:bg-gray-500"><MinusIcon className="h-4 w-4 text-white"/></button>
                    <span className="w-8 text-center font-bold text-white">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 rounded-full bg-gray-600 hover:bg-gray-500"><PlusIcon className="h-4 w-4 text-white"/></button>
                  </div>
                   <button onClick={() => removeFromCart(item.id)} className="ml-4 text-red-400 hover:text-red-500">
                      <TrashIcon className="h-5 w-5" />
                   </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border-t border-gray-700 mt-4 pt-4">
            <div className="flex justify-between items-center text-lg font-bold text-white">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
            </div>
            <button
                onClick={handleCompleteSale}
                disabled={cart.length === 0}
                className="w-full bg-green-500 text-white font-bold py-3 rounded-md mt-4 hover:bg-green-600 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
                Completar Venta
            </button>
        </div>
      </div>
    </div>
  );
};

export default POSView;

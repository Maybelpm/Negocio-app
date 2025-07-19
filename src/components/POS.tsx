import React, { useState, useMemo } from 'react';
import { Product, CartItem } from '../types';
import { ShoppingCartIcon, XCircleIcon } from '@heroicons/react/24/solid';

interface POSViewProps {
  products: Product[];
  onSale: (cartItems: CartItem[]) => Promise<void>;
}

const POSView: React.FC<POSViewProps> = ({ products, onSale }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.id === product.id);
      if (existingItem) {
        // Increase quantity only if it doesn't exceed stock
        return currentCart.map((item) =>
          item.id === product.id && item.quantity < product.stock
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...currentCart, { ...product, quantity: 1 }];
    });
  };
  
  const updateQuantity = (productId: string, newQuantity: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (newQuantity <= 0) {
      setCart(currentCart => currentCart.filter(item => item.id !== productId));
    } else if (newQuantity <= product.stock) {
      setCart(currentCart => currentCart.map(item => 
        item.id === productId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [products, searchTerm]);

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  }, [cart]);

  const handleProcessSale = async () => {
    if (cart.length === 0 || processing) return;
    setProcessing(true);
    setError(null);
    try {
        await onSale(cart);
        setCart([]);
    } catch (err: any) {
        console.error("Failed to process sale:", err);
        setError(err.message || 'Ocurrió un error inesperado.');
    } finally {
        setProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Product Selection */}
      <div className="lg:col-span-2 bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg border border-white/10 flex flex-col">
        <h2 className="text-xl font-bold text-white mb-4">Productos</h2>
        <input
          type="text"
          placeholder="Buscar producto por nombre..."
          className="w-full bg-gray-700 text-white rounded-md p-2 mb-4 border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto flex-grow pr-2">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              disabled={product.stock <= 0}
              className="bg-gray-700 rounded-lg p-3 flex flex-col items-center justify-between cursor-pointer hover:bg-gray-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <img src={product.imageUrl || `https://picsum.photos/seed/${product.id}/200`} alt={product.name} className="h-24 w-24 object-cover rounded-md mb-2" />
              <p className="text-white font-semibold text-center text-sm flex-grow">{product.name}</p>
              <div className="w-full mt-2">
                <p className="text-green-400 font-bold">${product.price.toFixed(2)}</p>
                <p className={`text-xs ${product.stock > 0 ? 'text-gray-400' : 'text-red-500 font-bold'}`}>
                  {product.stock > 0 ? `Stock: ${product.stock}` : 'Agotado'}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart */}
      <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg border border-white/10 flex flex-col h-full">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <ShoppingCartIcon className="h-6 w-6 mr-2" /> Carrito
        </h2>
        <div className="flex-grow overflow-y-auto pr-2 -mr-2">
          {cart.length === 0 ? (
            <p className="text-gray-400 text-center mt-8">El carrito está vacío</p>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center mb-3 bg-gray-700 p-2 rounded-md">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{item.name}</p>
                  <p className="text-gray-400 text-xs">${item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                   <input 
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.id, parseInt(e.target.value, 10) || 0)}
                    className="w-14 bg-gray-800 text-white p-1 text-center rounded-md border border-gray-600"
                    min="1"
                    max={item.stock}
                   />
                  <p className="text-white font-semibold w-20 text-right">${(item.price * item.quantity).toFixed(2)}</p>
                  <button onClick={() => updateQuantity(item.id, 0)} aria-label="Eliminar item">
                    <XCircleIcon className="h-5 w-5 text-red-500 hover:text-red-400"/>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="border-t border-gray-700 mt-auto pt-4">
          {error && <p className="text-red-400 text-sm mb-2 text-center">{error}</p>}
          <div className="flex justify-between text-white font-bold text-xl">
            <span>Total:</span>
            <span>${cartTotal.toFixed(2)}</span>
          </div>
          <button
            onClick={handleProcessSale}
            disabled={cart.length === 0 || processing}
            className="w-full bg-indigo-600 text-white rounded-md p-3 mt-4 font-bold hover:bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            {processing ? 'Procesando...' : 'Cobrar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default POSView;
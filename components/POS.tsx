
import React, { useState, useMemo } from 'react';
import { Product, CartItem, ProductCategory } from '../types';
import Card from './ui/Card';
import Input from './ui/Input';
import Button from './ui/Button';
import Icon from './ui/Icon';

interface POSViewProps {
  products: Product[];
  onSale: (cartItems: CartItem[]) => void;
}

const POSView: React.FC<POSViewProps> = ({ products, onSale }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | 'all'>('all');

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
        alert("Producto agotado");
        return;
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        if(existingItem.quantity < product.stock) {
            return prevCart.map((item) =>
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            );
        } else {
             alert("No hay más stock disponible para este producto.");
             return prevCart;
        }
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    if (newQuantity > product.stock) {
        alert("No se puede agregar más que el stock disponible.");
        newQuantity = product.stock;
    }

    setCart((prevCart) => {
      if (newQuantity <= 0) {
        return prevCart.filter((item) => item.id !== productId);
      }
      return prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      );
    });
  };
  
  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const filteredProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (categoryFilter === 'all' || p.category === categoryFilter)
    );
  }, [products, searchTerm, categoryFilter]);
  
  const handleCheckout = () => {
      if(cart.length === 0) {
          alert("El carrito está vacío.");
          return;
      }
      onSale(cart);
      setCart([]);
      alert("¡Venta realizada con éxito!");
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-4rem)]">
      {/* Product Grid */}
      <div className="flex-grow lg:w-2/3 animate-fade-in">
        <div className="sticky top-0 bg-gray-900 py-4 z-10">
            <h1 className="text-3xl font-bold text-white mb-4">Punto de Venta</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <Input
                    placeholder="Buscar producto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    containerClassName="md:col-span-2"
                />
                <select 
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value as ProductCategory | 'all')}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="all">Todas las Categorías</option>
                    {Object.values(ProductCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
            </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4 overflow-y-auto h-[calc(100%-10rem)] pr-2">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className={`p-3 cursor-pointer transition-transform transform hover:scale-105 ${product.stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => addToCart(product)}
            >
              <img src={product.imageUrl} alt={product.name} className="w-full h-32 object-cover rounded-lg mb-2" />
              <h3 className="font-semibold text-sm truncate">{product.name}</h3>
              <p className="text-blue-400 font-bold">${product.price.toFixed(2)}</p>
              <p className="text-xs text-gray-400">Stock: {product.stock}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* Cart */}
      <div className="lg:w-1/3 h-full flex flex-col animate-fade-in-left">
        <Card className="flex-grow flex flex-col">
          <h2 className="text-xl font-bold mb-4">Carrito</h2>
          <div className="flex-grow overflow-y-auto -mr-4 pr-4">
            {cart.length === 0 ? (
              <p className="text-gray-400 text-center mt-10">El carrito está vacío.</p>
            ) : (
              <ul className="space-y-3">
                {cart.map((item) => (
                  <li key={item.id} className="flex items-center gap-3">
                    <img src={item.imageUrl} alt={item.name} className="w-12 h-12 object-cover rounded-md" />
                    <div className="flex-grow">
                      <p className="font-semibold text-sm">{item.name}</p>
                      <p className="text-xs text-gray-400">${item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Input type="number" value={item.quantity} onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 0)} className="w-16 text-center p-1" />
                        <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.id)} className="p-2">
                          <Icon name="trash" className="h-4 w-4 text-red-500" />
                        </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="mt-auto border-t border-gray-700 pt-4">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total:</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <Button
              className="w-full mt-4 text-lg"
              onClick={handleCheckout}
              disabled={cart.length === 0}
            >
              Cobrar
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default POSView;

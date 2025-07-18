import React, { useState, useCallback } from 'react';
import { Product, Sale, AppView, CartItem } from '@/types';
import { INITIAL_PRODUCTS } from '@/constants';
import useLocalStorage from '@/hooks/useLocalStorage';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import ProductsView from '@/components/Products';
import POSView from '@/components/POS';
import ReportsView from '@/components/Reports';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('DASHBOARD');
  const [products, setProducts] = useLocalStorage<Product[]>('omnipos_products', INITIAL_PRODUCTS);
  const [sales, setSales] = useLocalStorage<Sale[]>('omnipos_sales', []);

  const handleSale = useCallback((cartItems: CartItem[]) => {
    // 1. Calculate total
    const total = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

    // 2. Create new sale record
    const newSale: Sale = {
      id: `sale_${Date.now()}`,
      date: new Date().toISOString(),
      items: cartItems,
      total,
    };
    setSales(prevSales => [newSale, ...prevSales]);

    // 3. Update product stock
    setProducts(prevProducts => {
      const updatedProducts = [...prevProducts];
      cartItems.forEach(cartItem => {
        const productIndex = updatedProducts.findIndex(p => p.id === cartItem.id);
        if (productIndex !== -1) {
          updatedProducts[productIndex].stock -= cartItem.quantity;
        }
      });
      return updatedProducts;
    });
  }, [setProducts, setSales]);

  const renderView = () => {
    switch (currentView) {
      case 'DASHBOARD':
        return <Dashboard products={products} sales={sales} />;
      case 'POS':
        return <POSView products={products} onSale={handleSale} />;
      case 'PRODUCTS':
        return <ProductsView products={products} setProducts={setProducts} />;
      case 'REPORTS':
        return <ReportsView sales={sales} />;
      default:
        return <Dashboard products={products} sales={sales} />;
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar currentView={currentView} setView={setCurrentView} />
      <main className="flex-1 ml-64 p-4 sm:p-6 lg:p-8 bg-gray-900 overflow-y-auto">
        {renderView()}
      </main>
    </div>
  );
};

export default App;
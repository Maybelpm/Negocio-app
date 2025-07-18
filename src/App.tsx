import React, { useState, useEffect, useCallback } from 'react';
import { Product, Sale, AppView, CartItem } from '@/types';
import { supabase } from '@/lib/supabaseClient';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import ProductsView from '@/components/Products';
import POSView from '@/components/POS';
import ReportsView from '@/components/Reports';
import { AppShell } from '@/components/AppShell';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('DASHBOARD');
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isSupabaseConfigured = !!supabase;

  // Fetch initial data from Supabase
  const fetchData = useCallback(async () => {
    if (!isSupabaseConfigured) return;

    setLoading(true);
    setError(null);
    try {
      const productsPromise = supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });
      
      const salesPromise = supabase
        .from('sales')
        .select('*')
        .order('created_at', { ascending: false });

      const [{ data: productsData, error: productsError }, { data: salesData, error: salesError }] = await Promise.all([productsPromise, salesPromise]);

      if (productsError) throw productsError;
      if (salesError) throw salesError;

      setProducts(productsData || []);
      setSales(salesData as Sale[] || []);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError('No se pudieron cargar los datos. Verifique la conexión y la configuración de Supabase.');
    } finally {
      setLoading(false);
    }
  }, [isSupabaseConfigured]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setError('Configuración de Supabase incompleta. Asegúrate de que las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY están en tu archivo .env.local');
      setLoading(false);
      return;
    }
    fetchData();
  }, [fetchData, isSupabaseConfigured]);

  // Set up real-time subscription for product stock changes
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase.channel('realtime-products');
    
    channel
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        console.log('Real-time change received!', payload);
        const updatedRecord = payload.new as Product;
        setProducts(currentProducts => {
            const index = currentProducts.findIndex(p => p.id === updatedRecord.id);
            if (index !== -1) {
                const newProducts = [...currentProducts];
                newProducts[index] = updatedRecord;
                return newProducts;
            }
            return [...currentProducts, updatedRecord];
        });
      })
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('Real-time channel for products is active.');
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('Real-time channel error:', err);
          setError('Error de conexión en tiempo real.');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isSupabaseConfigured]);

  const handleSale = useCallback(async (cartItems: CartItem[]) => {
    if (!supabase) throw new Error("Supabase client not initialized");
    
    const total = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

    const newSalePayload = {
      id: `sale_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      items: cartItems.map(({ id, name, price, quantity }) => ({ id, name, price, quantity })),
      total,
    };

    const { data: insertedSale, error: saleError } = await supabase
      .from('sales')
      .insert(newSalePayload)
      .select()
      .single();

    if (saleError) {
      console.error("Error creating sale:", saleError.message);
      throw new Error("No se pudo registrar la venta.");
    }
    
    const stockUpdatePromises = cartItems.map(item => 
      supabase.rpc('decrement_product_stock', {
        product_id_in: item.id,
        quantity_sold: item.quantity
      })
    );

    await Promise.all(stockUpdatePromises);
    
    if (insertedSale) {
      setSales(currentSales => [insertedSale as Sale, ...currentSales]);
    }

  }, []);

  const renderView = () => {
    if (loading) {
      return <div className="flex justify-center items-center h-full"><p className="text-xl">Cargando datos...</p></div>;
    }
    if (error) {
      return <div className="m-auto text-center bg-red-900/50 border border-red-500 p-8 rounded-lg max-w-lg">
          <h2 className="text-2xl font-bold text-red-300">Error de Configuración</h2>
          <p className="text-red-200 mt-2">{error}</p>
          <button onClick={fetchData} className="mt-6 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded disabled:opacity-50" disabled={!isSupabaseConfigured}>
            Reintentar
          </button>
        </div>;
    }
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
    <AppShell
      sidebar={<Sidebar currentView={currentView} setView={setCurrentView} />}
    >
      {renderView()}
    </AppShell>
  );
};

export default App;
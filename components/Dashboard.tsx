
import React from 'react';
import { Product, Sale } from '../types';
import Card from './ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  products: Product[];
  sales: Sale[];
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <Card className="flex items-center p-4">
        <div className="p-3 mr-4 text-blue-500 bg-blue-100 rounded-full dark:text-blue-100 dark:bg-blue-500">
            {icon}
        </div>
        <div>
            <p className="mb-2 text-sm font-medium text-gray-400">{title}</p>
            <p className="text-lg font-semibold text-white">{value}</p>
        </div>
    </Card>
);

const Dashboard: React.FC<DashboardProps> = ({ products, sales }) => {
  const totalRevenue = sales.reduce((acc, sale) => acc + sale.total, 0);
  const totalSalesCount = sales.length;
  const productsSold = sales.reduce((acc, sale) => acc + sale.items.reduce((itemAcc, item) => itemAcc + item.quantity, 0), 0);
  const totalInventory = products.reduce((acc, product) => acc + product.stock, 0);

  // Process data for sales chart (last 7 days)
  const salesByDay = sales.reduce((acc, sale) => {
    const date = new Date(sale.date).toLocaleDateString();
    acc[date] = (acc[date] || 0) + sale.total;
    return acc;
  }, {} as { [key: string]: number });

  const chartData = Object.keys(salesByDay)
    .map(date => ({
      name: date,
      Ventas: salesByDay[date],
    }))
    .slice(0, 7); // Limit to last 7 for simplicity

  const topProducts = sales
    .flatMap(s => s.items)
    .reduce((acc, item) => {
      acc[item.name] = (acc[item.name] || 0) + item.quantity;
      return acc;
    }, {} as {[key: string]: number})
    
  const sortedTopProducts = Object.entries(topProducts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);


  return (
    <div className="space-y-8 animate-fade-in">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Ingresos Totales" value={`$${totalRevenue.toFixed(2)}`} icon={'💲'} />
            <StatCard title="Ventas Totales" value={totalSalesCount} icon={'🛒'} />
            <StatCard title="Productos Vendidos" value={productsSold} icon={'📦'} />
            <StatCard title="Inventario Total" value={totalInventory} icon={'🏭'} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 h-96">
                <h2 className="text-lg font-semibold mb-4">Rendimiento de Ventas</h2>
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                        <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                        <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(value) => `$${value}`} />
                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }} />
                        <Legend />
                        <Bar dataKey="Ventas" fill="#3b82f6" />
                    </BarChart>
                </ResponsiveContainer>
            </Card>
            <Card>
                <h2 className="text-lg font-semibold mb-4">Productos Más Vendidos</h2>
                <ul className="space-y-4">
                    {sortedTopProducts.length > 0 ? sortedTopProducts.map(([name, quantity]) => (
                        <li key={name} className="flex justify-between items-center">
                            <span className="text-gray-300">{name}</span>
                            <span className="font-semibold text-white bg-gray-700 px-2 py-1 rounded-md text-sm">{quantity} vendidos</span>
                        </li>
                    )) : <p className="text-gray-400 text-center mt-8">No hay datos de ventas aún.</p>}
                </ul>
            </Card>
        </div>
    </div>
  );
};

export default Dashboard;

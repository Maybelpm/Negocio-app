import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Product, Sale } from '@/types';

interface DashboardProps {
  products: Product[];
  sales: Sale[];
}

const Dashboard: React.FC<DashboardProps> = ({ products, sales }) => {
  const totalRevenue = sales.reduce((acc, sale) => acc + sale.total, 0);
  const totalSales = sales.length;
  const productsInStock = products.reduce((acc, product) => acc + product.stock, 0);

  // Process sales data for the chart
  const salesByDay = sales.reduce((acc, sale) => {
    const date = new Date(sale.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
    if (!acc[date]) {
      acc[date] = 0;
    }
    acc[date] += sale.total;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.keys(salesByDay).map(date => ({
    date,
    Ingresos: salesByDay[date],
  })).reverse();


  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-medium text-gray-400">Ingresos Totales</h3>
          <p className="text-3xl font-semibold text-green-400">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-medium text-gray-400">Ventas Totales</h3>
          <p className="text-3xl font-semibold text-blue-400">{totalSales}</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h3 className="text-lg font-medium text-gray-400">Productos en Stock</h3>
          <p className="text-3xl font-semibold text-purple-400">{productsInStock}</p>
        </div>
      </div>

      {/* Sales Chart */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
         <h3 className="text-xl font-semibold text-white mb-4">Ingresos por Día</h3>
         {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                <XAxis dataKey="date" stroke="#A0AEC0" />
                <YAxis stroke="#A0AEC0" tickFormatter={(value) => formatCurrency(value as number)}/>
                <Tooltip 
                    contentStyle={{ backgroundColor: '#2D3748', border: 'none', borderRadius: '0.5rem' }} 
                    labelStyle={{ color: '#E2E8F0' }}
                    itemStyle={{ color: '#63B3ED' }}
                    formatter={(value) => formatCurrency(value as number)}
                />
                <Legend wrapperStyle={{ color: '#E2E8F0' }}/>
                <Bar dataKey="Ingresos" fill="#63B3ED" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
         ) : (
            <div className="flex items-center justify-center h-72">
                <p className="text-gray-400">No hay datos de ventas para mostrar en el gráfico.</p>
            </div>
         )}
      </div>
    </div>
  );
};

export default Dashboard;

import React from 'react';
import { Product, Sale } from '../types';
import { ArrowTrendingUpIcon, BanknotesIcon, CubeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface DashboardProps {
  products: Product[];
  sales: Sale[];
}

const StatCard: React.FC<{ title: string; value: string; icon: React.ElementType, color: string }> = ({ title, value, icon: Icon, color }) => (
    <div className="bg-gray-800/50 backdrop-blur-sm overflow-hidden shadow-lg rounded-lg p-5 border border-white/10">
        <div className="flex items-center">
            <div className={`flex-shrink-0 p-3 rounded-md ${color}`}>
                <Icon className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <div className="ml-5 w-0 flex-1">
                <dt className="text-sm font-medium text-gray-400 truncate">{title}</dt>
                <dd className="flex items-baseline">
                    <p className="text-2xl font-semibold text-white">{value}</p>
                </dd>
            </div>
        </div>
    </div>
);


const Dashboard: React.FC<DashboardProps> = ({ products, sales }) => {
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const lowStockItems = products.filter(p => p.stock <= 10).length;
    const totalProducts = products.length;
    const totalSales = sales.length;

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight text-white mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
            title="Ingresos Totales" 
            value={`$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
            icon={BanknotesIcon}
            color="bg-green-500/80"
        />
        <StatCard 
            title="Ventas Realizadas" 
            value={totalSales.toString()}
            icon={ArrowTrendingUpIcon}
            color="bg-indigo-500/80"
        />
        <StatCard 
            title="Productos en Inventario" 
            value={totalProducts.toString()}
            icon={CubeIcon}
            color="bg-sky-500/80"
        />
        <StatCard 
            title="Items con Bajo Stock" 
            value={lowStockItems.toString()}
            icon={ExclamationTriangleIcon}
            color="bg-red-500/80"
        />
      </div>
      <div className="mt-8 bg-gray-800/50 backdrop-blur-sm border border-white/10 shadow-lg rounded-lg p-5">
        <h2 className="text-xl font-semibold text-white mb-4">Ventas Recientes</h2>
        <ul className="divide-y divide-gray-700">
            {sales.slice(0, 5).map(sale => (
                <li key={sale.id} className="py-3 flex justify-between items-center">
                    <div>
                        <p className="text-sm font-medium text-indigo-400">Venta #{sale.id.slice(-6)}</p>
                        <p className="text-xs text-gray-400">{new Date(sale.created_at).toLocaleString()}</p>
                    </div>
                    <p className="text-sm font-semibold text-green-400">+${sale.total.toFixed(2)}</p>
                </li>
            ))}
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
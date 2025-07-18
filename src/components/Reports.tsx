import React from 'react';
import { Sale, SaleItem } from '@/types';

interface ReportsViewProps {
  sales: Sale[];
}

const ReportsView: React.FC<ReportsViewProps> = ({ sales }) => {
  return (
     <div>
      <h1 className="text-3xl font-bold tracking-tight text-white mb-6">Reportes de Ventas</h1>
       <div className="bg-yellow-900/50 border border-yellow-600 text-yellow-200 p-4 mb-6 rounded-lg" role="alert">
        <p className="font-bold">Funcionalidad en Desarrollo</p>
        <p>Gráficos y análisis detallados de ventas se implementarán próximamente.</p>
      </div>
       <div className="bg-gray-800/50 backdrop-blur-sm border border-white/10 rounded-lg shadow">
         <ul className="divide-y divide-gray-700">
            {sales.map(sale => (
                 <li key={sale.id} className="p-4 flex justify-between items-center hover:bg-gray-700/50">
                     <div>
                        <p className="text-white font-semibold">Venta #{sale.id.slice(-6)}</p>
                        <p className="text-sm text-gray-400">{new Date(sale.created_at).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xl font-bold text-green-400">${sale.total.toFixed(2)}</p>
                        <p className="text-sm text-gray-400">{sale.items.reduce((acc, item) => acc + item.quantity, 0)} artículo(s)</p>
                    </div>
                </li>
            ))}
         </ul>
      </div>
    </div>
  );
};

export default ReportsView;

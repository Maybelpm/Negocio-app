import React from 'react';
import { Sale } from '@/types';

interface ReportsViewProps {
  sales: Sale[];
}

const ReportsView: React.FC<ReportsViewProps> = ({ sales }) => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Reportes de Ventas</h1>
      <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-700 text-gray-300 uppercase text-sm">
              <tr>
                <th className="p-4">ID Venta</th>
                <th className="p-4">Fecha</th>
                <th className="p-4">Artículos</th>
                <th className="p-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="text-gray-200">
              {sales.map(sale => (
                <tr key={sale.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                  <td className="p-4 font-mono text-xs">{sale.id}</td>
                  <td className="p-4">
                    {new Date(sale.date).toLocaleString('es-ES', { 
                      year: 'numeric', month: 'long', day: 'numeric', 
                      hour: '2-digit', minute: '2-digit' 
                    })}
                  </td>
                  <td className="p-4">
                    <ul>
                      {sale.items.map(item => (
                        <li key={item.id} className="text-sm">
                          {item.quantity} x {item.name}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="p-4 text-right font-bold text-green-400 font-mono">
                    ${sale.total.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sales.length === 0 && (
            <p className="p-6 text-center text-gray-400">No hay ventas registradas.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsView;

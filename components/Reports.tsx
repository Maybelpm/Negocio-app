
import React from 'react';
import { Sale, Location } from '../types';

interface ReportsViewProps {
  sales: Sale[];
  locations: Location[];
}

const ReportsView: React.FC<ReportsViewProps> = ({ sales, locations }) => {
  const getLocationName = (locationId: string) => {
    return locations.find(l => l.id === locationId)?.name || 'Desconocida';
  };
    
  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold text-white mb-6">Reporte de Ventas Consolidado</h1>

      <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                    <tr>
                        <th scope="col" className="px-6 py-3">ID de Venta</th>
                        <th scope="col" className="px-6 py-3">Fecha</th>
                        <th scope="col" className="px-6 py-3">Ubicación</th>
                        <th scope="col" className="px-6 py-3">Items</th>
                        <th scope="col" className="px-6 py-3 text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {sales.length > 0 ? sales.map((sale) => (
                    <tr key={sale.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
                        <td className="px-6 py-4 font-mono text-xs">{sale.id}</td>
                        <td className="px-6 py-4">{new Date(sale.date).toLocaleString()}</td>
                        <td className="px-6 py-4 font-semibold">{getLocationName(sale.locationId)}</td>
                        <td className="px-6 py-4">
                            <ul className="list-disc list-inside">
                                {sale.items.map(item => (
                                    <li key={`${sale.id}-${item.id}`}>{item.quantity} x {item.name}</li>
                                ))}
                            </ul>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-white">${sale.total.toFixed(2)}</td>
                    </tr>
                    )) : (
                        <tr>
                            <td colSpan={5} className="text-center py-10 text-gray-400">No se han registrado ventas todavía.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsView;

import React from 'react';
import { HomeIcon, ShoppingBagIcon, ArchiveBoxIcon, ChartBarIcon } from '@heroicons/react/24/solid';
import { AppView } from '@/types';

interface SidebarProps {
  currentView: AppView;
  setView: (view: AppView) => void;
}

const navItems = [
  { view: 'DASHBOARD' as AppView, label: 'Dashboard', icon: HomeIcon },
  { view: 'POS' as AppView, label: 'Punto de Venta', icon: ShoppingBagIcon },
  { view: 'PRODUCTS' as AppView, label: 'Productos', icon: ArchiveBoxIcon },
  { view: 'REPORTS' as AppView, label: 'Reportes', icon: ChartBarIcon },
];

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  return (
    <aside className="fixed top-0 left-0 w-64 h-full bg-gray-800 text-white flex flex-col shadow-2xl">
      <div className="px-8 py-6 border-b border-gray-700">
        <h1 className="text-2xl font-bold text-white">Omni<span className="text-blue-400">POS</span></h1>
        <p className="text-xs text-gray-400">Venta Inteligente</p>
      </div>
      <nav className="flex-1 px-4 py-4">
        <ul>
          {navItems.map(item => (
            <li key={item.view}>
              <button
                onClick={() => setView(item.view)}
                className={`flex items-center w-full px-4 py-3 my-1 rounded-lg transition-colors
                  ${currentView === item.view 
                    ? 'bg-blue-500 text-white shadow-lg' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
              >
                <item.icon className="h-6 w-6 mr-3" />
                <span className="font-medium">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="px-8 py-4 border-t border-gray-700 text-center text-xs text-gray-500">
        <p>&copy; {new Date().getFullYear()} OmniPOS</p>
      </div>
    </aside>
  );
};

export default Sidebar;

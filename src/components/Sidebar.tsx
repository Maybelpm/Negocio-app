import React from 'react';
import {
  ChartBarIcon,
  ShoppingCartIcon,
  CubeIcon,
  DocumentChartBarIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline';
import { AppView } from '../types';

interface SidebarProps {
  currentView: AppView;
  setView: (view: AppView) => void;
}

const navItems = [
  { id: 'DASHBOARD', label: 'Dashboard', icon: ChartBarIcon },
  { id: 'POS', label: 'Punto de Venta', icon: ShoppingCartIcon },
  { id: 'PRODUCTS', label: 'Productos', icon: CubeIcon },
  { id: 'REPORTS', label: 'Reportes', icon: DocumentChartBarIcon },
];

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  return (
    <aside className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-800 border-r border-gray-700 px-6 pb-4 w-full lg:w-64">
      <div className="flex h-16 shrink-0 items-center gap-x-4">
         <CpuChipIcon className="h-8 w-8 text-indigo-400" />
        <span className="text-2xl font-bold text-white">OmniPOS</span>
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navItems.map((item) => (
                <li key={item.id}>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setView(item.id as AppView);
                    }}
                    className={`
                      group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold
                      ${
                        currentView === item.id
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }
                    `}
                  >
                    <item.icon
                      className={`h-6 w-6 shrink-0 ${
                        currentView === item.id
                          ? 'text-white'
                          : 'text-gray-400 group-hover:text-white'
                      }`}
                      aria-hidden="true"
                    />
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
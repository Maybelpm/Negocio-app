
import React from 'react';
import { AppView } from '../types';
import Icon from './ui/Icon';

interface SidebarProps {
  currentView: AppView;
  setView: (view: AppView) => void;
}

const NavItem: React.FC<{
  view: AppView;
  label: string;
  icon: string;
  currentView: AppView;
  setView: (view: AppView) => void;
}> = ({ view, label, icon, currentView, setView }) => {
  const isActive = currentView === view;
  return (
    <li>
      <button
        onClick={() => setView(view)}
        className={`w-full flex items-center p-3 rounded-lg transition-colors duration-200 ${
          isActive
            ? 'bg-blue-600 text-white'
            : 'text-gray-400 hover:bg-gray-700 hover:text-white'
        }`}
      >
        <Icon name={icon} className="h-5 w-5 mr-3" />
        <span className="font-medium">{label}</span>
      </button>
    </li>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  return (
    <aside className="w-64 bg-gray-800 p-4 flex flex-col fixed h-full">
      <div className="flex items-center mb-8">
        <div className="bg-blue-600 p-2 rounded-lg mr-3">
            <Icon name="pos" className="h-8 w-8 text-white"/>
        </div>
        <h1 className="text-xl font-bold text-white">OmniPOS</h1>
      </div>
      <nav>
        <ul className="space-y-2">
          <NavItem view="DASHBOARD" label="Dashboard" icon="dashboard" currentView={currentView} setView={setView} />
          <NavItem view="POS" label="Punto de Venta" icon="pos" currentView={currentView} setView={setView} />
          <NavItem view="PRODUCTS" label="Productos e Inventario" icon="products" currentView={currentView} setView={setView} />
          <NavItem view="REPORTS" label="Reportes" icon="reports" currentView={currentView} setView={setView} />
        </ul>
      </nav>
      <div className="mt-auto text-center text-gray-500 text-xs">
          <p>Hecho con ❤️ para tu negocio.</p>
          <p>&copy; {new Date().getFullYear()} OmniPOS</p>
      </div>
    </aside>
  );
};

export default Sidebar;

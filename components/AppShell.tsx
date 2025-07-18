import React, { useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

interface AppShellProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ sidebar, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      {/* Static sidebar for desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        {sidebar}
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden" role="dialog" aria-modal="true">
          <div className="fixed inset-0 z-40 flex">
            <div className="fixed inset-0 bg-gray-900/80" aria-hidden="true" onClick={() => setSidebarOpen(false)}></div>
            <div className="relative mr-16 flex w-full max-w-xs flex-1">
               <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                  <span className="sr-only">Close sidebar</span>
                  <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                </button>
              </div>
              {sidebar}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-30 flex h-16 items-center justify-between gap-x-6 border-b border-gray-700 bg-gray-900 px-4 sm:px-6 lg:px-8">
           <button type="button" className="-m-2.5 p-2.5 text-gray-400" onClick={() => setSidebarOpen(true)}>
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
           <div className="flex-1 text-sm font-semibold leading-6 text-white">Dashboard</div>
        </div>

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

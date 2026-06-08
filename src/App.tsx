import { useState, useEffect } from 'react';
import { Package, Truck, AlertTriangle, RefreshCcw, ClipboardList, LayoutDashboard } from "lucide-react";
import LivreursView from './components/LivreursView.tsx';
import CommandesView from './components/CommandesView.tsx';

// A simple local client for our API// App.tsx - Modifiez l'apiClient
export const apiClient = {
  get: async (url: string) => {
    // Utilisez localhost:3001 pour le backend
    const fullUrl = `http://localhost:3001${url}`;
    const res = await fetch(fullUrl);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  post: async (url: string, data: any) => {
    const res = await fetch(`http://localhost:3001${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  put: async (url: string, data: any) => {
    const res = await fetch(`http://localhost:3001${url}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  delete: async (url: string) => {
    const res = await fetch(`http://localhost:3001${url}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }
};

type ViewState = 'dashboard' | 'livreurs' | 'commandes' | 'incidents' | 'retours' | 'statuts';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('livreurs');

  const navItems = [
    { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
    { id: 'livreurs', label: 'Livreurs', icon: Truck },
    { id: 'commandes', label: 'Commandes', icon: ClipboardList },
    { id: 'statuts', label: 'Statuts Livraison', icon: Package },
    { id: 'incidents', label: 'Incidents', icon: AlertTriangle },
    { id: 'retours', label: 'Retours / OLTP', icon: RefreshCcw },
  ] as const;

  return (
    <div className="flex h-full border-2 border-line bg-base flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b-2 border-line flex items-center justify-between px-5 h-[60px] shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-[30px] h-[30px] bg-ink"></div>
          <span className="font-black text-[18px] tracking-tight uppercase">Logistics.OS v1.6</span>
        </div>
        <div className="flex gap-5 text-xs font-mono items-center">
          <span>DB: WAREHOUSE_DB</span>
          <span>CONTAINER: PSQL_16</span>
          <span className="text-[#228B22] font-bold">● ONLINE</span>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[200px] border-r-2 border-line flex flex-col bg-base shrink-0">
          <nav className="flex-1 flex flex-col">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`flex items-center gap-3 px-5 py-3 border-b border-line text-[13px] font-semibold uppercase tracking-[0.05em] transition-colors text-left
                  ${currentView === item.id 
                    ? 'bg-ink text-base' 
                    : 'text-ink hover:bg-ink hover:text-base'}`}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div className="mt-auto p-5 text-[10px] opacity-50 font-mono text-ink">
            SYSTEM: AIRFLOW_DAG_RUNNING
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden flex flex-col bg-white">
          {currentView === 'livreurs' && <LivreursView />}
          {currentView === 'commandes' && <CommandesView />}
          {['dashboard', 'incidents', 'retours', 'statuts'].includes(currentView) && (
            <div className="p-8 text-center py-20 text-ink/50 overflow-auto">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-bold font-serif italic uppercase">Module: {currentView}</h3>
              <p className="mt-2 text-xs font-mono">Interface in development. Connected to PostgreSQL instance.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

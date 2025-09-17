// src/components/AdminRatePanel.tsx
import React, { useState } from 'react';

export default function AdminRatePanel() {
  const [rate, setRate] = useState<number>(120);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Ajusta este header si quieres otra forma de auth
  const ADMIN_SECRET = (import.meta.env.VITE_ADMIN_SECRET || '') as string;

  const handleSave = async () => {
    setBusy(true);
    setMsg(null);
    try {
      // 1) actualizar exchange_rates
      const res1 = await fetch('/.netlify/functions/updateExchangeRate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_SECRET },
        body: JSON.stringify({ currency_from: 'USD', currency_to: 'CUP', rate, changed_by: 'admin-web' })
      });
      const j1 = await res1.json().catch(() => null);
      if (!res1.ok) throw new Error(j1?.error || 'Error actualizando tasa');

      // 2) llamar a recalcPrices para aplicar legacy
      const res2 = await fetch('/.netlify/functions/recalcPrices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-secret': ADMIN_SECRET },
        body: JSON.stringify({ currency_from: 'USD', currency_to: 'CUP', rate })
      });
      const j2 = await res2.json();
      if (!res2.ok) throw new Error(j2?.error || 'Error recalculando precios');

      setMsg(`Tasa guardada: ${rate}. Recalculados: sale=${j2.updated_sale_products}, cost=${j2.updated_cost_products}`);
    } catch (err: any) {
      console.error('admin rate error', err);
      setMsg('Error: ' + (err.message || String(err)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 bg-gray-800/50 rounded-lg">
      <h3 className="text-lg font-bold mb-2 text-white">Admin — Tasa USD → CUP</h3>
      <div className="flex items-center gap-2 mb-4">
        <input
          type="number"
          step="0.01"
          min="0"
          value={rate}
          onChange={(e) => setRate(Number(e.target.value))}
          className="p-2 border rounded w-32 bg-gray-700 text-white"
        />
        <button onClick={handleSave} disabled={busy} className="px-4 py-2 bg-indigo-600 text-white rounded">
          {busy ? 'Procesando...' : 'Guardar y recalcular'}
        </button>
      </div>
      {msg && <div className="text-sm text-gray-300">{msg}</div>}
      <div className="text-xs text-gray-400 mt-3">Protegido por ADMIN_SECRET (env var). No exponer.</div>
    </div>
  );
}

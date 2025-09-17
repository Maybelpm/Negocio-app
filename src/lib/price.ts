// src/lib/price.ts
export function priceToCUP(amount: number | string | null | undefined, currency: string | null | undefined, usdToCupRate: number | null | undefined) {
  const a = Number(amount ?? 0) || 0;
  const c = String(currency ?? 'CUP').toUpperCase();
  if (c === 'CUP') return a;
  if (c === 'USD') return a * (Number(usdToCupRate ?? 0) || 0);
  // Si en el futuro añades más monedas, extiende aquí.
  return a;
}

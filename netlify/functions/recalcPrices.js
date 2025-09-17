// netlify/functions/recalcPrices.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_SECRET = process.env.ADMIN_SECRET;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function nowIso() {
  return new Date().toISOString();
}

exports.handler = async (event) => {
  try {
    // Auth simple
    const incomingSecret = (event.headers && (event.headers['x-admin-secret'] || event.headers['X-Admin-Secret'])) || '';
    if (!ADMIN_SECRET || incomingSecret !== ADMIN_SECRET) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const body = event.body ? JSON.parse(event.body) : {};
    const currencyFrom = (body.currency_from || 'USD').toUpperCase();
    const currencyTo = (body.currency_to || 'CUP').toUpperCase();
    const providedRate = body.rate ? Number(body.rate) : null;

    // obtener rate si no fue provista
    let rate = providedRate;
    if (!rate) {
      const { data: rateRow, error: rateErr } = await supabase
        .from('exchange_rates')
        .select('rate')
        .eq('currency_from', currencyFrom)
        .eq('currency_to', currencyTo)
        .limit(1)
        .single();

      if (rateErr) {
        console.error('Error fetching rate:', rateErr);
        return { statusCode: 500, body: JSON.stringify({ error: rateErr.message }) };
      }
      rate = Number(rateRow?.rate ?? 0);
    }

    if (!rate || Number(rate) <= 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid rate' }) };
    }

    const now = nowIso();

    // Actualizamos sale_price donde sale_price_currency = currencyFrom
    const { error: saleErr } = await supabase
      .from('products')
      .update({
        sale_price: supabase.raw('ROUND((COALESCE(sale_price_amount,0) * ?)::numeric, 2)', [rate]),
        sale_price_rate_applied: rate,
        last_recalculated_at: now
      })
      .eq('sale_price_currency', currencyFrom);

    if (saleErr) {
      console.error('Error updating sale_price:', saleErr);
      return { statusCode: 500, body: JSON.stringify({ error: saleErr.message }) };
    }

    // Actualizamos cost_price donde cost_price_currency = currencyFrom
    const { error: costErr } = await supabase
      .from('products')
      .update({
        cost_price: supabase.raw('ROUND((COALESCE(cost_price_amount,0) * ?)::numeric, 2)', [rate]),
        cost_price_rate_applied: rate,
        last_recalculated_at: now
      })
      .eq('cost_price_currency', currencyFrom);

    if (costErr) {
      console.error('Error updating cost_price:', costErr);
      return { statusCode: 500, body: JSON.stringify({ error: costErr.message }) };
    }

    // contar cantidad actualizada (opcional)
    const { count: saleCount } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('sale_price_currency', currencyFrom);

    const { count: costCount } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('cost_price_currency', currencyFrom);

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        rate,
        updated_sale_products: saleCount,
        updated_cost_products: costCount,
        timestamp: now
      })
    };
  } catch (err) {
    console.error('recalcPrices error', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message || String(err) }) };
  }
};

/*// netlify/functions/updateExchangeRate.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

exports.handler = async (event) => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const currency_from = (body.currency_from || 'USD').toUpperCase();
    const currency_to = (body.currency_to || 'CUP').toUpperCase();
    const rate = Number(body.rate);

    if (!currency_from || !currency_to || !rate || rate <= 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'currency_from, currency_to y rate (>0) son requeridos' }) };
    }

    const { data: existing } = await supabase
      .from('exchange_rates')
      .select('*')
      .eq('currency_from', currency_from)
      .eq('currency_to', currency_to)
      .limit(1)
      .single()
      .catch(() => ({ data: null }));

    const oldRate = existing?.rate ?? null;

    const { error: upsertErr } = await supabase
      .from('exchange_rates')
      .upsert({ currency_from, currency_to, rate, updated_at: new Date().toISOString() }, { onConflict: ['currency_from', 'currency_to'] });

    if (upsertErr) {
      console.error('upsertErr', upsertErr);
      return { statusCode: 500, body: JSON.stringify({ error: upsertErr.message }) };
    }

    // history (best-effort)
    await supabase
      .from('exchange_rates_history')
      .insert({
        currency_from,
        currency_to,
        old_rate: oldRate,
        new_rate: rate,
        changed_by: body.changed_by || 'admin-ui'
      })
      .catch(err => console.warn('history insert error', err));

    return { statusCode: 200, body: JSON.stringify({ ok: true, currency_from, currency_to, rate }) };
  } catch (err) {
    console.error('updateExchangeRate error', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message || String(err) }) };
  }
};
*/
// netlify/functions/updateExchangeRate.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing Supabase env vars');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

exports.handler = async (event) => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const currency_from = (body.currency_from || 'USD').toUpperCase();
    const currency_to = (body.currency_to || 'CUP').toUpperCase();
    const rate = Number(body.rate);

    if (!currency_from || !currency_to || !rate || rate <= 0) {
      return { statusCode: 400, body: JSON.stringify({ error: 'currency_from, currency_to y rate (>0) son requeridos' }) };
    }

    // --- aquí usamos maybeSingle() en vez de single().catch(...)
    const { data: existing, error: fetchErr } = await supabase
      .from('exchange_rates')
      .select('*')
      .eq('currency_from', currency_from)
      .eq('currency_to', currency_to)
      .limit(1)
      .maybeSingle();

    if (fetchErr) {
      console.warn('Error fetching existing rate (non-fatal):', fetchErr);
    }

    const oldRate = existing?.rate ?? null;

    // upsert
    const { error: upsertErr } = await supabase
      .from('exchange_rates')
      .upsert({ currency_from, currency_to, rate, updated_at: new Date().toISOString() }, { onConflict: ['currency_from', 'currency_to'] });

    if (upsertErr) {
      console.error('upsertErr', upsertErr);
      return { statusCode: 500, body: JSON.stringify({ error: upsertErr.message }) };
    }

    // save history (best-effort)
    await supabase
      .from('exchange_rates_history')
      .insert({
        currency_from,
        currency_to,
        old_rate: oldRate,
        new_rate: rate,
        changed_by: body.changed_by || 'admin-ui'
      })
      .catch(err => console.warn('history insert error', err));

    return { statusCode: 200, body: JSON.stringify({ ok: true, currency_from, currency_to, rate }) };
  } catch (err) {
    console.error('updateExchangeRate error', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message || String(err) }) };
  }
};

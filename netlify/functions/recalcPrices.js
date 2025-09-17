// netlify/functions/recalcPrices.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  try {
    // opcion para pasar par y rate por body (JSON) o usar USD->CUP por defecto
    const body = event.body ? JSON.parse(event.body) : {};
    const currencyFrom = (body.currency_from || 'USD').toUpperCase();
    const currencyTo = (body.currency_to || 'CUP').toUpperCase();
    // si pasas rate en body, lo usaremos directamente (útil para pruebas)
    const providedRate = body.rate ? Number(body.rate) : null;

    // obtener tasa si no fue proporcionada
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

    // construimos SQL seguro: actualiza productos que tengan *_currency = currencyFrom
    // Usamos ROUND(...,2) para legacy, y actualizamos rate_applied y last_recalculated_at.
    // Vamos a ejecutar dos UPDATEs (sale_price, cost_price) en una transacción (via RPC no disponible aquí, usamos dos queries).
    // 1) actualizar sale_price para los productos con sale_price_currency = currencyFrom
    const saleSql = `
      UPDATE products
      SET sale_price = ROUND((COALESCE(sale_price_amount, 0) * $1)::numeric, 2),
          sale_price_rate_applied = $1,
          last_recalculated_at = now()
      WHERE COALESCE(UPPER(sale_price_currency),'CUP') = UPPER($2)
    `;
    const costSql = `
      UPDATE products
      SET cost_price = ROUND((COALESCE(cost_price_amount, 0) * $1)::numeric, 2),
          cost_price_rate_applied = $1,
          last_recalculated_at = now()
      WHERE COALESCE(UPPER(cost_price_currency),'CUP') = UPPER($2)
    `;

    const { error: saleErr } = await supabase.rpc('sql', { sql: saleSql, params: [rate, currencyFrom] })
      .catch(() => ({ error: { message: 'RPC not available' } })); // fallback abajo

    // Supabase JS no expone exec raw SQL direct easily; si RPC 'sql' no existe, usamos .from().update with filter:
    if (saleErr && saleErr.message === 'RPC not available') {
      // falla segura: usar query builder
      const { error: sErr } = await supabase
        .from('products')
        .update({
          sale_price: supabase.raw('ROUND((COALESCE(sale_price_amount,0) * ?)::numeric, 2)', [rate]),
          sale_price_rate_applied: rate,
          last_recalculated_at: new Date().toISOString()
        })
        .eq('sale_price_currency', currencyFrom);
      if (sErr) {
        console.error('Error updating sale_price fallback:', sErr);
        // no retornamos aún; intentamos cost update también
      }
    } else if (!saleErr) {
      // If RPC succeeded (rare), it's done
    }

    // Now update cost_price similarly (using query builder fallback always because of portability)
    const { error: costErr } = await supabase
      .from('products')
      .update({
        cost_price: supabase.raw('ROUND((COALESCE(cost_price_amount,0) * ?)::numeric, 2)', [rate]),
        cost_price_rate_applied: rate,
        last_recalculated_at: new Date().toISOString()
      })
      .eq('cost_price_currency', currencyFrom);

    if (costErr) {
      console.error('Error updating cost_price:', costErr);
      return { statusCode: 500, body: JSON.stringify({ error: costErr.message }) };
    }

    // También actualizamos sale_price for products where sale_price_currency = currencyFrom via query builder,
    // because the previous RPC attempt is not reliable across setups.
    const { error: saleUpdateErr } = await supabase
      .from('products')
      .update({
        sale_price: supabase.raw('ROUND((COALESCE(sale_price_amount,0) * ?)::numeric, 2)', [rate]),
        sale_price_rate_applied: rate,
        last_recalculated_at: new Date().toISOString()
      })
      .eq('sale_price_currency', currencyFrom);

    if (saleUpdateErr) {
      console.error('Error updating sale_price (final):', saleUpdateErr);
      return { statusCode: 500, body: JSON.stringify({ error: saleUpdateErr.message }) };
    }

    // Success: devolver summary (cuentas simples)
    const { count: updatedSaleCount } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('sale_price_currency', currencyFrom);

    const { count: updatedCostCount } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('cost_price_currency', currencyFrom);

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        rate,
        updated_sale_products: updatedSaleCount,
        updated_cost_products: updatedCostCount,
        timestamp: new Date().toISOString()
      }),
    };
  } catch (err) {
    console.error('recalcPrices error', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message || String(err) }) };
  }
};

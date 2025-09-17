// netlify/functions/productCrud.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// helper: convierte amount+currency -> legacy CUP usando provided rate (si se pasa), o asume 1
const toLegacy = (amount, currency, rate = 1) => {
  const a = Number(amount) || 0;
  if ((currency || '').toUpperCase() === 'USD') return Number((a * Number(rate || 1)).toFixed(2));
  return Number(a.toFixed(2));
};

exports.handler = async (event) => {
  const { httpMethod, body } = event;
  try {
    // ---------------- DELETE ----------------
    if (httpMethod === 'DELETE') {
      const { productId } = JSON.parse(body || '{}');
      if (!productId) return { statusCode: 400, body: 'Missing productId' };

      // fetch image path
      const { data: product, error: fetchErr } = await supabase
        .from('products')
        .select('imageurl')
        .eq('id', productId)
        .single();

      if (fetchErr) return { statusCode: 500, body: JSON.stringify({ error: fetchErr.message }) };

      const imagePath = product?.imageurl ? product.imageurl.split(`/product-images/`)[1] : null;
      if (imagePath) {
        await supabase.storage.from('product-images').remove([imagePath]).catch(e => console.warn('remove image err', e));
      }

      const { error: deleteProductError } = await supabase.from('products').delete().eq('id', productId);
      if (deleteProductError) throw deleteProductError;

      return { statusCode: 200, body: 'Deleted' };
    }

    // ---------------- PUT (update) ----------------
    if (httpMethod === 'PUT') {
      const payload = JSON.parse(body || '{}');
      const {
        id,
        name,
        sale_price_amount,
        sale_price_currency,
        cost_price_amount,
        cost_price_currency,
        stock,
        description,
        category,
        stock_minimum,
        unit_of_measure,
        fileName,
        fileBase64,
        // optional: pass rate to compute legacy exactly same as admin wanted
        rate_for_conversion
      } = payload;

      try {
        let publicURL = null;
        if (fileBase64 && fileName) {
          const buffer = Buffer.from(fileBase64, 'base64');
          const path = `${id}/${fileName}`;
          const { error: upErr } = await supabase.storage.from('product-images').upload(path, buffer, { upsert: true });
          if (upErr) throw upErr;
          const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
          publicURL = urlData.publicUrl;
        }

        // compute legacy prices (CUP)
        const sale_amount = Number(sale_price_amount) || 0;
        const sale_cur = sale_price_currency || 'CUP';
        const cost_amount = Number(cost_price_amount) || 0;
        const cost_cur = cost_price_currency || 'CUP';
        const legacySale = toLegacy(sale_amount, sale_cur, rate_for_conversion || 1);
        const legacyCost = toLegacy(cost_amount, cost_cur, rate_for_conversion || 1);

        const updateObj = {
          name,
          stock,
          description,
          category,
          stock_minimum,
          unit_of_measure,
          sale_price_amount: sale_amount,
          sale_price_currency: sale_cur,
          cost_price_amount: cost_amount,
          cost_price_currency: cost_cur,
          sale_price: legacySale,
          cost_price: legacyCost,
        };
        if (publicURL) updateObj.imageurl = publicURL;

        const { error: updErr } = await supabase.from('products').update(updateObj).eq('id', id);
        if (updErr) throw updErr;
        return { statusCode: 200, body: 'OK' };
      } catch (err) {
        console.error('productCrud PUT error', err);
        return { statusCode: 500, body: JSON.stringify({ error: err.message || String(err) }) };
      }
    }

    // ---------------- POST (create) ----------------
    if (httpMethod === 'POST') {
      const payload = JSON.parse(body || '{}');
      const {
        name,
        sale_price_amount,
        sale_price_currency,
        cost_price_amount,
        cost_price_currency,
        stock,
        description,
        category,
        stock_minimum,
        unit_of_measure,
        fileName,
        fileBase64,
        rate_for_conversion
      } = payload;

      try {
        const sale_amount = Number(sale_price_amount) || 0;
        const sale_cur = sale_price_currency || 'CUP';
        const cost_amount = Number(cost_price_amount) || 0;
        const cost_cur = cost_price_currency || 'CUP';
        const legacySale = toLegacy(sale_amount, sale_cur, rate_for_conversion || 1);
        const legacyCost = toLegacy(cost_amount, cost_cur, rate_for_conversion || 1);

        const { data: created, error: insErr } = await supabase.from('products').insert({
          name,
          description,
          sale_price_amount: sale_amount,
          sale_price_currency: sale_cur,
          cost_price_amount: cost_amount,
          cost_price_currency: cost_cur,
          sale_price: legacySale,
          cost_price: legacyCost,
          stock: Number(stock) || 0,
          stock_minimum: Number(stock_minimum) || 0,
          category: category || '',
          unit_of_measure: unit_of_measure || 'unid',
          imageurl: ''
        }).select().single();

        if (insErr || !created) {
          console.error('CREATE ERROR', insErr);
          return { statusCode: 500, body: JSON.stringify({ error: insErr?.message || String(insErr) }) };
        }

        // upload image if provided (via fileBase64)
        if (fileBase64 && fileName) {
          const buffer = Buffer.from(fileBase64, 'base64');
          const path = `${created.id}/${fileName}`;
          const { error: upErr } = await supabase.storage.from('product-images').upload(path, buffer, { upsert: true });
          if (!upErr) {
            const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
            await supabase.from('products').update({ imageurl: urlData.publicUrl }).eq('id', created.id);
          }
        }

        return { statusCode: 200, body: JSON.stringify(created) };
      } catch (err) {
        console.error('productCrud POST error', err);
        return { statusCode: 500, body: JSON.stringify({ error: err.message || String(err) }) };
      }
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (err) {
    console.error('productCrud error', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message || String(err) }) };
  }
};

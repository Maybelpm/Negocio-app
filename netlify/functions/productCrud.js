// netlify/functions/productCrud.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function guessContentType(filename = '') {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'svg':
      return 'image/svg+xml';
    default:
      return 'application/octet-stream';
  }
}

exports.handler = async (event) => {
  const { httpMethod, body } = event;

  try {
    // ---------------- DELETE ----------------
    if (httpMethod === 'DELETE') {
      const { productId } = JSON.parse(body || '{}');
      if (!productId) {
        return { statusCode: 400, body: 'Missing productId' };
      }

      // 1. Obtener el producto
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('imageurl')
        .eq('id', productId)
        .single();

      if (fetchError) {
        return { statusCode: 500, body: JSON.stringify({ error: fetchError.message }) };
      }

      // 2. Extraer ruta de imagen (si existe)
      const imagePath = product?.imageurl
        ? product.imageurl.split(`/product-images/`)[1]
        : null;

      // 3. Borrar imagen del bucket si hay ruta
      if (imagePath) {
        try {
          const { error: deleteImageError } = await supabase.storage
            .from('product-images')
            .remove([imagePath]);

          if (deleteImageError) {
            console.warn('Error deleting image:', deleteImageError.message);
            // no cortamos el flujo si falla
          }
        } catch (err) {
          console.warn('Error deleting image (caught):', err);
        }
      }

      // 4. Eliminar el producto de la tabla
      const { error: deleteProductError } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (deleteProductError) throw deleteProductError;

      return { statusCode: 200, body: 'Deleted' };
    }

    // ---------------- PUT ----------------
    if (httpMethod === 'PUT') {
      const payload = JSON.parse(body || '{}');
      const {
        id,
        name,
        stock,
        description,
        category,
        // legacy fields (support)
        sale_price,
        cost_price,
        stock_minimum,
        // new schema fields
        sale_price_amount,
        sale_price_currency,
        cost_price_amount,
        cost_price_currency,
        unit_of_measure,
        // image data (optional)
        fileName,
        fileBase64
      } = payload;

      if (!id) {
        return { statusCode: 400, body: 'Missing product id' };
      }

      try {
        let publicURL = null;

        // Subir imagen si viene en el payload (same logic as uploadImage fn)
        if (fileBase64 && fileName) {
          const buffer = Buffer.from(fileBase64, 'base64');
          const path = `${id}/${fileName}`;

          const contentType = guessContentType(fileName);

          const { error: upErr } = await supabase
            .storage
            .from('product-images')
            .upload(path, buffer, { upsert: true, contentType });

          if (upErr) throw upErr;

          const { data: urlData, error: urlErr } = supabase
            .storage
            .from('product-images')
            .getPublicUrl(path);

          if (urlErr) throw urlErr;
          publicURL = urlData.publicUrl;
        }

        // Construir objeto base
        const baseUpdate = {
          name,
          stock,
          description,
          category,
          stock_minimum,
          unit_of_measure
        };

        // Añadimos nuevos campos si vienen
        if (typeof sale_price_amount !== 'undefined') baseUpdate.sale_price_amount = sale_price_amount;
        if (typeof sale_price_currency !== 'undefined') baseUpdate.sale_price_currency = sale_price_currency;
        if (typeof cost_price_amount !== 'undefined') baseUpdate.cost_price_amount = cost_price_amount;
        if (typeof cost_price_currency !== 'undefined') baseUpdate.cost_price_currency = cost_price_currency;

        // Si hay URL de imagen, actualizamos
        if (publicURL) baseUpdate.imageurl = publicURL;

        // --- Compatibilidad: también actualizamos las columnas legacy sale_price/cost_price
        // Si la nueva moneda es USD, convertimos a CUP usando la tasa actual en exchange_rates.
        // Si no hay tasa, dejamos el campo legacy igual al amount (no ideal pero evita null).
        let legacySale = typeof sale_price !== 'undefined' ? sale_price : undefined;
        let legacyCost = typeof cost_price !== 'undefined' ? cost_price : undefined;

        // Fetch rate USD->CUP si hace falta
        let usdToCupRate = null;
        if ((baseUpdate.sale_price_amount && baseUpdate.sale_price_currency === 'USD') ||
            (baseUpdate.cost_price_amount && baseUpdate.cost_price_currency === 'USD')) {
          const { data: rateRow, error: rateErr } = await supabase
            .from('exchange_rates')
            .select('rate')
            .eq('currency_from', 'USD')
            .eq('currency_to', 'CUP')
            .limit(1)
            .single();

          if (!rateErr && rateRow) usdToCupRate = Number(rateRow.rate);
        }

        if (typeof baseUpdate.sale_price_amount !== 'undefined') {
          if ((baseUpdate.sale_price_currency || '').toUpperCase() === 'USD') {
            legacySale = Number(baseUpdate.sale_price_amount) * (Number(usdToCupRate) || 0);
          } else {
            legacySale = Number(baseUpdate.sale_price_amount) || 0;
          }
        }

        if (typeof baseUpdate.cost_price_amount !== 'undefined') {
          if ((baseUpdate.cost_price_currency || '').toUpperCase() === 'USD') {
            legacyCost = Number(baseUpdate.cost_price_amount) * (Number(usdToCupRate) || 0);
          } else {
            legacyCost = Number(baseUpdate.cost_price_amount) || 0;
          }
        }

        // Si no se proporcionaron nuevos campos pero sí legacy en el payload, mantenemos esos
        if (typeof legacySale !== 'undefined') baseUpdate.sale_price = legacySale;
        if (typeof legacyCost !== 'undefined') baseUpdate.cost_price = legacyCost;

        // Actualizar fila
        const { error: updErr } = await supabase
          .from('products')
          .update(baseUpdate)
          .eq('id', id);

        if (updErr) throw updErr;

        return { statusCode: 200, body: 'OK' };
      } catch (err) {
        console.error('productCrud PUT error', err);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: err.message || String(err) })
        };
      }
    }

    // ---------------- DEFAULT ----------------
    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (err) {
    console.error('productCrud error', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || String(err) })
    };
  }
};

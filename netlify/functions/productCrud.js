// netlify/functions/productCrud.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  const { httpMethod, body } = event;
  const payload = JSON.parse(body || '{}');
  try {
    if (httpMethod === 'DELETE') {
      const { productId } = JSON.parse(body);
      if (!productId) {
        return { statusCode: 400, body: 'Missing productId' };
      }

       // 1. Obtener el producto
       const { data: product, error: fetchError } = await supabase
         .from('products')
         .select('imageurl')      // ← aquí el nombre real
          .eq('id', productId)
          .single();

      // 2. Extraer ruta de imagen (si existe)
       const imagePath = product?.imageurl
         ? product.imageurl.split(`/product-images/`)[1]
         : null;

      // 3. Borrar imagen del bucket si hay ruta
       if (imagePath) {
         const { error: deleteImageError } = await supabase.storage
          .from('product-images') // ← usa el guión medio
          .remove([imagePath]);

          if (deleteImageError) {
            console.warn('Error deleting image:', deleteImageError.message);
            // No cortamos el flujo por esto
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
    
// dentro de productCrud.js, en el branch httpMethod === 'PUT'
if (httpMethod === 'PUT') {
  const payload = JSON.parse(body);
  const { id, name, sale_price, price, stock, description, category, cost_price, stock_minimum, fileName, fileBase64 } = payload;

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

    const baseUpdate = {
      name,
      stock,
      description,
      category,
      cost_price,
      stock_minimum
    };
    if (publicURL) baseUpdate.imageurl = publicURL;

    // preferimos sale_price (schema actual), pero si el cliente envía price lo usamos también
    if (typeof sale_price !== 'undefined' || typeof price !== 'undefined') {
      const priceToUse = typeof sale_price !== 'undefined' ? sale_price : price;
      const updateObj = { ...baseUpdate, sale_price: priceToUse };
      const { error: updErr } = await supabase.from('products').update(updateObj).eq('id', id);
      if (updErr) throw updErr;
      return { statusCode: 200, body: 'OK' };
    }

    // si no hay price en payload, actualizamos solo lo demás
    const { error: finalErr } = await supabase.from('products').update(baseUpdate).eq('id', id);
    if (finalErr) throw finalErr;
    return { statusCode: 200, body: 'OK' };
  } catch (err) {
    console.error('productCrud PUT error', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message || String(err) }) };
  }
}
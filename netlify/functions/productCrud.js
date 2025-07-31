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
      if (httpMethod === 'PUT') {
      const { id, name, price, stock, description, category, fileName, fileBase64 } = payload;
      if (!id) return { statusCode: 400, body: 'Missing product id' };

      // 1) Actualiza la fila
      const { error: updErr } = await supabase
        .from('products')
        .update({ name, price, stock, description, category })
        .eq('id', id);
      if (updErr) throw updErr;

      // 2) Si el cliente envió una imagen nueva, súbela
      if (fileName && fileBase64) {
        const buffer = Buffer.from(fileBase64, 'base64');
        const path = `${id}/${fileName}`;
        const { error: upErr } = await supabase
          .storage
          .from('product-images')
          .upload(path, buffer, { upsert: true, contentType: 'image/png' });
        if (upErr) throw upErr;

        // 3) Actualiza imageurl en la fila
        const { data: urlData, error: urlErr } = supabase
          .storage
          .from('product-images')
          .getPublicUrl(path);
        if (urlErr) throw urlErr;
        await supabase
          .from('products')
          .update({ imageurl: urlData.publicUrl })
          .eq('id', id);
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Updated' }),
      };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (err) {
    console.error('productCrud error', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

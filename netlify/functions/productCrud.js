// netlify/functions/productCrud.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  const { httpMethod, body } = event;
  try {
    if (httpMethod === 'DELETE') {
      const { productId } = JSON.parse(body);
      if (!productId) {
        return { statusCode: 400, body: 'Missing productId' };
      }

      // 1. Obtener el producto
      const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('image_url')
        .eq('id', productId)
        .single();

      if (fetchError) throw fetchError;

      // 2. Extraer ruta de imagen (si existe)
      const imagePath = product?.image_url?.split('/storage/v1/object/public/')[1];

      // 3. Borrar imagen del bucket si hay ruta
      if (imagePath) {
        const { error: deleteImageError } = await supabase.storage
          .from('product_images')
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

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (err) {
    console.error('productCrud error', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
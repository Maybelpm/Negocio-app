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
      // Opcionalmente, aquí puedes validar roles o permisos
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
      if (error) throw error;
      return { statusCode: 200, body: 'Deleted' };
    }
    // Podrías agregar GET, PUT, POST en el mismo archivo
    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (err) {
    console.error('productCrud error', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

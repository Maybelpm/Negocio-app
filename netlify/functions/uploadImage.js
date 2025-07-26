// netlify/functions/uploadImage.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async function(event) {
  try {
    // 1) Parse request
    const { productId, fileName, fileBase64 } = JSON.parse(event.body);
    if (!productId || !fileName || !fileBase64) {
      return { statusCode: 400, body: 'Missing parameters' };
    }
    console.log('→ service_role key present?', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    console.log('→ VITE_SUPABASE_URL =', process.env.VITE_SUPABASE_URL);
    console.log('→ upload path =', `${productId}/${fileName}`);
    // 2) Decode and prepare buffer
    const buffer = Buffer.from(fileBase64, 'base64');
    const path = `${productId}/${fileName}`;

    // 3) Upload to Storage
    const { error: upErr } = await supabase
      .storage
      .from('product-images')
      .upload(path, buffer, { upsert: true, contentType: 'image/png' });
    if (upErr) throw upErr;

    // 4) Get public URL
    const { data: urlData, error: urlErr } = supabase
      .storage
      .from('product-images')
      .getPublicUrl(path);
    if (urlErr) throw urlErr;
    const publicURL = urlData.publicUrl;

    // 5) Update product row
    const { error: updErr } = await supabase
      .from('products')
      .update({ imageurl: publicURL })
      .eq('id', productId);
    if (updErr) throw updErr;

    // 6) Return success
    return {
      statusCode: 200,
      body: JSON.stringify({ publicURL }),
    };
  } catch (err) {
    console.error('uploadImage error', err);
    return {
      statusCode: err.status || 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};

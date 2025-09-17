// netlify/functions/uploadImage.js
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

exports.handler = async function(event) {
  try {
    // 1) Parse request
    const { productId, fileName, fileBase64 } = JSON.parse(event.body);
    if (!productId || !fileName || !fileBase64) {
      return { statusCode: 400, body: 'Missing parameters' };
    }

    // 2) Decode and prepare buffer
    const buffer = Buffer.from(fileBase64, 'base64');
    const path = `${productId}/${fileName}`;
    const contentType = guessContentType(fileName);

    // 3) Upload to Storage
    const { error: upErr } = await supabase
      .storage
      .from('product-images')
      .upload(path, buffer, { upsert: true, contentType });
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

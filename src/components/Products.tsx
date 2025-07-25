import React, { useState, useEffect } from 'react';        // ← AÑADIR useState y useEffect
import { Product } from '../types';
import { supabase } from '@/lib/supabaseClient';           // ← AÑADIR cliente Supabase

interface ProductsViewProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>; // This prop might be used later for optimistic updates
}

const ProductsView: React.FC<ProductsViewProps> = ({ products, setProducts }) => {
    // estados para nuevo producto e imágenes seleccionadas
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    category: '',
    imageFile: null as File | null,
  });
  const [selectedImage, setSelectedImage] = useState<{ [id: string]: File | null }>({});

  // Función para recargar productos desde Supabase
  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });
    if (!error && data) setProducts(data);
  };

  // Crear un producto nuevo (sin imagen)
  const handleCreateProduct = async () => {
    const { data: created, error: insErr } = await supabase
      .from('products')
      .insert({
        name: newProduct.name,
        description: newProduct.description,
        price: newProduct.price,
        stock: newProduct.stock,
        category: newProduct.category,
        imageurl: '',
      })
      .select()
      .single();
    if (insErr || !created) {
      console.error('CREATE PRODUCT ERROR →', insErr);      // ← añade esta línea
      alert('Error creando producto: ' + (insErr?.message || 'Unknown error'));
      return;
    }

    // Si seleccionaron imagen, súbela y actualiza imageurl
    if (newProduct.imageFile) {
      const path = `${created.id}/${newProduct.imageFile.name}`;
      const { error: upErr } = await supabase
        .storage
        .from('product-images')
        .upload(path, newProduct.imageFile, { upsert: true });
      if (upErr) { alert('Error subiendo imagen.'); return; }
      const { publicURL } = supabase
        .storage
        .from('product-images')
        .getPublicUrl(path);
      await supabase
        .from('products')
        .update({ imageurl: publicURL })
        .eq('id', created.id);
    }
    // Refrescar listado y reset form
    await fetchProducts();
    setNewProduct({ name: '', description: '', price: 0, stock: 0, category: '', imageFile: null });
  };

  // Subir imagen para producto existente
const handleUploadImage = async (productId: string) => {
  const file = selectedImage[productId];
  if (!file) return alert('Selecciona una imagen primero.');

  // Sanitiza el nombre del archivo
  const rawName   = file.name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  const safeName  = rawName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');

  // Convierte a Base64
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onloadend = async () => {
    const base64 = (reader.result as string).split(',')[1];

    // Llama a la Netlify Function
    const res = await fetch('/.netlify/functions/uploadImage', {
      method: 'POST',
      body: JSON.stringify({ productId, fileName: safeName, fileBase64: base64 }),
    });
    const json = await res.json();
    if (!res.ok) {
      console.error('Fn upload error', json.error);
      return alert('Error subiendo imagen: ' + json.error);
    }

    // Recarga productos (tu función existente)
    await fetchProducts();
    alert('Imagen subida correctamente.');
  };
};

  // Carga inicial de productos
  useEffect(() => { fetchProducts(); }, []);
  

  return (
    <div>
         {/* → FORMULARIO NUEVO PRODUCTO */}
     <div className="mb-6 p-4 bg-gray-800/50 rounded-lg">
       <h1 className="text-xl font-semibold text-white mb-2">Nuevo Producto</h1>
       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
         <input
           type="text"
           placeholder="Nombre"
           value={newProduct.name}
           onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
           className="p-2 rounded bg-gray-700 text-white"
         />
         {/* ...repite inputs para category, price, stock, description... */}
         <input
           type="file"
           accept="image/*"
           onChange={e => setNewProduct({ ...newProduct, imageFile: e.target.files?.[0] || null })}
           className="col-span-2"
         />
       </div>
       <button
         onClick={handleCreateProduct}
         className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
       >
         Crear Producto
       </button>
     </div>
       <div className="bg-yellow-900/50 border border-yellow-600 text-yellow-200 p-4 mb-6 rounded-lg" role="alert">
        <p className="font-bold">Funcionalidad en Desarrollo</p>
        <p>La edición y creación de productos estará disponible en una futura actualización.</p>
      </div>
      <div className="bg-gray-800/50 backdrop-blur-sm border border-white/10 rounded-lg shadow">
         <ul className="divide-y divide-gray-700">
          
            {products.map(product => (
  <li key={product.id} className="p-4 hover:bg-gray-700/50">
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-4">
        <img
          src={product.imageurl || `https://picsum.photos/seed/${product.id}/50`}
          alt={product.name}
          className="h-12 w-12 rounded-md object-cover"
        />
        <div>
          <p className="text-white font-semibold">{product.name}</p>
          <p className="text-sm text-gray-400">{product.category}</p>
        </div>
      </div>

      <div className="text-right">
        <p className="text-white">${product.price.toFixed(2)}</p>
        <p className={`text-sm font-semibold ${product.stock > 10 ? 'text-green-400' : 'text-red-400'}`}>
          Stock: {product.stock}
        </p>
      </div>
    </div>

    {/* ← AÑADIR selector de imagen y botón de subida */}
    <div className="mt-2 flex items-center">
      <input
        type="file"
        accept="image/*"
        onChange={e =>
          setSelectedImage(prev => ({
            ...prev,
            [product.id]: e.target.files?.[0] || null
          }))
        }
        className="block"
      />
      <button
        onClick={() => handleUploadImage(product.id)}
        className="ml-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Subir imagen
      </button>
    </div>
   {/* ← FIN selector de imagen */}

  </li>
))}

         </ul>
      </div>
    </div>
  );
};

export default ProductsView;
import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { supabase } from '@/lib/supabaseClient';

interface ProductsProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

const Products: React.FC<ProductsProps> = ({ products, setProducts }) => {
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    category: '',
    imageFile: null as File | null,
  });
  const [selectedImage, setSelectedImage] = useState<{ [id: string]: File | null }>({});

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });
    if (!error && data) setProducts(data);
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleCreateProduct = async () => {
    if (!newProduct.name || newProduct.price <= 0 || newProduct.stock < 0) {
      alert('Nombre, precio y stock son obligatorios y deben ser válidos');
      return;
    }
    const { data: created, error: insErr } = await supabase
      .from('products')
      .insert({
        name: newProduct.name,
        description: newProduct.description,
        price: newProduct.price,
        stock: newProduct.stock,
        category: newProduct.category,
        imageurl: ''
      })
      .select()
      .single();
    if (insErr || !created) {
      console.error('CREATE ERROR', insErr);
      alert('Error creando producto');
      return;
    }
    if (newProduct.imageFile) {
      const rawName = newProduct.imageFile.name.normalize('NFKD').replace(/[̀-\u036f]/g, '');
      const safeName = rawName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
      const reader = new FileReader();
      reader.readAsDataURL(newProduct.imageFile);
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const res = await fetch('/.netlify/functions/uploadImage', {
          method: 'POST',
          body: JSON.stringify({ productId: created.id, fileName: safeName, fileBase64: base64 }),
        });
        const json = await res.json();
        if (!res.ok) {
          console.error('Fn upload error', json.error);
          alert('Error subiendo imagen al crear');
        }
        fetchProducts();
      };
    } else {
      fetchProducts();
    }
    setNewProduct({ name: '', description: '', price: 0, stock: 0, category: '', imageFile: null });
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('DELETE ERROR', error);
      alert('Error eliminando producto');
      return;
    }
    fetchProducts();
  };

  const handleUploadImage = async (productId: string) => {
    const file = selectedImage[productId];
    if (!file) return alert('Selecciona una imagen primero.');
    const rawName = file.name.normalize('NFKD').replace(/[̀-\u036f]/g, '');
    const safeName = rawName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const res = await fetch('/.netlify/functions/uploadImage', {
        method: 'POST',
        body: JSON.stringify({ productId, fileName: safeName, fileBase64: base64 }),
      });
      const json = await res.json();
      if (!res.ok) {
        console.error('Fn upload error', json.error);
        return alert('Error subiendo imagen: ' + json.error);
      }
      await fetchProducts();
      alert('Imagen subida correctamente.');
    };
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-800/50 p-6 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-white mb-4">Crear Nuevo Producto</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Nombre"
            value={newProduct.name}
            onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
            className="p-3 rounded-lg bg-gray-700 text-white"
          />
          <input
            type="text"
            placeholder="Categoría"
            value={newProduct.category}
            onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
            className="p-3 rounded-lg bg-gray-700 text-white"
          />
          <input
            type="number"
            placeholder="Precio"
            value={newProduct.price}
            onChange={e => setNewProduct({ ...newProduct, price: +e.target.value })}
            className="p-3 rounded-lg bg-gray-700 text-white"
          />
          <input
            type="number"
            placeholder="Stock"
            value={newProduct.stock}
            onChange={e => setNewProduct({ ...newProduct, stock: +e.target.value })}
            className="p-3 rounded-lg bg-gray-700 text-white"
          />
          <textarea
            placeholder="Descripción"
            value={newProduct.description}
            onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
            className="p-3 rounded-lg bg-gray-700 text-white md:col-span-2"
          />
          <div className="md:col-span-2 flex items-center gap-4">
            <input
              type="file"
              accept="image/*"
              onChange={e => setNewProduct({ ...newProduct, imageFile: e.target.files?.[0] || null })}
              className="block text-sm text-gray-300"
            />
            <button
              onClick={handleCreateProduct}
              className="px-6 py-3 bg-green-600 rounded-2xl text-white font-semibold hover:bg-green-500"
            >Crear Producto</button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <div key={product.id} className="bg-gray-800/50 p-4 rounded-2xl shadow flex flex-col justify-between">
            <div>
              <img
                src={product.imageurl || `https://picsum.photos/seed/${product.id}/200`}
                alt={product.name}
                className="w-full h-40 object-cover rounded-lg mb-4"
              />
              <h3 className="text-xl font-bold text-white">{product.name}</h3>
              <p className="text-gray-400 text-sm mb-2">{product.category}</p>
              <p className="text-white mb-1">Precio: ${product.price.toFixed(2)}</p>
              <p className="text-white">Stock: {product.stock}</p>
            </div>
            <div className="mt-4 flex justify-between">
              <button
                onClick={() => handleDeleteProduct(product.id)}
                className="px-4 py-2 bg-red-500 rounded-lg text-white hover:bg-red-400"
              >Eliminar</button>
              <button
                onClick={() => {/* modal de edición */}}
                className="px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500"
              >Editar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Products;

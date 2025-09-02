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
  cost_price: 0,
  stock: 0,
  stock_minimum: 0,
  category: '',
  imageFile: null as File | null,
  });

  const [selectedImage, setSelectedImage] = useState<{ [id: string]: File | null }>({});
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    setProductsError(null);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        // Supabase returned an error object
        console.error('fetchProducts supabase error:', error);
        setProductsError(error.message || 'Error cargando productos (supabase)');
        return;
      }
      if (!data) {
        setProducts([]);
        return;
      }
      setProducts(data);
    } catch (err: any) {
      console.error('fetchProducts unexpected error:', err);
      setProductsError(err?.message || String(err));
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    // protección: solo intentar si supabase está definido
    if (!supabase) {
      setProductsError('Supabase client no inicializado');
      setLoadingProducts(false);
      return;
    }
    // llama la función de forma segura
    fetchProducts();
  }, []);

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
        cost_price: newProduct.cost_price,
        stock: newProduct.stock,
        stock_minimum: newProduct.stock_minimum,
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
    setNewProduct({ name: '', description: '', price: 0, cost_price: 0, stock: 0, stock_minimum: 0, category: '', imageFile: null });
  };

  const handleDeleteProduct = async (id: string) => {
  if (!confirm('¿Eliminar este producto?')) return;
  const res = await fetch('/.netlify/functions/productCrud', {
    method: 'DELETE',
    body: JSON.stringify({ productId: id }),
  });
  if (!res.ok) {
    const { error } = await res.json();
    return alert('Error al eliminar: ' + error);
  }
  toast.success('Producto eliminado');
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
  // control del modal y producto a editar
  const [isEditing, setIsEditing] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  //fichero de imagen que el usuario elija al editar
  const [editImageFile, setEditImageFile] = useState<File | null>(null);


  // función que guarda los cambios en Supabase
const handleSaveEdit = async () => {
  if (!editProduct) return;

  // Construye el payload
  const payload: any = {
    id: editProduct.id,
    name: editProduct.name,
    price: editProduct.price,
    stock: editProduct.stock,
    cost_price: editProduct.cost_price,
    stock_minimum: editProduct.stock_minimum,
    description: editProduct.description,
    category: editProduct.category,
  };

  // Si hubo un fichero nuevo:
  if (editImageFile) {
    const rawName = editImageFile.name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
    const safeName = rawName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
    const base64 = await new Promise<string>(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(editImageFile);
    });
    payload.fileName = safeName;
    payload.fileBase64 = base64;
  }

  // Llamada al backend
  const res = await fetch('/.netlify/functions/productCrud', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const { error } = await res.json();
    return alert('Error actualizando: ' + error);
  }
  setIsEditing(false);
  setEditProduct(null);
  setEditImageFile(null);
  fetchProducts();
  alert('Producto actualizado correctamente');
};

  // ---------------------- REEMPLAZA AQUI EL RETURN ACTUAL ----------------------
  // Muestra estado de carga o error antes de renderizar la grilla
  if (loadingProducts) {
    return (
      <div className="p-6">
        <p className="text-white">Cargando productos…</p>
      </div>
    );
  }

  if (productsError) {
    return (
      <div className="p-6">
        <div className="bg-red-700 text-white p-4 rounded">
          {productsError}
        </div>
        <button
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded"
          onClick={fetchProducts}
        >
          Reintentar
        </button>
      </div>
    );

    // temporal: debug en consola
    useEffect(() => {
      console.log('Products (from props):', products);
    }, [products]);

  }

  // Si ya cargaron y no hay error, renderizamos la UI normal
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
          <input
            type="number"
            placeholder="Precio de costo"
            value={newProduct.cost_price}
            onChange={e => setNewProduct({ ...newProduct, cost_price: +e.target.value })}
            className="p-3 rounded-lg bg-gray-700 text-white"
          />
          <input
            type="number"
            placeholder="Stock mínimo"
            value={newProduct.stock_minimum}
            onChange={e => setNewProduct({ ...newProduct, stock_minimum: +e.target.value })}
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
              {/* uso seguro de price: comprueba null/undefined antes de toFixed */}
              <p className="text-white mb-1">
                Precio: ${product.price != null ? Number(product.price).toFixed(2) : '—'}
              </p>
              <p className="text-white">Stock: {product.stock ?? 0}</p>
            </div>
            <div className="mt-4 flex justify-between">
              <button
                onClick={() => handleDeleteProduct(product.id)}
                className="px-4 py-2 bg-red-500 rounded-lg text-white hover:bg-red-400"
              >Eliminar</button>
              <button
                onClick={() => {
                  setEditProduct(product);
                  setIsEditing(true);
                }}
                className="px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500"
              >
                Editar
              </button>
            </div>
          </div>
        ))}
      </div>

      {isEditing && editProduct && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          aria-modal="true"
          role="dialog"
          onClick={() => { /* click en el backdrop cierra modal */ setIsEditing(false); setEditProduct(null); }}
        >
          {/* Contenedor interior: evitamos que el click en el panel cierre el modal */}
          <div
            className="w-full max-w-lg bg-gray-800 rounded-2xl shadow-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: '90vh' }}
          >
            {/* Contenido scrollable */}
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 88px)' }}>
              <h2 className="text-2xl font-bold text-white mb-4">Editar {editProduct.name}</h2>

              <div className="mt-4">
                <label className="text-white mb-1 block">Cambiar imagen:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setEditImageFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-300"
                />
                {editImageFile && (
                  <img
                    src={URL.createObjectURL(editImageFile)}
                    alt="Preview"
                    className="mt-2 h-24 w-24 object-cover rounded-lg"
                  />
                )}
              </div>

              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300">Nombre</label>
                  <input
                    type="text"
                    value={editProduct.name}
                    onChange={e => setEditProduct({ ...editProduct, name: e.target.value })}
                    className="w-full p-3 rounded bg-gray-700 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300">Precio de venta</label>
                  <input
                    type="number"
                    value={editProduct.sale_price ?? editProduct.price ?? 0}
                    onChange={e => setEditProduct({ ...editProduct, sale_price: +e.target.value })}
                    className="w-full p-3 rounded bg-gray-700 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300">Precio de costo</label>
                  <input
                    type="number"
                    value={editProduct.cost_price ?? 0}
                    onChange={e => setEditProduct({ ...editProduct, cost_price: +e.target.value })}
                    className="w-full p-3 rounded bg-gray-700 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300">Stock actual</label>
                  <input
                    type="number"
                    value={editProduct.stock ?? 0}
                    onChange={e => setEditProduct({ ...editProduct, stock: +e.target.value })}
                    className="w-full p-3 rounded bg-gray-700 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300">Stock mínimo</label>
                  <input
                    type="number"
                    value={editProduct.stock_minimum ?? 0}
                    onChange={e => setEditProduct({ ...editProduct, stock_minimum: +e.target.value })}
                    className="w-full p-3 rounded bg-gray-700 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300">Descripción</label>
                  <textarea
                    value={editProduct.description || ''}
                    onChange={e => setEditProduct({ ...editProduct, description: e.target.value })}
                    className="w-full p-3 rounded bg-gray-700 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Footer fijo dentro del modal (siempre visible) */}
            <div className="border-t border-gray-700 p-4 bg-gray-800/90 flex justify-end gap-4">
              <button
                onClick={() => { setIsEditing(false); setEditProduct(null); }}
                className="px-4 py-2 bg-gray-600 rounded text-white hover:bg-gray-500"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-green-600 rounded text-white hover:bg-green-500"
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  // ---------------------- FIN DEL NUEVO RETURN ----------------------
  );  
};

export default Products;

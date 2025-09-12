// src/components/Products.tsx
import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { supabase } from '@/lib/supabaseClient';

interface ProductsProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

const Products: React.FC<ProductsProps> = ({ products, setProducts }) => {
  // === HOOKS (siempre al inicio) ===
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    sale_price: 0,
    cost_price: 0,
    stock: 0,
    stock_minimum: 0,
    category: '',
    imageFile: null as File | null,
  });
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);

  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

  // pequeño debug seguro
  useEffect(() => {
    console.log('Products (props):', products?.slice?.(0, 6) ?? products);
  }, [products]);

  // === FUNCIONES ===
  const fetchProducts = async () => {
    setLoadingProducts(true);
    setProductsError(null);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('fetchProducts supabase error:', error);
        setProductsError(error.message || 'Error cargando productos (supabase)');
        return;
      }
      if (!data) {
        setProducts([]);
        return;
      }

      // Normaliza para front: aseguramos sale_price, price, cost_price, imageurl
      const normalized = data.map((p: any) => ({
        ...p,
        sale_price: typeof p.sale_price !== 'undefined' ? p.sale_price : p.price ?? 0,
        price: typeof p.sale_price !== 'undefined' ? p.sale_price : p.price ?? 0,
        cost_price: p.cost_price ?? 0,
        stock_minimum: p.stock_minimum ?? 0,
        imageurl: p.imageurl ?? p.image_url ?? ''
      }));
      setProducts(normalized);
    } catch (err: any) {
      console.error('fetchProducts unexpected error:', err);
      setProductsError(err?.message || String(err));
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (!supabase) {
      setProductsError('Supabase client no inicializado');
      setLoadingProducts(false);
      return;
    }
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Create product (unchanged logic, only preview handling added) ----
  useEffect(() => {
    // newProduct.imageFile -> newImagePreview (create/revoke)
    if (!newProduct.imageFile) {
      // cleanup
      if (newImagePreview) {
        URL.revokeObjectURL(newImagePreview);
        setNewImagePreview(null);
      }
      return;
    }
    const url = URL.createObjectURL(newProduct.imageFile);
    setNewImagePreview(url);
    return () => {
      URL.revokeObjectURL(url);
      setNewImagePreview(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newProduct.imageFile]);

  const handleCreateProduct = async () => {
    // coerción segura de campos numéricos
    const sale_price = Number(newProduct.sale_price) || 0;
    const cost_price = Number(newProduct.cost_price) || 0;
    const stock = Number(newProduct.stock) || 0;
    const stock_minimum = Number(newProduct.stock_minimum) || 0;

    if (!newProduct.name || sale_price <= 0 || stock < 0) {
      return alert('Nombre, precio de venta (>0) y stock (>=0) son obligatorios y deben ser válidos');
    }

    const { data: created, error: insErr } = await supabase
      .from('products')
      .insert({
        name: newProduct.name,
        description: newProduct.description,
        sale_price,
        cost_price,
        stock,
        stock_minimum,
        category: newProduct.category,
        imageurl: ''
      })
      .select()
      .single();

    if (insErr || !created) {
      console.error('CREATE ERROR', insErr);
      return alert('Error creando producto: ' + (insErr?.message || String(insErr)));
    }

    if (newProduct.imageFile) {
      try {
        const rawName = newProduct.imageFile.name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
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
            console.error('Fn upload error', json);
            alert('Error subiendo imagen al crear: ' + (json?.error || 'unknown'));
          }
          await fetchProducts();
        };
      } catch (e) {
        console.error('Error procesando imagen al crear:', e);
      }
    } else {
      await fetchProducts();
    }

    setNewProduct({ name: '', description: '', sale_price: 0, cost_price: 0, stock: 0, stock_minimum: 0, category: '', imageFile: null });
  };

  // ---- Delete product (unchanged) ----
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      const res = await fetch('/.netlify/functions/productCrud', {
        method: 'DELETE',
        body: JSON.stringify({ productId: id }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        return alert('Error al eliminar: ' + error);
      }
      alert('Producto eliminado');
      await fetchProducts();
    } catch (err: any) {
      console.error('delete error', err);
      alert('Error al eliminar producto: ' + (err?.message || String(err)));
    }
  };

  // ---- Save edit (unchanged logic) ----
  const handleSaveEdit = async () => {
    if (!editProduct) return;
    const payload: any = {
      id: editProduct.id,
      name: editProduct.name,
      sale_price: (editProduct as any).sale_price ?? (editProduct as any).price ?? 0,
      stock: editProduct.stock ?? 0,
      cost_price: editProduct.cost_price ?? 0,
      stock_minimum: editProduct.stock_minimum ?? 0,
      description: editProduct.description ?? '',
      category: editProduct.category ?? '',
    };

    if (editImageFile) {
      const rawName = editImageFile.name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
      const safeName = rawName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
      const base64 = await new Promise<string>(resolve => {
        const r = new FileReader();
        r.onloadend = () => resolve((r.result as string).split(',')[1]);
        r.readAsDataURL(editImageFile);
      });
      payload.fileName = safeName;
      payload.fileBase64 = base64;
    }

    try {
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
      await fetchProducts();
      alert('Producto actualizado correctamente');
    } catch (err: any) {
      console.error('save edit error', err);
      alert('Error actualizando producto: ' + (err?.message || String(err)));
    }
  };

  // ---- Preview management for editImageFile (create/revoke objectURL) ----
  useEffect(() => {
    if (!editImageFile) {
      if (editImagePreview) {
        URL.revokeObjectURL(editImagePreview);
        setEditImagePreview(null);
      }
      return;
    }
    const url = URL.createObjectURL(editImageFile);
    setEditImagePreview(url);
    return () => {
      URL.revokeObjectURL(url);
      setEditImagePreview(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editImageFile]);

  // === RENDERS CONDICIONALES (solo dos: error o loading) ===
  if (productsError) {
    return (
      <div className="p-6">
        <div className="bg-red-700 text-white p-4 rounded">{productsError}</div>
        <button className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded" onClick={fetchProducts}>Reintentar</button>
      </div>
    );
  }

  if (loadingProducts) {
    return (
      <div className="p-6">
        <p className="text-white">Cargando productos…</p>
      </div>
    );
  }

  // === UI normal ===
  return (
    <div className="space-y-6">
      {/* Form nuevo producto */}
      <div className="bg-gray-800/50 p-6 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-white mb-4">Crear Nuevo Producto</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-300">Nombre</label>
            <input
              type="text"
              placeholder="Ej: Solomillo de cerdo"
              value={newProduct.name}
              onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
              className="p-3 rounded-lg bg-gray-700 text-white w-full"
              aria-label="Nombre del producto"
              required
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-300">Categoría</label>
            <input
              type="text"
              placeholder="Ej: Carnes"
              value={newProduct.category}
              onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
              className="p-3 rounded-lg bg-gray-700 text-white w-full"
              aria-label="Categoría del producto"
            />
          </div>

          {/* Precio de venta */}
          <div>
            <label className="block text-sm font-medium text-gray-300">Precio de venta</label>
            <div className="mt-1 flex">
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Ej: 1400.00"
                value={newProduct.sale_price}
                onChange={e => setNewProduct({ ...newProduct, sale_price: +e.target.value })}
                className="p-3 rounded-l-lg bg-gray-700 text-white w-full"
                aria-label="Precio de venta en CUP"
                required
              />
              <span className="p-3 rounded-r-lg bg-gray-600 text-white inline-flex items-center">CUP</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Precio al cliente por unidad (libra, paquete, etc.).</p>
          </div>

          {/* Stock actual */}
          <div>
            <label className="block text-sm font-medium text-gray-300">Stock actual</label>
            <div className="mt-1 flex">
              <input
                type="number"
                step="1"
                min="0"
                placeholder="Ej: 12"
                value={newProduct.stock}
                onChange={e => setNewProduct({ ...newProduct, stock: +e.target.value })}
                className="p-3 rounded-l-lg bg-gray-700 text-white w-full"
                aria-label="Stock actual"
                required
              />
              <span className="p-3 rounded-r-lg bg-gray-600 text-white inline-flex items-center">unid</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Cantidad física disponible en inventario.</p>
          </div>

          {/* Precio de costo */}
          <div>
            <label className="block text-sm font-medium text-gray-300">Precio de costo</label>
            <div className="mt-1 flex">
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Ej: 1000.00"
                value={newProduct.cost_price}
                onChange={e => setNewProduct({ ...newProduct, cost_price: +e.target.value })}
                className="p-3 rounded-l-lg bg-gray-700 text-white w-full"
                aria-label="Precio de costo en CUP"
              />
              <span className="p-3 rounded-r-lg bg-gray-600 text-white inline-flex items-center">CUP</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Costo al que compraste el producto.</p>
          </div>

          {/* Stock mínimo */}
          <div>
            <label className="block text-sm font-medium text-gray-300">Stock mínimo</label>
            <div className="mt-1 flex">
              <input
                type="number"
                step="1"
                min="0"
                placeholder="Ej: 3"
                value={newProduct.stock_minimum}
                onChange={e => setNewProduct({ ...newProduct, stock_minimum: +e.target.value })}
                className="p-3 rounded-l-lg bg-gray-700 text-white w-full"
                aria-label="Stock mínimo"
              />
              <span className="p-3 rounded-r-lg bg-gray-600 text-white inline-flex items-center">unid</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Umbral para alertas de reabastecimiento.</p>
          </div>

          <textarea placeholder="Descripción" value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} className="p-3 rounded-lg bg-gray-700 text-white md:col-span-2" aria-label="Descripción del producto" />

          <div className="md:col-span-2 flex items-center gap-4">
            {/* Hidden file input + label as button */}
            <input
              id="newproduct-file"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => setNewProduct({ ...newProduct, imageFile: e.target.files?.[0] || null })}
              aria-label="Seleccionar imagen para nuevo producto"
            />
            <label htmlFor="newproduct-file" className="px-3 py-2 bg-gray-700 text-white rounded cursor-pointer hover:bg-gray-600">Seleccionar imagen</label>

            {/* Preview for new product */}
            {newImagePreview ? (
              <div className="inline-flex items-center gap-2 ml-3">
                <img src={newImagePreview} alt="preview" className="h-12 w-12 object-cover rounded" />
                <span className="max-w-[160px] truncate text-sm text-gray-300">{newProduct.imageFile?.name}</span>
              </div>
            ) : (
              <span className="ml-3 text-sm text-gray-400">No hay imagen seleccionada</span>
            )}

            <button onClick={handleCreateProduct} className="ml-auto px-6 py-3 bg-green-600 rounded-2xl text-white font-semibold hover:bg-green-500">Crear Producto</button>
          </div>
        </div>
      </div>

      {/* Grid productos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <div key={product.id} className="bg-gray-800/50 p-4 rounded-2xl shadow flex flex-col justify-between">
            <div>
              <img src={product.imageurl || `https://picsum.photos/seed/${product.id}/200`} alt={product.name} className="w-full h-40 object-cover rounded-lg mb-4" />
              <h3 className="text-xl font-bold text-white">{product.name}</h3>
              <p className="text-gray-400 text-sm mb-2">{product.category}</p>
              <p className="text-white mb-1">Precio: {(Number(product.sale_price ?? product.price ?? 0)).toFixed(2)} CUP</p>
              <p className="text-white">Stock: {product.stock ?? 0}</p>
            </div>

            <div className="mt-4 flex justify-between items-center">
              <div className="flex gap-3">
                <button onClick={() => handleDeleteProduct(product.id)} className="px-4 py-2 bg-red-500 rounded-lg text-white hover:bg-red-400">Eliminar</button>
                <button onClick={() => { setEditProduct(product); setIsEditing(true); setEditImageFile(null); }} className="px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500">Editar</button>
              </div>

              {/* Clean info instead of file input */}
              <div className="text-right">
                {product.imageurl ? (
                  <span className="text-sm text-gray-300">Imagen cargada</span>
                ) : (
                  <span className="text-sm text-gray-400">Sin imagen</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal edición */}
      {isEditing && editProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog" onClick={() => { setIsEditing(false); setEditProduct(null); setEditImageFile(null); }}>
          <div className="w-full max-w-lg bg-gray-800 rounded-2xl shadow-lg overflow-hidden" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh' }}>
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 88px)' }}>
              <h2 className="text-2xl font-bold text-white mb-4">Editar {editProduct.name}</h2>

              <div className="mt-4">
                <label className="text-white mb-1 block">Cambiar imagen:</label>

                {/* hidden file input + label */}
                <input
                  id="editproduct-file"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => setEditImageFile(e.target.files?.[0] || null)}
                  aria-label="Seleccionar nueva imagen para producto"
                />
                <label htmlFor="editproduct-file" className="inline-flex items-center gap-2 px-3 py-2 bg-gray-700 text-white rounded cursor-pointer hover:bg-gray-600" title="Seleccionar nueva imagen">
                  {/* paperclip icon svg */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21.44 11.05l-8.49 8.49a5 5 0 01-7.07 0 5 5 0 010-7.07l8.49-8.49a3 3 0 014.24 4.24L8.12 16.94" />
                  </svg>
                  Cambiar imagen
                </label>

                {/* preview (safe) */}
                <div className="mt-3">
                  {editImagePreview ? (
                    <div className="flex items-center gap-3">
                      <img src={editImagePreview} alt="Preview" className="h-24 w-24 object-cover rounded-lg" />
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-200 max-w-[240px] truncate">{editImageFile?.name}</span>
                        <span className="text-xs text-gray-400">{editImageFile ? `${(editImageFile.size / 1024).toFixed(1)} KB` : ''}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400">No hay nueva imagen seleccionada. Si quieres reemplazar la actual, selecciona una.</div>
                  )}
                </div>
              </div>

              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300">Nombre</label>
                  <input type="text" value={editProduct.name} onChange={e => setEditProduct({ ...editProduct, name: e.target.value })} className="w-full p-3 rounded bg-gray-700 text-white" aria-label="Editar nombre" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300">Precio de venta</label>
                  <div className="mt-1 flex">
                    <input type="number" value={(editProduct as any).sale_price ?? (editProduct as any).price ?? 0} onChange={e => setEditProduct({ ...editProduct, sale_price: +e.target.value } as any)} className="w-full p-3 rounded-l bg-gray-700 text-white" aria-label="Editar precio de venta" />
                    <span className="p-3 rounded-r bg-gray-600 text-white inline-flex items-center">CUP</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300">Precio de costo</label>
                  <div className="mt-1 flex">
                    <input type="number" value={(editProduct as any).cost_price ?? 0} onChange={e => setEditProduct({ ...editProduct, cost_price: +e.target.value } as any)} className="w-full p-3 rounded-l bg-gray-700 text-white" aria-label="Editar precio de costo" />
                    <span className="p-3 rounded-r bg-gray-600 text-white inline-flex items-center">CUP</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300">Stock actual</label>
                  <div className="mt-1 flex">
                    <input type="number" value={(editProduct as any).stock ?? 0} onChange={e => setEditProduct({ ...editProduct, stock: +e.target.value } as any)} className="w-full p-3 rounded-l bg-gray-700 text-white" aria-label="Editar stock actual" />
                    <span className="p-3 rounded-r bg-gray-600 text-white inline-flex items-center">unid</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300">Stock mínimo</label>
                  <div className="mt-1 flex">
                    <input type="number" value={(editProduct as any).stock_minimum ?? 0} onChange={e => setEditProduct({ ...editProduct, stock_minimum: +e.target.value } as any)} className="w-full p-3 rounded-l bg-gray-700 text-white" aria-label="Editar stock mínimo" />
                    <span className="p-3 rounded-r bg-gray-600 text-white inline-flex items-center">unid</span>
                  </div>
                </div>

                <textarea value={editProduct.description || ''} onChange={e => setEditProduct({ ...editProduct, description: e.target.value } as any)} className="w-full p-3 rounded bg-gray-700 text-white" aria-label="Editar descripción" />
              </div>
            </div>

            <div className="border-t border-gray-700 p-4 bg-gray-800/90 flex justify-end gap-4">
              <button onClick={() => { setIsEditing(false); setEditProduct(null); setEditImageFile(null); }} className="px-4 py-2 bg-gray-600 rounded text-white hover:bg-gray-500">Cancelar</button>
              <button onClick={handleSaveEdit} className="px-4 py-2 bg-green-600 rounded text-white hover:bg-green-500">Guardar cambios</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;


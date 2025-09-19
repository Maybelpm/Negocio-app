// src/components/Products.tsx
import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { supabase } from '@/lib/supabaseClient';

interface ProductsProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  usdToCupRate?: number; // opcional, si App lo pasa lo usamos
}

const Products: React.FC<ProductsProps> = ({ products, setProducts, usdToCupRate = 0 }) => {
  // helper para convertir amount+currency -> legacy price (CUP)
  const toLegacyPrice = (amount: number, currency: string, usdToCupRate = 1) => {
    const a = Number(amount) || 0;
    if ((currency || '').toUpperCase() === 'USD') {
      const rate = Number(usdToCupRate) || 1;
      return Number((a * rate).toFixed(2));
    }
    return Number(a.toFixed(2));
  };

  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    sale_price_amount: 0,
    sale_price_currency: 'CUP',
    cost_price_amount: 0,
    cost_price_currency: 'CUP',
    stock: 0,
    stock_minimum: 0,
    category: '',
    unit_of_measure: 'unid',
    imageFile: null as File | null,
  });
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

  useEffect(() => {
    // preview for create image
    if (!newProduct.imageFile) {
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
        setProducts([]);
        return;
      }
      if (!data) {
        setProducts([]);
        return;
      }

      const normalized = data.map((p: any) => ({
        ...p,
        // fallback compatibility
        sale_price_amount: typeof p.sale_price_amount !== 'undefined' && p.sale_price_amount !== null ? Number(p.sale_price_amount) : (typeof p.sale_price !== 'undefined' ? Number(p.sale_price) : 0),
        sale_price_currency: p.sale_price_currency ?? 'CUP',
        cost_price_amount: typeof p.cost_price_amount !== 'undefined' && p.cost_price_amount !== null ? Number(p.cost_price_amount) : (typeof p.cost_price !== 'undefined' ? Number(p.cost_price) : 0),
        cost_price_currency: p.cost_price_currency ?? 'CUP',
        sale_price: typeof p.sale_price !== 'undefined' ? Number(p.sale_price) : 0,
        cost_price: typeof p.cost_price !== 'undefined' ? Number(p.cost_price) : 0,
        stock_minimum: Number(p.stock_minimum ?? 0),
        imageurl: p.imageurl ?? p.image_url ?? '',
        imageUrl: p.imageurl ?? p.image_url ?? '',
      }));
      setProducts(normalized);
    } catch (err: any) {
      console.error('fetchProducts unexpected error:', err);
      setProductsError(err?.message || String(err));
      setProducts([]);
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

  const priceToCUP = (amount: number, currency: string) => {
    if (!amount) return 0;
    return currency === 'USD' ? amount * (usdToCupRate || 0) : amount;
  };

  const handleCreateProduct = async () => {
    try {
      // coerción segura
      const sale_amount = Number(newProduct.sale_price_amount) || 0;
      const cost_amount = Number(newProduct.cost_price_amount) || 0;
      const stock = Number(newProduct.stock) || 0;
      const stock_minimum = Number(newProduct.stock_minimum) || 0;

      if (!newProduct.name || sale_amount <= 0 || stock < 0) {
        return alert('Nombre, precio de venta (>0) y stock (>=0) son obligatorios y válidos');
      }

      // Preparamos payload base
      const payload: any = {
        name: newProduct.name,
        description: newProduct.description,
        sale_price_amount: sale_amount,
        sale_price_currency: newProduct.sale_price_currency || 'CUP',
        cost_price_amount: cost_amount,
        cost_price_currency: newProduct.cost_price_currency || 'CUP',
        stock,
        stock_minimum,
        category: newProduct.category || '',
        unit_of_measure: newProduct.unit_of_measure || 'unid',
        // opcional: si tu App pasa usdToCupRate, envíalo para que el server calcule legacy correctamente
        rate_for_conversion: typeof usdToCupRate !== 'undefined' && Number(usdToCupRate) > 0 ? Number(usdToCupRate) : undefined
      };

      // Si hay imagen, la convertimos a base64 y añadimos fileName + fileBase64
      if (newProduct.imageFile) {
        const file = newProduct.imageFile;
        const rawName = file.name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
        const safeName = rawName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');

        const base64 = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onerror = () => reject(new Error('Error leyendo archivo'));
          r.onloadend = () => {
            const result = r.result as string;
            // result = "data:<mime>;base64,AAAA..."
            const split = result.split(',');
            resolve(split[1] ?? '');
          };
          r.readAsDataURL(file);
        });

        payload.fileName = safeName;
        payload.fileBase64 = base64;
      }

      // Llamamos a la Netlify Function productCrud (POST crea producto)
      const res = await fetch('/.netlify/functions/productCrud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        console.error('CREATE ERROR', json);
        return alert('Error creando producto: ' + (json?.error || 'unknown'));
      }

      // Si la función devolvió el producto creado en json -> refrescamos productos
      await fetchProducts();

      // limpiar formulario
      setNewProduct({
        name: '',
        description: '',
        sale_price_amount: 0,
        sale_price_currency: 'CUP',
        cost_price_amount: 0,
        cost_price_currency: 'CUP',
        stock: 0,
        stock_minimum: 0,
        category: '',
        unit_of_measure: 'unid',
        imageFile: null,
      });

    } catch (err: any) {
      console.error('handleCreateProduct error', err);
      alert('Error creando producto: ' + (err?.message || String(err)));
    }
  };



  const handleDeleteProduct = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
      const res = await fetch('/.netlify/functions/productCrud', {
        method: 'DELETE',
        body: JSON.stringify({ productId: id }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: 'unknown' }));
        return alert('Error al eliminar: ' + error);
      }
      alert('Producto eliminado');
      await fetchProducts();
    } catch (err: any) {
      console.error('delete error', err);
      alert('Error al eliminar producto: ' + (err?.message || String(err)));
    }
  };

  const handleSaveEdit = async () => {
    if (!editProduct) return;
    const payload: any = {
      id: editProduct.id,
      name: editProduct.name,
      sale_price_amount: (editProduct as any).sale_price_amount ?? (editProduct as any).sale_price ?? 0,
      sale_price_currency: (editProduct as any).sale_price_currency ?? 'CUP',
      cost_price_amount: (editProduct as any).cost_price_amount ?? (editProduct as any).cost_price ?? 0,
      cost_price_currency: (editProduct as any).cost_price_currency ?? 'CUP',
      stock: editProduct.stock ?? 0,
      cost_price: editProduct.cost_price ?? 0,
      stock_minimum: editProduct.stock_minimum ?? 0,
      description: editProduct.description ?? '',
      category: editProduct.category ?? '',
      unit_of_measure: editProduct.unit_of_measure ?? 'unid',
    };

    if (editImageFile) {
      const rawName = editImageFile.name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
      const safeName = rawName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
      const base64 = await new Promise<string>((resolve) => {
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
        const { error } = await res.json().catch(() => ({ error: 'unknown' }));
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

  return (
    <div className="space-y-6">
      {/* Form nuevo producto */}
      <div className="bg-gray-800/50 p-6 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-white mb-4">Crear Nuevo Producto</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300">Nombre</label>
            <input
              type="text"
              placeholder="Ej: Solomillo de cerdo"
              value={newProduct.name}
              onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
              className="p-3 rounded-lg bg-gray-700 text-white w-full placeholder-gray-400"
              aria-label="Nombre del producto"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">Descripción</label>
            <input
              type="text"
              placeholder="Breve descripción"
              value={newProduct.description}
              onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
              className="p-3 rounded-lg bg-gray-700 text-white w-full placeholder-gray-400"
            />
          </div>

          {/* Precio de venta (amount + currency) */}
          <div>
            <label className="block text-sm font-medium text-gray-300">Precio de venta</label>
            <div className="mt-1 flex">
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Ej: 1400.00"
                value={newProduct.sale_price_amount}
                onChange={e => setNewProduct({ ...newProduct, sale_price_amount: +e.target.value })}
                className="p-3 rounded-l-lg bg-gray-700 text-white w-full placeholder-gray-400"
                aria-label="Precio de venta monto"
              />
              <select
                value={newProduct.sale_price_currency}
                onChange={e => setNewProduct({ ...newProduct, sale_price_currency: e.target.value })}
                className="p-3 rounded-r-lg bg-gray-600 text-white inline-flex items-center"
              >
                <option value="CUP">CUP</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <p className="text-xs text-gray-400 mt-1">Precio al cliente por unidad.</p>
          </div>

          {/* Stock */}
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
                className="p-3 rounded-l-lg bg-gray-700 text-white w-full placeholder-gray-400"
                aria-label="Stock actual"
                required
              />
              <select
                value={newProduct.unit_of_measure}
                onChange={e => setNewProduct({ ...newProduct, unit_of_measure: e.target.value })}
                className="p-3 rounded-r-lg bg-gray-600 text-white inline-flex items-center"
              >
                <option value="unid">unid</option>
                <option value="lb">lb</option>
                <option value="kg">kg</option>
                <option value="l">l</option>
              </select>
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
                value={newProduct.cost_price_amount}
                onChange={e => setNewProduct({ ...newProduct, cost_price_amount: +e.target.value })}
                className="p-3 rounded-l-lg bg-gray-700 text-white w-full placeholder-gray-400"
                aria-label="Precio de costo monto"
              />
              <select
                value={newProduct.cost_price_currency}
                onChange={e => setNewProduct({ ...newProduct, cost_price_currency: e.target.value })}
                className="p-3 rounded-r-lg bg-gray-600 text-white inline-flex items-center"
              >
                <option value="CUP">CUP</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <p className="text-xs text-gray-400 mt-1">Costo al que compraste el producto.</p>
          </div>

          {/* Stock mínimo */}
          <div>
            <label className="block text-sm font-medium text-gray-300">Stock mínimo</label>
            <input
              type="number"
              step="1"
              min="0"
              placeholder="Ej: 3"
              value={newProduct.stock_minimum}
              onChange={e => setNewProduct({ ...newProduct, stock_minimum: +e.target.value })}
              className="p-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 w-full"
            />
            <p className="text-xs text-gray-400 mt-1">Umbral para alertas de reabastecimiento.</p>
          </div>

          <textarea placeholder="Descripción larga" value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} className="p-3 rounded-lg bg-gray-700 text-white md:col-span-2 placeholder-gray-400" />

          <div className="md:col-span-2 flex items-center gap-4">
            <input
              id="newproduct-file"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => setNewProduct({ ...newProduct, imageFile: e.target.files?.[0] || null })}
            />
            <label htmlFor="newproduct-file" className="px-3 py-2 bg-gray-700 text-white rounded cursor-pointer hover:bg-gray-600">Seleccionar imagen</label>

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
        {products.map(product => {
          const salePriceCUP = priceToCUP(Number(product.sale_price_amount ?? product.sale_price ?? 0), (product.sale_price_currency ?? 'CUP'));
          return (
            <div key={product.id} className="bg-gray-800/50 p-4 rounded-2xl shadow flex flex-col justify-between">
              <div>
                <img src={(product.imageurl || `https://picsum.photos/seed/${product.id}/200`)} alt={product.name} className="w-full h-40 object-cover rounded-lg mb-4" />
                <h3 className="text-xl font-bold text-white">{product.name}</h3>
                <p className="text-gray-400 text-sm mb-2">{product.category}</p>
                <p className="text-white mb-1">Precio: {Number(salePriceCUP).toFixed(2)} CUP</p>
                <p className="text-white">Stock: {product.stock ?? 0} ({product.unit_of_measure ?? 'unid'})</p>
              </div>

              <div className="mt-4 flex justify-between items-center">
                <div className="flex gap-3">
                  <button onClick={() => handleDeleteProduct(product.id)} className="px-4 py-2 bg-red-500 rounded-lg text-white hover:bg-red-400">Eliminar</button>
                  <button onClick={() => { setEditProduct(product); setIsEditing(true); setEditImageFile(null); }} className="px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500">Editar</button>
                </div>

                <div className="text-right">
                  {product.imageurl ? (
                    <span className="text-sm text-gray-300">Imagen cargada</span>
                  ) : (
                    <span className="text-sm text-gray-400">Sin imagen</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal edición */}
      {isEditing && editProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog" onClick={() => { setIsEditing(false); setEditProduct(null); setEditImageFile(null); }}>
          <div className="w-full max-w-lg bg-gray-800 rounded-2xl shadow-lg overflow-hidden" onClick={(e) => e.stopPropagation()} style={{ maxHeight: '90vh' }}>
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 88px)' }}>
              <h2 className="text-2xl font-bold text-white mb-4">Editar {editProduct.name}</h2>

              <div className="mt-4">
                <label className="text-white mb-1 block">Cambiar imagen:</label>

                <input
                  id="editproduct-file"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => setEditImageFile(e.target.files?.[0] || null)}
                />
                <label htmlFor="editproduct-file" className="inline-flex items-center gap-2 px-3 py-2 bg-gray-700 text-white rounded cursor-pointer hover:bg-gray-600" title="Seleccionar nueva imagen">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21.44 11.05l-8.49 8.49a5 5 0 01-7.07 0 5 5 0 010-7.07l8.49-8.49a3 3 0 014.24 4.24L8.12 16.94" />
                  </svg>
                  Cambiar imagen
                </label>

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
                    <input type="number" value={(editProduct as any).sale_price_amount ?? (editProduct as any).sale_price ?? 0} onChange={e => setEditProduct({ ...editProduct, sale_price_amount: +e.target.value } as any)} className="w-full p-3 rounded-l bg-gray-700 text-white" aria-label="Editar precio de venta" />
                    <select value={(editProduct as any).sale_price_currency ?? 'CUP'} onChange={e => setEditProduct({ ...editProduct, sale_price_currency: e.target.value } as any)} className="p-3 rounded-r bg-gray-600 text-white">
                      <option value="CUP">CUP</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300">Precio de costo</label>
                  <div className="mt-1 flex">
                    <input type="number" value={(editProduct as any).cost_price_amount ?? 0} onChange={e => setEditProduct({ ...editProduct, cost_price_amount: +e.target.value } as any)} className="w-full p-3 rounded-l bg-gray-700 text-white" aria-label="Editar precio de costo" />
                    <select value={(editProduct as any).cost_price_currency ?? 'CUP'} onChange={e => setEditProduct({ ...editProduct, cost_price_currency: e.target.value } as any)} className="p-3 rounded-r bg-gray-600 text-white">
                      <option value="CUP">CUP</option>
                      <option value="USD">USD</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300">Stock actual</label>
                  <div className="mt-1 flex">
                    <input type="number" value={(editProduct as any).stock ?? 0} onChange={e => setEditProduct({ ...editProduct, stock: +e.target.value } as any)} className="w-full p-3 rounded-l bg-gray-700 text-white" aria-label="Editar stock actual" />
                    <input type="text" value={(editProduct as any).unit_of_measure ?? 'unid'} onChange={e => setEditProduct({ ...editProduct, unit_of_measure: e.target.value } as any)} className="p-3 rounded-r bg-gray-600 text-white" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300">Stock mínimo</label>
                  <div className="mt-1 flex">
                    <input type="number" value={(editProduct as any).stock_minimum ?? 0} onChange={e => setEditProduct({ ...editProduct, stock_minimum: +e.target.value } as any)} className="w-full p-3 rounded-l bg-gray-700 text-white" aria-label="Editar stock mínimo" />
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


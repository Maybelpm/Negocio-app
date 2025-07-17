import React, { useState, useCallback, useEffect } from 'react';
import { Product, ProductCategory, InventoryItem, Location, LocationType } from '../types';
import Button from './ui/Button';
import Icon from './ui/Icon';
import Modal from './ui/Modal';
import Input from './ui/Input';
import { generateDescription } from '../services/geminiService';
import { supabase } from '../services/supabaseClient';

// --- Formulario para el Catálogo de Productos ---
const ProductForm: React.FC<{
  onSave: (product: Omit<Product, 'id'> | Product) => Promise<void>;
  onClose: () => void;
  product?: Product | null;
}> = ({ onSave, onClose, product }) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || 0,
    category: product?.category || ProductCategory.FOOD,
    image_url: product?.imageUrl || `https://picsum.photos/seed/${Date.now()}/400/400`,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'price' ? parseFloat(value) : value }));
  };
  
  const handleGenerateDescription = async () => {
    if(!formData.name) {
        alert("Por favor, ingrese un nombre de producto primero.");
        return;
    }
    setIsGenerating(true);
    try {
        const desc = await generateDescription(formData.name, formData.category);
        setFormData(prev => ({...prev, description: desc}));
    } finally {
        setIsGenerating(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
        if (product) {
            await onSave({ ...formData, id: product.id, imageUrl: formData.image_url });
        } else {
            await onSave({ ...formData, imageUrl: formData.image_url });
        }
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Nombre del Producto" name="name" value={formData.name} onChange={handleChange} required />
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Descripción</label>
        <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"></textarea>
         <Button type="button" variant="secondary" onClick={handleGenerateDescription} className="mt-2" disabled={isGenerating}>
            <Icon name="sparkles" className="h-4 w-4" />
            {isGenerating ? 'Generando...' : 'Generar con IA'}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Precio" name="price" type="number" step="0.01" value={formData.price} onChange={handleChange} required />
         <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">Categoría</label>
          <select id="category" name="category" value={formData.category} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
             {Object.values(ProductCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
      </div>
      </div>
      <Input label="URL de Imagen" name="image_url" value={formData.image_url} onChange={handleChange} />
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onClose} disabled={isSaving}>Cancelar</Button>
        <Button type="submit" variant="primary" disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar Producto'}
        </Button>
      </div>
    </form>
  );
};


// --- Formulario para Transferir Inventario ---
const TransferForm: React.FC<{
    onSave: (productId: string, from: string, to: string, qty: number) => void;
    onClose: () => void;
    catalog: Product[];
    locations: Location[];
}> = ({ onSave, onClose, catalog, locations }) => {
    const [productId, setProductId] = useState(catalog[0]?.id || '');
    const [fromLocationId, setFromLocationId] = useState(locations.find(l => l.type === LocationType.WAREHOUSE)?.id || '');
    const [toLocationId, setToLocationId] = useState(locations.find(l => l.type === LocationType.STORE)?.id || '');
    const [quantity, setQuantity] = useState(1);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!productId || !fromLocationId || !toLocationId || quantity <= 0) {
            alert("Por favor complete todos los campos.");
            return;
        }
        if(fromLocationId === toLocationId) {
            alert("La ubicación de origen y destino no pueden ser la misma.");
            return;
        }
        onSave(productId, fromLocationId, toLocationId, quantity);
        onClose();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Producto</label>
                <select value={productId} onChange={e => setProductId(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white">
                    {catalog.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Desde</label>
                    <select value={fromLocationId} onChange={e => setFromLocationId(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white">
                        {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Hacia</label>
                    <select value={toLocationId} onChange={e => setToLocationId(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white">
                        {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                    </select>
                </div>
            </div>
            <Input label="Cantidad" type="number" min="1" value={quantity} onChange={e => setQuantity(parseInt(e.target.value, 10))} required />

             <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
                <Button type="submit" variant="primary">Confirmar Transferencia</Button>
            </div>
        </form>
    );
};


// --- Vista principal ---
type ProductsViewTab = 'CATALOG' | 'INVENTORY';

const ProductsView: React.FC<{
  catalog: Product[];
  inventory: InventoryItem[];
  locations: Location[];
  onTransfer: (productId: string, from: string, to: string, qty: number) => void;
}> = ({ catalog, inventory, locations, onTransfer }) => {
  const [activeTab, setActiveTab] = useState<ProductsViewTab>('INVENTORY');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleOpenProductModal = (product: Product | null = null) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const handleCloseProductModal = () => {
    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  const handleSaveProduct = async (productData: Omit<Product, 'id'> | Product) => {
    const { id, ...dataToSave } = productData as Product;
    
    if ('id' in productData) {
      const { error } = await supabase.from('products').update(dataToSave).eq('id', id);
      if(error) alert("Error al actualizar el producto: " + error.message);
    } else {
      const { error } = await supabase.from('products').insert(dataToSave);
      if(error) alert("Error al crear el producto: " + error.message);
    }
    
    // UI will update via realtime, so we just close the modal
    handleCloseProductModal();
  };
  
  const handleDeleteProduct = async (productId: string) => {
      if(window.confirm("¿Estás seguro de que quieres eliminar este producto del catálogo? Esto también eliminará todo su inventario y lo quitará de los reportes de ventas (si la base de datos está configurada con cascada).")) {
        const { error } = await supabase.from('products').delete().eq('id', productId);
        if(error) alert("Error al eliminar el producto: " + error.message);
      }
  };
  
  const getStock = (productId: string, locationId: string) => {
      // Find the specific inventory item, which might have a different ID
      const item = inventory.find(i => i.productId === productId && i.locationId === locationId);
      return item?.stock || 0;
  }

  return (
    <div className="animate-fade-in space-y-6">
        <div className="border-b border-gray-700">
            <nav className="-mb-px flex space-x-6">
                <button onClick={() => setActiveTab('INVENTORY')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'INVENTORY' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>
                    Gestión de Inventario
                </button>
                 <button onClick={() => setActiveTab('CATALOG')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'CATALOG' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>
                    Catálogo de Productos
                </button>
            </nav>
        </div>

      {activeTab === 'CATALOG' && (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Catálogo Central de Productos</h2>
                <Button onClick={() => handleOpenProductModal()}>
                <Icon name="plus" className="h-5 w-5" />
                Agregar Producto al Catálogo
                </Button>
            </div>
             <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                    <tr>
                        <th scope="col" className="px-6 py-3">Producto</th>
                        <th scope="col" className="px-6 py-3">Categoría</th>
                        <th scope="col" className="px-6 py-3">Precio</th>
                        <th scope="col" className="px-6 py-3 text-right">Acciones</th>
                    </tr>
                    </thead>
                    <tbody>
                    {catalog.map((product) => (
                        <tr key={product.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
                        <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap flex items-center gap-4">
                            <img src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                            {product.name}
                        </th>
                        <td className="px-6 py-4">{product.category}</td>
                        <td className="px-6 py-4">${product.price.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => handleOpenProductModal(product)}><Icon name="pencil" className="h-4 w-4" /></Button>
                            <Button variant="ghost" onClick={() => handleDeleteProduct(product.id)}><Icon name="trash" className="h-4 w-4 text-red-500" /></Button>
                            </div>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
             </div>
        </div>
      )}

       {activeTab === 'INVENTORY' && (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Inventario por Ubicación</h2>
                <Button onClick={() => setIsTransferModalOpen(true)}>
                <Icon name="plus" className="h-5 w-5" />
                Transferir Stock
                </Button>
            </div>
             <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                     <table className="w-full text-sm text-left text-gray-300">
                        <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3 sticky left-0 bg-gray-700 z-10">Producto</th>
                                {locations.map(loc => (
                                    <th key={loc.id} scope="col" className="px-6 py-3 text-center">{loc.name}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {catalog.map((product) => (
                                <tr key={product.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
                                    <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap flex items-center gap-4 sticky left-0 bg-gray-800 z-10">
                                         <img src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                                        {product.name}
                                    </th>
                                    {locations.map(loc => (
                                        <td key={loc.id} className="px-6 py-4 text-center">
                                             <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStock(product.id, loc.id) > 10 ? 'bg-green-900 text-green-300' : getStock(product.id, loc.id) > 0 ? 'bg-yellow-900 text-yellow-300' : 'bg-red-900 text-red-300'}`}>
                                                {getStock(product.id, loc.id)}
                                            </span>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             </div>
        </div>
       )}

      <Modal 
        isOpen={isProductModalOpen} 
        onClose={handleCloseProductModal} 
        title={editingProduct ? "Editar Producto del Catálogo" : "Agregar Producto al Catálogo"}
      >
        <ProductForm onSave={handleSaveProduct} onClose={handleCloseProductModal} product={editingProduct} />
      </Modal>
      
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Realizar Transferencia de Stock"
      >
          <TransferForm onSave={onTransfer} onClose={() => setIsTransferModalOpen(false)} catalog={catalog} locations={locations} />
      </Modal>

    </div>
  );
};

export default ProductsView;
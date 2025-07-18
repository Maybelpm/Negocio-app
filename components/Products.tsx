
import React, { useState, useCallback, useEffect } from 'react';
import { Product, ProductCategory } from '../types';
import Button from './ui/Button';
import Icon from './ui/Icon';
import Modal from './ui/Modal';
import Input from './ui/Input';
import { generateDescription } from '../services/geminiService';

interface ProductsViewProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

const ProductForm: React.FC<{
  onSave: (product: Omit<Product, 'id'> | Product) => void;
  onClose: () => void;
  product?: Product | null;
}> = ({ onSave, onClose, product }) => {
  const [formData, setFormData] = useState<Omit<Product, 'id'>>({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || 0,
    stock: product?.stock || 0,
    category: product?.category || ProductCategory.FOOD,
    imageUrl: product?.imageUrl || 'https://picsum.photos/seed/new/400/400',
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'price' || name === 'stock' ? parseFloat(value) : value }));
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (product) {
      onSave({ ...formData, id: product.id });
    } else {
      onSave(formData);
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
        <Input label="Stock" name="stock" type="number" value={formData.stock} onChange={handleChange} required />
      </div>
      <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-1">Categoría</label>
          <select id="category" name="category" value={formData.category} onChange={handleChange} className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
             {Object.values(ProductCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
      </div>
      <Input label="URL de Imagen" name="imageUrl" value={formData.imageUrl} onChange={handleChange} />
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button type="submit" variant="primary">Guardar Producto</Button>
      </div>
    </form>
  );
};


const ProductsView: React.FC<ProductsViewProps> = ({ products, setProducts }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleOpenModal = (product: Product | null = null) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSaveProduct = (productData: Omit<Product, 'id'> | Product) => {
    if ('id' in productData) { // Editing
      setProducts(prev => prev.map(p => p.id === productData.id ? productData : p));
    } else { // Adding
      const newProduct: Product = {
        ...productData,
        id: `prod_${Date.now()}`,
      };
      setProducts(prev => [newProduct, ...prev]);
    }
    handleCloseModal();
  };
  
  const handleDeleteProduct = (productId: string) => {
      if(window.confirm("¿Estás seguro de que quieres eliminar este producto?")) {
        setProducts(prev => prev.filter(p => p.id !== productId));
      }
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Gestión de Productos</h1>
        <Button onClick={() => handleOpenModal()}>
          <Icon name="plus" className="h-5 w-5" />
          Agregar Producto
        </Button>
      </div>

      <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                <tr>
                    <th scope="col" className="px-6 py-3">Producto</th>
                    <th scope="col" className="px-6 py-3">Categoría</th>
                    <th scope="col" className="px-6 py-3">Precio</th>
                    <th scope="col" className="px-6 py-3">Stock</th>
                    <th scope="col" className="px-6 py-3 text-right">Acciones</th>
                </tr>
            </thead>
            <tbody>
                {products.map((product) => (
                <tr key={product.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50">
                    <th scope="row" className="px-6 py-4 font-medium text-white whitespace-nowrap flex items-center gap-4">
                        <img src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                        {product.name}
                    </th>
                    <td className="px-6 py-4">{product.category}</td>
                    <td className="px-6 py-4">${product.price.toFixed(2)}</td>
                    <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.stock > 10 ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                            {product.stock}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" onClick={() => handleOpenModal(product)}><Icon name="pencil" className="h-4 w-4" /></Button>
                            <Button variant="ghost" onClick={() => handleDeleteProduct(product.id)}><Icon name="trash" className="h-4 w-4 text-red-500" /></Button>
                        </div>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>
      
      <Modal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        title={editingProduct ? "Editar Producto" : "Agregar Nuevo Producto"}
      >
        <ProductForm onSave={handleSaveProduct} onClose={handleCloseModal} product={editingProduct} />
      </Modal>

    </div>
  );
};

export default ProductsView;

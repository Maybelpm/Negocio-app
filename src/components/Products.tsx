// src/components/Products.tsx
import React, { useState, useEffect } from "react";
import { Product } from "../types";

interface Props {
  products: Product[];
  onCreate: (product: Partial<Product>) => Promise<void>;
  usdToCupRate: number;
}

const Products: React.FC<Props> = ({ products, onCreate, usdToCupRate }) => {
  const [form, setForm] = useState({
    name: "",
    description: "",
    sale_price_amount: 0,
    sale_price_currency: "CUP",
    cost_price_amount: 0,
    cost_price_currency: "CUP",
    stock: 0,
    stock_minimum: 0,
    category: "",
    unit_of_measure: "unid",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreate(form);
    setForm({
      name: "",
      description: "",
      sale_price_amount: 0,
      sale_price_currency: "CUP",
      cost_price_amount: 0,
      cost_price_currency: "CUP",
      stock: 0,
      stock_minimum: 0,
      category: "",
      unit_of_measure: "unid",
    });
  };

  const priceToCUP = (amount: number, currency: string) => {
    if (!amount) return 0;
    return currency === "USD" ? amount * usdToCupRate : amount;
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Crear Producto</h2>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
      >
        <input
          type="text"
          name="name"
          placeholder="Nombre"
          value={form.name}
          onChange={handleChange}
          className="border p-2 rounded"
          required
        />
        <input
          type="text"
          name="description"
          placeholder="Descripción"
          value={form.description}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        {/* Precio de venta */}
        <div className="flex gap-2">
          <input
            type="number"
            name="sale_price_amount"
            placeholder="Precio de venta"
            value={form.sale_price_amount}
            onChange={handleChange}
            className="border p-2 rounded flex-1"
          />
          <select
            name="sale_price_currency"
            value={form.sale_price_currency}
            onChange={handleChange}
            className="border p-2 rounded"
          >
            <option value="CUP">CUP</option>
            <option value="USD">USD</option>
          </select>
        </div>

        {/* Precio de compra */}
        <div className="flex gap-2">
          <input
            type="number"
            name="cost_price_amount"
            placeholder="Precio de compra"
            value={form.cost_price_amount}
            onChange={handleChange}
            className="border p-2 rounded flex-1"
          />
          <select
            name="cost_price_currency"
            value={form.cost_price_currency}
            onChange={handleChange}
            className="border p-2 rounded"
          >
            <option value="CUP">CUP</option>
            <option value="USD">USD</option>
          </select>
        </div>

        <input
          type="number"
          name="stock"
          placeholder="Stock actual"
          value={form.stock}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="number"
          name="stock_minimum"
          placeholder="Stock mínimo"
          value={form.stock_minimum}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          type="text"
          name="category"
          placeholder="Categoría"
          value={form.category}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <select
          name="unit_of_measure"
          value={form.unit_of_measure}
          onChange={handleChange}
          className="border p-2 rounded"
        >
          <option value="unid">Unidad</option>
          <option value="lb">Libra</option>
          <option value="l">Litro</option>
          <option value="kg">Kilogramo</option>
          <option value="pz">Pieza</option>
        </select>

        <button
          type="submit"
          className="col-span-1 md:col-span-2 bg-blue-500 text-white py-2 rounded"
        >
          Crear
        </button>
      </form>

      <h2 className="text-xl font-semibold mb-4">Productos</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {products.map((p) => {
          const salePriceCUP = p.sale_price_amount
            ? priceToCUP(p.sale_price_amount, p.sale_price_currency || "CUP")
            : p.sale_price || 0;

          return (
            <div
              key={p.id}
              className="border rounded p-4 flex flex-col justify-between"
            >
              <div>
                <h3 className="font-bold">{p.name}</h3>
                <p>{p.description}</p>
                <p>
                  <strong>Precio:</strong> {salePriceCUP.toFixed(2)} CUP
                  {p.sale_price_currency === "USD" && (
                    <span className="text-sm text-gray-500 ml-2">
                      ({p.sale_price_amount} USD)
                    </span>
                  )}
                </p>
                <p>
                  <strong>Stock:</strong> {p.stock} ({p.unit_of_measure})
                </p>
                <p>
                  <strong>Categoría:</strong> {p.category}
                </p>
              </div>
              {p.imageurl && (
                <img
                  src={p.imageurl}
                  alt={p.name}
                  className="mt-2 max-h-40 object-contain"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Products;

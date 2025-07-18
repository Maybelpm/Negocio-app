# OmniPOS - Sistema de Venta Inteligente

Este proyecto es un sistema de punto de venta (POS) inteligente construido con React, TypeScript, Vite y Tailwind CSS, integrado con Supabase para la gestión de datos en tiempo real.

## Requisitos Previos

- Node.js (v18 o superior)
- Una cuenta de Supabase

## Configuración Local

1.  **Clona el repositorio:**
    ```bash
    git clone https://github.com/tu-usuario/tu-repositorio.git
    cd tu-repositorio
    ```

2.  **Instala las dependencias:**
    ```bash
    npm install
    ```

3.  **Configura las variables de entorno:**
    Crea un archivo llamado `.env.local` en la raíz de tu proyecto. Este archivo es para desarrollo local y no se subirá a Git.

    ```
    VITE_SUPABASE_URL="URL_DE_TU_PROYECTO_SUPABASE"
    VITE_SUPABASE_ANON_KEY="TU_SUPABASE_ANON_KEY"
    ```
    - `VITE_SUPABASE_URL`: Lo encuentras en tu proyecto de Supabase en `Settings > API > Project URL`.
    - `VITE_SUPABASE_ANON_KEY`: Lo encuentras en tu proyecto de Supabase en `Settings > API > Project API Keys > anon (public)`.

4.  **Configura la Base de Datos de Supabase:**
    Ve a la sección **SQL Editor** en tu panel de Supabase y ejecuta el siguiente script para crear las tablas y funciones necesarias.

    ```sql
    -- 1. Habilitar la extensión para UUIDs (ejecutar una sola vez)
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- 2. Tabla para los productos
    CREATE TABLE products (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      description TEXT,
      price NUMERIC NOT NULL,
      stock INTEGER NOT NULL,
      category TEXT NOT NULL,
      imageUrl TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
    );

    -- 3. Tabla para las ventas
    CREATE TABLE sales (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      items JSONB NOT NULL,
      total NUMERIC NOT NULL
    );

    -- 4. Función para decrementar el stock de forma segura (atomicidad)
    CREATE OR REPLACE FUNCTION decrement_product_stock(product_id_in uuid, quantity_sold int)
    RETURNS void AS $$
    BEGIN
      UPDATE products
      SET stock = stock - quantity_sold
      WHERE id = product_id_in AND stock >= quantity_sold;
    END;
    $$ LANGUAGE plpgsql;

    -- 5. Habilitar Row Level Security (RLS) en las tablas
    ALTER TABLE products ENABLE ROW LEVEL SECURITY;
    ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

    -- 6. Crear políticas para permitir el acceso público (anon)
    -- Permitir lectura pública de productos
    CREATE POLICY "Public products are viewable by everyone."
      ON products FOR SELECT
      USING (true);

    -- Permitir lectura pública de ventas
    CREATE POLICY "Public sales are viewable by everyone."
      ON sales FOR SELECT
      USING (true);

    -- Permitir a los usuarios anónimos crear ventas
    CREATE POLICY "Anyone can create a sale."
      ON sales FOR INSERT
      WITH CHECK (true);

    -- Nota: Las actualizaciones de stock se manejan a través de la función RPC segura ('decrement_product_stock'),
    -- que se ejecuta con privilegios de administrador, por lo que no necesitamos una política de UPDATE
    -- para los usuarios anónimos en la tabla de productos.
    ```
5. **Habilita Realtime en Supabase:**
    - Ve a **Database > Replication** en tu panel de Supabase.
    - Asegúrate de que las tablas `products` y `sales` estén habilitadas para replicación (real-time). Si no están, habilítalas.

6. **Poblar la tabla de productos:**
   - Ve a la sección **Table Editor**, selecciona la tabla `products` y añade algunos productos de ejemplo.

7.  **Ejecuta la aplicación:**
    ```bash
    npm run dev
    ```
    La aplicación estará disponible en `http://localhost:5173`.

## Despliegue en Netlify

1.  Conecta tu repositorio de GitHub a Netlify.
2.  Configura los comandos de construcción:
    -   **Build command:** `npm run build`
    -   **Publish directory:** `dist`
3.  Configura las variables de entorno en Netlify (no uses el archivo `.env.local` aquí):
    -   Ve a **Site settings > Build & deploy > Environment**.
    -   Añade las mismas variables que en tu `.env.local`: `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
4.  Despliega tu sitio.
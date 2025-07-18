import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      plugins: [react()],
      define: {
        // Prevent crash on build if VITE_API_KEY is not set.
        // The app will load, and API calls will fail, which is better than a blank screen.
        'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || 'MISSING_API_KEY'),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './'),
        }
      }
    };
});
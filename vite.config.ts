import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import devServer from '@hono/vite-dev-server';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    devServer({
      entry: 'api/index.ts',
      exclude: [/^\/(?!api).*/],
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
});

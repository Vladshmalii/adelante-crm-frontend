import { fileURLToPath, URL } from 'node:url';

import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => {
  const { API_PROXY_TARGET } = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      // Должен идти до плагина React: генерирует src/routeTree.gen.ts из src/routes.
      tanstackRouter({ target: 'react', autoCodeSplitting: true }),
      react(),
    ],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      port: 5173,
      // Локально ходим в бекенд через прокси dev-сервера: запросы same-origin, CORS не нужен.
      // В .env.local: API_PROXY_TARGET=http://localhost:8000 и VITE_API_URL=http://localhost:5173
      proxy: API_PROXY_TARGET
        ? { '/api': { target: API_PROXY_TARGET, changeOrigin: true } }
        : undefined,
    },
    // antd + pro-components весят ~1 МБ; для админки за логином это нормально.
    build: { chunkSizeWarningLimit: 1200 },
    test: {
      environment: 'jsdom',
      globals: false,
      setupFiles: ['./src/test/setup.ts'],
      css: false,
    },
  };
});

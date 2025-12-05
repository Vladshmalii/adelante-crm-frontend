/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Включаем статический экспорт

  // Для GitHub Pages: раскомментируй и замени на имя твоего репозитория
  // basePath: '/adelante-crm-frontend',
  // assetPrefix: '/adelante-crm-frontend/',

  images: {
    unoptimized: true, // GitHub Pages не поддерживает Image Optimization API
  },

  trailingSlash: true, // Добавляет / в конце URL для корректной работы статического хостинга
};

export default nextConfig;

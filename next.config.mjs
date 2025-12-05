/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Статичний експорт для GitHub Pages

  // GitHub Pages: шлях до репозиторію
  basePath: '/adelante-crm-frontend',
  assetPrefix: '/adelante-crm-frontend/',

  images: {
    unoptimized: true, // GitHub Pages не підтримує Image Optimization API
  },

  trailingSlash: true, // Додає / в кінці URL для коректної роботи статичного хостингу
};

export default nextConfig;


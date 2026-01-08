/** @type {import('next').NextConfig} */

// Для локальной разработки basePath пустой, для production (GitHub Pages) - /adelante-crm-frontend
const isProduction = process.env.NODE_ENV === 'production';
const basePath = isProduction ? '/adelante-crm-frontend' : '';

const nextConfig = {
  output: 'export', // Статичний експорт для GitHub Pages

  // GitHub Pages: шлях до репозиторію
  basePath: basePath,
  assetPrefix: isProduction ? '/adelante-crm-frontend/' : undefined,

  // Устанавливаем переменную окружения для клиентского кода
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },

  images: {
    unoptimized: true, // GitHub Pages не підтримує Image Optimization API
  },

  trailingSlash: true, // Додає / в кінці URL для коректної роботи статичного хостингу
};

export default nextConfig;


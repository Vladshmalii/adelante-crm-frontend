/** @type {import('next').NextConfig} */

const nextConfig = {
    // Самостійний Node-сервер (next start / server.js) для docker-контейнера,
    // а не статичний експорт — застосунок ходить у бекенд за реальними даними.
    output: 'standalone',

    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'api-adelante.dvms.tech' },
            { protocol: 'http', hostname: 'localhost' },
        ],
    },

    eslint: {
        ignoreDuringBuilds: false,
    },
    typescript: {
        ignoreBuildErrors: false,
    },
};

export default nextConfig;

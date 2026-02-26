/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // ESTO ES LO MÁS IMPORTANTE
  eslint: {
    ignoreDuringBuilds: true, // Para que no falle por warnings
  },
  images: {
    unoptimized: true, // Obligatorio para exportación estática
  }
};

module.exports = nextConfig;
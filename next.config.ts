// next.config.ts (o .js)
const nextConfig = {
  // ELIMINAMOS output: 'export' para que Vercel sea feliz
  images: {
    unoptimized: true,
  }
};

export default nextConfig; // (o module.exports = nextConfig;)
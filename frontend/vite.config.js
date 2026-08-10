import { defineConfig, loadEnv } from 'vite';
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return { server: { proxy: { '/api': { target: env.VITE_PROXY_TARGET || 'http://localhost:5001', changeOrigin: true } } } };
});

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://smartmenu-back.up.railway.app',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/menu-images': {
        target: 'https://smartmenu-back.up.railway.app',
        changeOrigin: true,
      },
    },
  },
});
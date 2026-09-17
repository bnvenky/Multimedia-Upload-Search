import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';

const API_TARGET = process.env.VITE_DEV_API_TARGET || 'http://localhost:5000';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // In development the browser only talks to Vite, so the refresh-token cookie stays first-party.
    proxy: {
      '/api': { target: API_TARGET },
      '/socket.io': { target: API_TARGET, ws: true },
    },
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-router') || id.includes('react-dom') || id.includes('/react/')) return 'react';
            if (id.includes('@reduxjs') || id.includes('react-redux')) return 'redux';
            if (id.includes('socket.io') || id.includes('engine.io')) return 'socket';
          }
          return undefined;
        },
      },
    },
  },
});

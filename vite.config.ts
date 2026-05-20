import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
            if (id.includes('@supabase')) return 'vendor-supabase';
            if (id.includes('react-router')) return 'vendor-router';
            if (id.includes('react-dom') || id.includes('react/') || id.includes('/react/')) return 'vendor-react';
            return 'vendor';
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // Ndajme vetem Supabase (varesi e madhe, leaf) ne nje chunk te vecante.
        // QELLIMISHT NUK e ndajme react/react-dom ne chunk te vete — kjo kishte
        // shkaktuar me pare gabimin "Cannot read properties of null (useState)"
        // per shkak te rendit te inicializimit.
        manualChunks: {
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
});

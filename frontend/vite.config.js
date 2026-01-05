import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // 1. Augmente la limite d'avertissement pour éviter le message orange sur Render
    chunkSizeWarningLimit: 1600, 
    
    rollupOptions: {
      output: {
        // 2. Sépare les grosses bibliothèques (comme Lucide ou Axios) 
        // pour que le navigateur les charge plus efficacement
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return id.toString().split('node_modules/')[1].split('/')[0].toString();
          }
        },
      },
    },
  },
})
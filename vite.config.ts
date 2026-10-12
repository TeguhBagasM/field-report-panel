import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Vendor terpisah agar chunk awal + halaman ter-cache independen.
        manualChunks(id) {
          if (id.includes("node_modules/")) {
            if (
              id.includes("node_modules/react") ||
              id.includes("node_modules/react-dom") ||
              id.includes("node_modules/react-router") ||
              id.includes("node_modules/scheduler")
            ) {
              return "vendor";
            }
          }
          return undefined;
        },
      },
    },
  },
})

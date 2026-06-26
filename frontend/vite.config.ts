import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/lemma-api': {
        target: 'https://api.lemma.work',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/lemma-api/, ''),
      },
      '/lemma-auth': {
        target: 'https://lemma.work',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/lemma-auth/, ''),
      },
    },
  },
})

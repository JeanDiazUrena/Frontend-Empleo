import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const crossOriginHeaders = {
  'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
  'Cross-Origin-Embedder-Policy': 'credentialless'
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true
  },
  base: '/',
  server: {
    headers: crossOriginHeaders
  },
  preview: {
    headers: crossOriginHeaders
  }
})

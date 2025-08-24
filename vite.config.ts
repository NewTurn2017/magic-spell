import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    https: false, // Set to true if you need HTTPS for camera access
    host: true, // Listen on all addresses
    port: 5173,
  }
})

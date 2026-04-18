import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  server:{
    proxy:{
     '/api': "http://13.201.25.1:8000"
    }
  },
  plugins: [react(),
    tailwindcss(),
  ],
})

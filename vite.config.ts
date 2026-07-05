import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    watch: {
      ignored: ['**/server/**']
    }
  },
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: true },
      manifest: {
        name: 'ZeroLag',
        short_name: 'ZeroLag',
        theme_color: '#0e0e10',
        icons: [{ src: '/icon.png', sizes: '1024x1024', type: 'image/png' }, { src: '/icon.png', sizes: '192x192', type: 'image/png' }, { src: '/icon.png', sizes: '512x512', type: 'image/png' }]
      }
    })
  ],
})

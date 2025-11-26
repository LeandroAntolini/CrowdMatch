import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            manifest: {
              name: 'CrowdMatch',
              short_name: 'CrowdMatch',
              description: 'Sinta a vibe antes de ir. Veja a lotação dos locais e conecte-se com pessoas.',
              theme_color: '#1F2937',
              background_color: '#111827',
              display: 'standalone',
              orientation: 'portrait-primary',
              start_url: '.',
              id: '/',
              icons: [
                {
                  src: 'icons/icon-48x48.png',
                  sizes: '48x48',
                  type: 'image/png'
                },
                {
                  src: 'icons/icon-72x72.png',
                  sizes: '72x72',
                  type: 'image/png'
                },
                {
                  src: 'icons/icon-192x192.png',
                  sizes: '192x192',
                  type: 'image/png'
                },
                {
                  src: 'icons/icon-512x512.png',
                  sizes: '512x512',
                  type: 'image/png'
                },
                {
                  src: 'icons/icon-512x512.png',
                  sizes: '512x512',
                  type: 'image/png',
                  purpose: 'any maskable'
                }
              ]
            }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GOOGLE_MAPS_API_KEY': JSON.stringify(env.GOOGLE_MAPS_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
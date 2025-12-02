import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: "Shumse | Modern Blogging Platform",
        short_name: "Shumse",
        description: "Join the community of writers and readers on Shumse. Share your stories, ideas, and expertise.",
        start_url: "/",
        display: "standalone",
        background_color: "#0f172a",
        theme_color: "#10b981",
        orientation: "portrait",
        categories: ["social", "blogging", "education", "lifestyle"],
        icons: [
          {
            src: "/readit.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/readit.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Core React ecosystem
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/react-router')) {
            return 'vendor-router';
          }
          
          // Animation libraries
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-animation';
          }
          
          // Editor.js and related
          if (id.includes('node_modules/@editorjs') || id.includes('node_modules/@tiptap')) {
            return 'vendor-editor';
          }
          
          // UI libraries (Material-UI, Headless UI)
          if (id.includes('node_modules/@mui') || id.includes('node_modules/@headlessui') || id.includes('node_modules/@heroicons')) {
            return 'vendor-ui';
          }
          
          // Socket.io
          if (id.includes('node_modules/socket.io-client')) {
            return 'vendor-socket';
          }
          
          // Form libraries
          if (id.includes('node_modules/react-hook-form') || id.includes('node_modules/yup') || id.includes('node_modules/@hookform')) {
            return 'vendor-forms';
          }
          
          // Utility libraries
          if (id.includes('node_modules/lodash') || id.includes('node_modules/uuid') || id.includes('node_modules/axios')) {
            return 'vendor-utils';
          }
          
          // All other node_modules
          if (id.includes('node_modules')) {
            return 'vendor-misc';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
      },
      mangle: {
        safari10: true,
      },
    },
    sourcemap: false,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Optimize asset handling
    assetsInlineLimit: 4096, // 4kb - inline smaller assets
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'axios'
    ],
  },
  server: {
    port: 3000,
  }
});
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';
export default defineConfig({
    plugins: [
        react(),
        basicSsl(),
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: 'auto',
            includeAssets: ['favicon.svg', 'icons/pwa-192.png', 'icons/pwa-512.png'],
            manifest: {
                name: 'ShoppingList',
                short_name: 'ShoppingList',
                description: 'Lista della spesa offline-first collaborativa',
                theme_color: '#10b981',
                background_color: '#ffffff',
                display: 'standalone',
                orientation: 'portrait',
                start_url: '/',
                scope: '/',
                lang: 'it',
                icons: [
                    { src: '/icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
                    { src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
                    { src: '/icons/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
                ],
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-stylesheets',
                            expiration: { maxAgeSeconds: 31536000 },
                        },
                    },
                ],
            },
            devOptions: {
                enabled: true,
                type: 'module',
            },
        }),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        host: true,
        port: 5173,
    },
    preview: {
        host: true,
        port: 4173,
    },
    build: {
        target: 'es2022',
        sourcemap: true,
    },
});

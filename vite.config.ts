import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: {
      // Strict Content-Security-Policy for production hardening
      "Content-Security-Policy": [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob: https://tarotdinatoire.fr https://www.tarotdinatoire.fr https://*.supabase.co",
        "media-src 'self' https://*.supabase.co",
        "connect-src 'self' https://tarotdinatoire.fr https://www.tarotdinatoire.fr https://*.supabase.co https://ai.gateway.lovable.dev wss://*.supabase.co",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join("; "),
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin",
      "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      // Installation silencieuse — pas de prompt intrusif
      // Le SW est enregistré automatiquement et mis à jour en arrière-plan
      injectRegister: "auto",
      includeAssets: [
        "favicon.ico",
        "icons/*.png",
        "robots.txt",
        "apple-touch-icon.png",
        "tarot/**/*.png",
        "tarot/**/*.svg",
      ],
      manifest: false, // conserve public/manifest.json existant
      workbox: {
        // ── Précache : tous les assets compilés (JS, CSS, HTML) ──────────
        globPatterns: ["**/*.{js,css,html,ico,woff2}"],
        globIgnores: ["**/node_modules/**", "**/sw.js"],
        cleanupOutdatedCaches: true,
        skipWaiting: true,        // active le nouveau SW immédiatement
        clientsClaim: true,       // prend contrôle des onglets ouverts

        // ── Runtime caching strategies ────────────────────────────────────
        runtimeCaching: [
          // Cache-First — Polices Google (immutables, longue durée)
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-cache",
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 365 * 24 * 60 * 60, // 1 an
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // Cache-First — Images Tarot (assets publics statiques, /tarot/rws/*.png)
          {
            urlPattern: /\/tarot\/.+\.(?:png|jpg|jpeg|svg|webp)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "tarot-images-cache",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 jours
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // Cache-First — Images statiques générales (icons, og, logos)
          {
            urlPattern: /\/(?:icons|assets)\/.+\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "static-images-cache",
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // Cache-First — Images Supabase Storage (cartes tarot uploadées)
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/.+\.(?:png|jpg|jpeg|webp|svg)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "supabase-tarot-assets",
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 7 jours (peut changer côté admin)
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // StaleWhileRevalidate — API Supabase tarot_cards (lecture quasi-statique)
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/tarot_(?:cards|spreads).*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "api-tarot-static",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 24 * 60 * 60, // 24h
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // NetworkFirst — API Supabase dynamique (lectures user, abonnements)
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-supabase-dynamic",
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 5 * 60, // 5 min
              },
              networkTimeoutSeconds: 8,
              cacheableResponse: { statuses: [0, 200] },
            },
          },

          // StaleWhileRevalidate — Assets statiques généraux (images, svg hors tarot)
          {
            urlPattern: /\.(?:png|jpg|jpeg|gif|webp|ico)$/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "misc-images-cache",
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 7 * 24 * 60 * 60,
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false, // désactivé en dev pour ne pas perturber HMR
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor":  ["react", "react-dom", "react-router-dom"],
          "ui-vendor":     ["lucide-react", "framer-motion"],
          "supabase-vendor": ["@supabase/supabase-js"],
          // Three.js isolé en chunk séparé — lazy-loaded seulement sur /app/new
          "three-vendor":  ["three", "@react-three/fiber", "@react-three/drei"],
        },
      },
    },
    target: "es2015",
    minify: "esbuild",
  },
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
}));

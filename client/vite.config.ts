import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
    },
  },

  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt", "size-chart.png"],
      manifest: {
        name: "AI Closet - Thuê thời trang cao cấp",
        short_name: "AI Closet",
        description: "Nền tảng thuê thời trang cao cấp với công nghệ AI",
        theme_color: "#1a1a1a",
        background_color: "#f5f5f0",
        display: "standalone",
        orientation: "portrait",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/favicon.ico",
            sizes: "64x64",
            type: "image/x-icon",
          },
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        // Cache các static assets
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        // Không cache API calls
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [
          {
            // Cache ảnh sản phẩm từ Cloudinary
            urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "cloudinary-images",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 ngày
              },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),

  resolve: {
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
      "react/jsx-runtime": path.resolve(__dirname, "node_modules/react/jsx-runtime"),
    },
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Tách React core
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          // Tách UI library
          "vendor-ui": ["@radix-ui/react-dialog", "@radix-ui/react-popover", "@radix-ui/react-select"],
          // Tách query/form
          "vendor-query": ["@tanstack/react-query"],
          // Tách i18n
          "vendor-i18n": ["i18next", "react-i18next"],
          // Tách date utils
          "vendor-date": ["date-fns"],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
}));

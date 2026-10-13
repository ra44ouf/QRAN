import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // "prompt" (not "autoUpdate"): we never want to hot-swap the app
      // shell under a user mid-session and risk a mismatch between new
      // code and cached data (spec 10.1) — the app shows an explicit
      // "update available" banner (see src/app/UpdatePrompt.tsx) and only
      // activates the new service worker once the user confirms.
      registerType: "prompt",
      includeAssets: ["favicon.svg", "icons/*.png", "fonts/*.woff2", "fonts/*.txt"],
      manifest: {
        id: "/",
        name: "قُرآن | QURAN",
        short_name: "قُرآن",
        description:
          "تطبيق لقراءة القرآن الكريم والبحث في آياته والتفسير ومواقيت الصلاة، يعمل دون إنترنت",
        lang: "ar",
        dir: "rtl",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait-primary",
        background_color: "#ffffff",
        theme_color: "#2E6DA6",
        icons: [
          { src: "/icons/icon-48.png", sizes: "48x48", type: "image/png" },
          { src: "/icons/icon-72.png", sizes: "72x72", type: "image/png" },
          { src: "/icons/icon-96.png", sizes: "96x96", type: "image/png" },
          { src: "/icons/icon-128.png", sizes: "128x128", type: "image/png" },
          { src: "/icons/icon-144.png", sizes: "144x144", type: "image/png" },
          { src: "/icons/icon-152.png", sizes: "152x152", type: "image/png" },
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icons/icon-384.png", sizes: "384x384", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          {
            src: "/icons/icon-192-maskable.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/icons/icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // The Quran text + tafsir + search index are the whole point of
        // offline-first (spec 10.1/10.4): precache them as part of the
        // service worker's install step, not just the app shell, so the
        // app is fully offline-capable as soon as install finishes.
        globPatterns: ["**/*.{js,css,html,svg,woff2,png,ico,json,txt}"],
        // search-index.json is ~3.9MB — raise Workbox's default 2MB cap.
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        navigateFallback: "/index.html",
        // Never cache a network error/opaque failure as if it were valid
        // content (spec 10.1) — only cache successful, complete responses.
        runtimeCaching: [
          {
            urlPattern: /\/data\/.*\.json$/,
            handler: "CacheFirst",
            options: {
              cacheName: "quran-data",
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
});

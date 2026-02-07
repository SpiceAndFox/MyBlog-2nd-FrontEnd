import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || "http://127.0.0.1:3000";

  return {
    plugins: [
      vue({
        template: {
          compilerOptions: {
            isCustomElement: (tag) => tag.startsWith("md-"),
          },
        },
      }),
      VitePWA({
        registerType: "autoUpdate",
        manifest: {
          name: "Spice Nest",
          short_name: "Spice",
          start_url: "/",
          display: "standalone",
          background_color: "rgb(238, 238, 238)",
          theme_color: "rgb(238, 238, 238)",
          icons: [
            {
              src: "/pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        "@": "/src",
      },
    },
    server: {
      host: "0.0.0.0",
      port: 5173,
      proxy: {
        "/api": {
          target: apiProxyTarget,
          changeOrigin: true,
        },
        "/uploads": {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});

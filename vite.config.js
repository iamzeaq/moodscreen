import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    open: true,
  },
  build: {
    /** Avoid noisy 500 kB warning once chunks are split; main bundle stays smaller */
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("react-dom")) return "react-dom";
          if (id.includes("react-router")) return "react-router";
          if (id.includes("@supabase")) return "supabase";
          if (id.includes("html-to-image") || id.includes("html2canvas")) return "capture";
          if (id.includes("/react/") || id.includes("\\react\\")) return "react";
        },
      },
    },
  },
});

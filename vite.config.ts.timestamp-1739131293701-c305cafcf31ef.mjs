// vite.config.ts
import path from "path";
import { defineConfig } from "file:///C:/Users/antob/Documents/Arctusol/tracking_budget/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/antob/Documents/Arctusol/tracking_budget/node_modules/@vitejs/plugin-react-swc/index.mjs";
import { tempo } from "file:///C:/Users/antob/Documents/Arctusol/tracking_budget/node_modules/tempo-devtools/dist/vite/index.js";
var __vite_injected_original_dirname = "C:\\Users\\antob\\Documents\\Arctusol\\tracking_budget";
var conditionalPlugins = [];
if (process.env.TEMPO === "true") {
  conditionalPlugins.push(["tempo-devtools/swc", {}]);
}
var vite_config_default = defineConfig({
  base: process.env.NODE_ENV === "development" ? "/" : process.env.VITE_BASE_PATH || "/",
  optimizeDeps: {
    entries: ["src/main.tsx", "src/tempobook/**/*"]
  },
  plugins: [
    react({
      plugins: conditionalPlugins
    }),
    tempo()
  ],
  resolve: {
    preserveSymlinks: true,
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  server: {
    // @ts-ignore
    allowedHosts: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          pdfjs: ["pdfjs-dist"]
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxhbnRvYlxcXFxEb2N1bWVudHNcXFxcQXJjdHVzb2xcXFxcdHJhY2tpbmdfYnVkZ2V0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxhbnRvYlxcXFxEb2N1bWVudHNcXFxcQXJjdHVzb2xcXFxcdHJhY2tpbmdfYnVkZ2V0XFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9hbnRvYi9Eb2N1bWVudHMvQXJjdHVzb2wvdHJhY2tpbmdfYnVkZ2V0L3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0LXN3Y1wiO1xuaW1wb3J0IHsgdGVtcG8gfSBmcm9tIFwidGVtcG8tZGV2dG9vbHMvZGlzdC92aXRlXCI7XG5cbmNvbnN0IGNvbmRpdGlvbmFsUGx1Z2luczogW3N0cmluZywgUmVjb3JkPHN0cmluZywgYW55Pl1bXSA9IFtdO1xuXG4vLyBAdHMtaWdub3JlXG5pZiAocHJvY2Vzcy5lbnYuVEVNUE8gPT09IFwidHJ1ZVwiKSB7XG4gIGNvbmRpdGlvbmFsUGx1Z2lucy5wdXNoKFtcInRlbXBvLWRldnRvb2xzL3N3Y1wiLCB7fV0pO1xufVxuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgYmFzZTogcHJvY2Vzcy5lbnYuTk9ERV9FTlYgPT09IFwiZGV2ZWxvcG1lbnRcIiA/IFwiL1wiIDogcHJvY2Vzcy5lbnYuVklURV9CQVNFX1BBVEggfHwgXCIvXCIsXG4gIG9wdGltaXplRGVwczoge1xuICAgIGVudHJpZXM6IFtcInNyYy9tYWluLnRzeFwiLCBcInNyYy90ZW1wb2Jvb2svKiovKlwiXSxcbiAgfSxcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KHtcbiAgICAgIHBsdWdpbnM6IGNvbmRpdGlvbmFsUGx1Z2lucyxcbiAgICB9KSxcbiAgICB0ZW1wbygpLFxuICBdLFxuICByZXNvbHZlOiB7XG4gICAgcHJlc2VydmVTeW1saW5rczogdHJ1ZSxcbiAgICBhbGlhczoge1xuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXG4gICAgfSxcbiAgfSxcbiAgc2VydmVyOiB7XG4gICAgLy8gQHRzLWlnbm9yZVxuICAgIGFsbG93ZWRIb3N0czogdHJ1ZSxcbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgcGRmanM6IFsncGRmanMtZGlzdCddXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFpVixPQUFPLFVBQVU7QUFDbFcsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxXQUFXO0FBQ2xCLFNBQVMsYUFBYTtBQUh0QixJQUFNLG1DQUFtQztBQUt6QyxJQUFNLHFCQUFzRCxDQUFDO0FBRzdELElBQUksUUFBUSxJQUFJLFVBQVUsUUFBUTtBQUNoQyxxQkFBbUIsS0FBSyxDQUFDLHNCQUFzQixDQUFDLENBQUMsQ0FBQztBQUNwRDtBQUdBLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLE1BQU0sUUFBUSxJQUFJLGFBQWEsZ0JBQWdCLE1BQU0sUUFBUSxJQUFJLGtCQUFrQjtBQUFBLEVBQ25GLGNBQWM7QUFBQSxJQUNaLFNBQVMsQ0FBQyxnQkFBZ0Isb0JBQW9CO0FBQUEsRUFDaEQ7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxNQUNKLFNBQVM7QUFBQSxJQUNYLENBQUM7QUFBQSxJQUNELE1BQU07QUFBQSxFQUNSO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxrQkFBa0I7QUFBQSxJQUNsQixPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQUEsRUFDQSxRQUFRO0FBQUE7QUFBQSxJQUVOLGNBQWM7QUFBQSxFQUNoQjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLFFBQ04sY0FBYztBQUFBLFVBQ1osT0FBTyxDQUFDLFlBQVk7QUFBQSxRQUN0QjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==

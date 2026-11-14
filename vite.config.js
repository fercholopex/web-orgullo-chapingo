import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:3001"
    }
  },
  build: {
    rollupOptions: {
      input: {
        home: `${projectRoot}/index.html`,
        proposals: `${projectRoot}/propuestas.html`
      }
    }
  }
});

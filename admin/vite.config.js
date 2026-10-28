import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  envDir: fileURLToPath(new URL("..", import.meta.url)),
  envPrefix: ["VITE_", "PUBLIC_"],
  base: "/admin/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    outDir: fileURLToPath(new URL("../dist/admin", import.meta.url)),
    emptyOutDir: true,
  },
});

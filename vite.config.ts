import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Mermaid's cose-bilkent imports cytoscape.esm.js but cytoscape only ships .mjs
      "cytoscape/dist/cytoscape.esm.js": path.resolve(__dirname, "node_modules/cytoscape/dist/cytoscape.esm.mjs"),
      "cytoscape/dist/cytoscape.umd.js": path.resolve(__dirname, "node_modules/cytoscape/dist/cytoscape.umd.js"),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
})

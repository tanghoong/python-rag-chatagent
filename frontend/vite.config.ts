import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => ({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  
  // Build optimizations
  build: {
    // Output directory
    outDir: 'build',
    
    // Generate sourcemaps for production debugging
    sourcemap: mode === 'development',
    
    // Minification
    minify: 'esbuild',
    
    // Target modern browsers
    target: 'es2020',
    
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
    
    // Rollup options - only apply manual chunks for client builds
    rollupOptions: {
      output: {
        // Manual chunks for better caching - only for client
        manualChunks: (id) => {
          // Don't apply manual chunks for SSR builds
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            if (id.includes('lucide-react') || id.includes('sonner')) {
              return 'ui-vendor';
            }
            if (id.includes('react-markdown') || id.includes('remark-gfm')) {
              return 'markdown-vendor';
            }
          }
        },
      },
    },
    
    // Compression
    reportCompressedSize: true,
  },
  
  // Preview server (for production build testing)
  preview: {
    port: 3000,
    host: true,
  },
  
  // Development server
  server: {
    port: 5173,
    host: true,
  },
}));

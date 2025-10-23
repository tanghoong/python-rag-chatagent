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
    
    // Rollup options
    rollupOptions: {
      output: {
        // Manual chunks for better caching
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router'],
          'ui-vendor': ['lucide-react', 'sonner'],
          'markdown-vendor': ['react-markdown', 'remark-gfm'],
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

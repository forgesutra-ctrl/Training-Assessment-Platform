import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'

  return {
    root: __dirname,
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      // Production build optimizations
      minify: 'terser',
      terserOptions: {
        compress: {
          // Remove console.logs in production
          drop_console: isProduction,
          drop_debugger: isProduction,
          pure_funcs: isProduction ? ['console.log', 'console.info', 'console.debug'] : [],
        },
      },
      // Generate source maps for debugging (can be disabled for smaller builds)
      sourcemap: isProduction ? 'hidden' : true,
      // Optimize chunk splitting
      rollupOptions: {
        output: {
          manualChunks: {
            // Separate vendor chunks for better caching
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'supabase-vendor': ['@supabase/supabase-js'],
            'chart-vendor': ['recharts'],
            'ui-vendor': ['lucide-react', 'react-hot-toast'],
          },
        },
      },
      // Chunk size warnings
      chunkSizeWarningLimit: 1000,
      // Asset optimization
      assetsInlineLimit: 4096, // Inline assets smaller than 4kb
      // CSS code splitting
      cssCodeSplit: true,
      // Build target
      target: 'es2015',
    },
    // Optimize dependencies
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js'],
    },
  }
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'

  return {
    plugins: [react()],
    base: '/', // Ensure base path is root for Vercel
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), './src'),
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
        onwarn(warning, warn) {
          // Suppress certain warnings that don't affect functionality
          if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return
          if (warning.code === 'SOURCEMAP_ERROR') return
          if (warning.code === 'THIS_IS_UNDEFINED') return
          warn(warning)
        }
      },
      // Chunk size warnings
      chunkSizeWarningLimit: 1000,
      // Asset optimization
      assetsInlineLimit: 4096, // Inline assets smaller than 4kb
      // CSS code splitting
      cssCodeSplit: true,
      // Build target
      target: 'es2015',
      // Continue build even with warnings
      emptyOutDir: true,
    },
    // Optimize dependencies
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js'],
    },
    // Suppress certain warnings in production
    logLevel: isProduction ? 'error' : 'info',
  }
})
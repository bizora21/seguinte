import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-firebase': ['firebase/app', 'firebase/messaging'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu',
                        '@radix-ui/react-select', '@radix-ui/react-tabs',
                        '@radix-ui/react-toast', '@radix-ui/react-tooltip'],
          'vendor-tiptap': ['@tiptap/react', '@tiptap/starter-kit',
                            '@tiptap/extension-image', '@tiptap/extension-link',
                            '@tiptap/extension-table'],
          'vendor-charts': ['recharts'],
          'vendor-motion': ['framer-motion'],
        }
      }
    }
  },
}));

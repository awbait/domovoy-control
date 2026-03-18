import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    lib: {
      entry: 'src/settings.tsx',
      formats: ['es'],
      fileName: () => 'settings.js',
    },
    outDir: '../dist',
    emptyOutDir: false, // widget.js already there from first build
    rollupOptions: { external: [] },
  },
})

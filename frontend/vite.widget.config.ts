import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    lib: {
      entry: 'src/widget.tsx',
      formats: ['es'],
      fileName: () => 'widget.js',
    },
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: { external: [] },
  },
})

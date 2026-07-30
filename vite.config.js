import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative asset URLs, so the same build works at a domain root
  // (Vercel, Netlify) and under a sub-path (GitHub Pages /hitungsampah/).
  base: './',
  plugins: [react()],
  build: { target: 'es2020' },
});

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base: './'` makes asset URLs relative, so the same build works at a domain
// root (Vercel, Netlify) and in a sub-folder (GitHub Pages: /<repo>/).
// Routing uses the URL hash, so no server rewrite rules are needed either.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5173 },
});

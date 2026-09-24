import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Served from https://clarkngo.github.io/problem-atlas/ on GitHub Pages.
export default defineConfig({
  base: '/problem-atlas/',
  plugins: [react(), tailwindcss()],
});

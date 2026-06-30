import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// On GitHub Pages a *project* site is served from https://<user>.github.io/<repo>/,
// so assets must be requested under that sub-path. In GitHub Actions we derive
// the repo name automatically from GITHUB_REPOSITORY ("owner/repo"); locally
// (dev/preview) we serve from root. Override with BASE_PATH if you deploy
// manually or to a custom/user-root domain (use BASE_PATH=/ for the latter).
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1];
const base =
  process.env.BASE_PATH ?? (process.env.GITHUB_ACTIONS && repo ? `/${repo}/` : '/');

export default defineConfig({
  base,
  plugins: [react()],
});

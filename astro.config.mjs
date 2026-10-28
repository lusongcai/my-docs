import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://lusongcai.github.io',
  output: 'static',
  trailingSlash: 'always',
  devToolbar: { enabled: false },
});

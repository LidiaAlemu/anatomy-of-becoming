import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
  site: 'https://anatomy-of-becoming.netlify.app',
  markdown: {
    shikiConfig: {
      theme: 'github-light',
    },
  },
});
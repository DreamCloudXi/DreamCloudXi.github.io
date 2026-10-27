import { defineConfig, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

import { SITE } from './src/config/site';

// https://astro.build/config
export default defineConfig({
  site: SITE.url,
  server: { host: '127.0.0.1' },
  integrations: [mdx(), sitemap()],

  /*
   * Fetch the next page while the reader is still deciding to go there, so the
   * click lands on a document that has already arrived. `hover` rather than
   * `viewport` keeps this to links someone is actually reaching for — on a long
   * page, prefetching everything in sight would undo the weight the theme is
   * careful about elsewhere. Astro skips this entirely on a slow connection or
   * when the reader has data saver on.
   */
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  image: {
    responsiveStyles: true,
    layout: 'constrained',
  },

  /*
   * Both families ship with the theme rather than being fetched at build time.
   * Bundling them keeps builds reproducible and offline-capable — a CDN blip
   * can no longer fail a deploy — at the cost of 276 KB in the repository.
   * See LICENSE.md for the terms each font is distributed under.
   */
  /*
   * Generated from the fonts in the export, and served from this project rather
   * than a CDN so a build stays reproducible offline. Only declare the weights
   * the stylesheet asks for: every one declared is a file a visitor may fetch.
   */
  fonts: [
    /*
     * Libre Baskerville ships with the theme rather than being fetched at build
     * time, so a build stays reproducible offline. `cssVariable` is named after
     * the face rather than after the role it plays: Astro rewrites the family
     * to a hashed string and exposes it only through this variable, and
     * `additions.css` points the design's own `--font-family--heading` token at
     * it. Naming it `--font-heading` here would collide with the Tailwind theme
     * binding of the same name in `global.css`.
     */
    {
      provider: fontProviders.local(),
      name: 'Libre Baskerville',
      cssVariable: '--font-libre-baskerville',
      fallbacks: ['Georgia', 'Times New Roman', 'serif'],
      options: {
        variants: [
          { src: ['./src/assets/fonts/LibreBaskerville-Regular.ttf'], weight: '400', style: 'normal' },
          { src: ['./src/assets/fonts/LibreBaskerville-Italic.ttf'], weight: '400', style: 'italic' },
          { src: ['./src/assets/fonts/LibreBaskerville-Medium.ttf'], weight: '500', style: 'normal' },
          { src: ['./src/assets/fonts/LibreBaskerville-MediumItalic.ttf'], weight: '500', style: 'italic' },
          { src: ['./src/assets/fonts/LibreBaskerville-SemiBold.ttf'], weight: '600', style: 'normal' },
          { src: ['./src/assets/fonts/LibreBaskerville-SemiBoldItalic.ttf'], weight: '600', style: 'italic' },
          { src: ['./src/assets/fonts/LibreBaskerville-Bold.ttf'], weight: '700', style: 'normal' },
          { src: ['./src/assets/fonts/LibreBaskerville-BoldItalic.ttf'], weight: '700', style: 'italic' },
        ],
      },
    },
    /*
     * Manrope is the body face — the design reads it through
     * `--font-family--paragraph`, which is the family behind every paragraph,
     * label and button in the theme. The export pulled it from Google Fonts at
     * runtime and shipped no files, so it is fetched once at build time and
     * self-hosted from there; nothing is requested from a third party when a
     * visitor loads the site.
     */
    {
      provider: fontProviders.google(),
      name: 'Manrope',
      cssVariable: '--font-manrope',
      fallbacks: ['system-ui', 'sans-serif'],
      weights: [300, 400, 500, 600, 700],
      styles: ['normal'],
      subsets: ['latin'],
    },
  ],

  vite: {
    plugins: [tailwindcss()],
  },
});

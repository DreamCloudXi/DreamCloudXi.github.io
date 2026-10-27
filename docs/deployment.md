# Deployment

The theme builds to static files, so it runs on any static host.

## Before you build

Set your production URL in `src/config/site.ts`:

```ts
export const SITE = {
  url: 'https://www.your-domain.com',
  ...
};
```

Canonical URLs, Open Graph tags and `sitemap-index.xml` all derive from it.

Then:

```sh
npm run build     # → ./dist
npm run preview   # check it locally first
```

The build needs network access once, to fetch and self-host Manrope. Libre
Baskerville ships with the theme and is not fetched.

## Static hosts

| Host | Setting |
| --- | --- |
| Netlify | Build `npm run build`, publish `dist` |
| Vercel | Framework preset "Astro" detects everything |
| Cloudflare Pages | Build `npm run build`, output `dist` |
| GitHub Pages | Build `npm run build`, publish `dist`; set `base` in `astro.config.ts` if serving from a subpath |

## Server rendering

Only needed if you add on-demand routes, live collections or server-handled form
posts:

```sh
npx astro add netlify   # or vercel, node, cloudflare
```

Static pages stay static; add `export const prerender = false` only to the
routes that need to render per request.

## Environment variables

Set `CONTENT_SOURCE` and its credentials in your host's build environment when
sourcing content from a CMS. They are read at build time, so a content change in
the CMS needs a rebuild — most CMSs can trigger one with a deploy hook.

## Before going live

- Replace the demo photography in `src/assets/images/`
- Replace `public/favicon.png`, `public/webclip.jpg` and add `public/og-image.jpg`
- Update contact details and social links in `src/config/site.ts`
- Point the newsletter and contact forms at a real endpoint (see [customizing](./customizing.md#forms))
- Re-encode the videos in `public/videos/` if you swap them; keep both `.mp4` and `.webm` plus a `-poster.jpg`

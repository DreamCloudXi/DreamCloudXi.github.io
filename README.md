# Handspark — a handmade shop theme for Astro

A shop for a small studio that makes things by hand: products, categories, gift
cards, a personalization request, a photo gallery and a journal. Twenty page
templates building 43 routes, eight content collections, a scroll-driven motion
layer taken from the original design's own interaction data, and a design token
system you can retheme from one file.

Content comes from local Markdown and JSON out of the box, and can be switched
to Contentful, Sanity, Strapi, WordPress or Shopify with one environment
variable.

---

## Quick start

```sh
npm install
npm run dev
```

The site runs at `http://localhost:4321` with the full demo catalog already in
place — no CMS, no API keys, nothing to configure.

| Command | Does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Build to `./dist` |
| `npm run preview` | Preview the production build |
| `npm run check` | Type-check `.astro` and `.ts` files |
| `npm run format` | Format with Prettier |

**Requirements:** Node 22.12 or newer. The first build downloads Manrope from
Google Fonts and self-hosts it, so it needs network access once; Libre
Baskerville ships with the theme.

---

## What's included

**Pages**

| Route | Template |
| --- | --- |
| `/` | Home |
| `/about/` | The studio |
| `/shop/` | Everything for sale |
| `/product-categories/[slug]/` | One category |
| `/products/[slug]/` | One product |
| `/blog/`, `/blog/[slug]/` | Journal index and article |
| `/blog-categories/[slug]/` | One journal category |
| `/photo-gallery/` | Gallery with a lightbox |
| `/faq/` | Accordion |
| `/gift-and-gift-card/` | Gift cards |
| `/personalize-your-gift/` | Personalization request |
| `/contact/` | Contact form and studio details |
| `/privacy-policy/` | Privacy policy |
| `/style-guide/` | Live token and component reference |
| `/instructions/`, `/licenses/`, `/changelog/`, `/external-link/` | Utility pages |
| `/404` | Not found |
| `/rss.xml` | Journal feed |
| `/robots.txt`, `/sitemap-index.xml` | Generated from `SITE.url` |

**Also in the box:** canonical URLs, Open Graph and Twitter cards, JSON-LD for
the organization, articles and breadcrumbs, self-hosted fonts, responsive
images, a keyboard-accessible nav, tabs, an accordion, a carousel, a lightbox,
and a motion layer that respects `prefers-reduced-motion`.

---

## Where things are

| Path | What |
| --- | --- |
| `src/config/site.ts` | Name, URL, contact details, navigation, footer, currency |
| `src/content/` | Products, articles, categories, makers, reviews, questions, photographs |
| `src/content/schemas.ts` | The shape every collection is validated against |
| `src/styles/theme.css` | Design tokens — colors, type, spacing, radii |
| `src/styles/components.css` | One class per block in the design (generated) |
| `src/styles/additions.css` | Hand-written corrections; the only stylesheet to add to |
| `src/scripts/` | Header, tabs, accordion, slider, lightbox, forms, motion |
| `src/icons/` | 44 inline SVGs, each inheriting `currentColor` |
| `docs/` | Content sources, commerce, forms, customizing, deployment |

---

## About the shop

The theme ships a shop and **not** a checkout. A static site has no server to
take a payment on, so rather than shipping a checkout page that collects a card
number and charges nobody, every Add to Cart is a real `<form>` carrying the
product id, name, price, currency and quantity — ready for Snipcart, a Shopify
Buy Button, or any provider that reads a form.

[docs/commerce.md](docs/commerce.md) has the whole of it, including the exact
edits for Snipcart and Shopify.

---

## License

See [LICENSE.md](LICENSE.md). The photography in the demo content is placeholder
imagery; check its terms before using it on a live site.

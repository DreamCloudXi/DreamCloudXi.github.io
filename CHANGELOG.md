# Changelog

All notable changes to this theme are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the theme follows
[semantic versioning](https://semver.org/): the major number changes when an
update needs you to edit your own files, the minor when features arrive that do
not, and the patch for fixes.

## [1.0.0] — 2026-04-29

First release.

### Pages

Home, the studio, the shop, a product, a product category, the journal, an
article, a journal category, the photo gallery, the FAQ, gift cards,
personalization, contact, privacy, a style guide, four utility pages and a 404 —
43 routes in all from the demo content.

### Content

Eight collections: products, product categories, articles, journal categories,
the makers, customer reviews, questions and the gallery. Local Markdown and JSON
by default; Contentful, Sanity, Strapi, WordPress and Shopify behind one
environment variable.

### Commerce

Every Add to Cart is a real form carrying the product id, name, price as a
number, currency and quantity. No checkout ships: a static site has no server to
take a payment on. See `docs/commerce.md` for attaching Snipcart or Shopify.

### Motion

Eight scroll and load effects rebuilt from the original design's own interaction
data, all declared in the markup as `data-anim` and defined once in
`src/scripts/motion.ts`. Readers who ask for reduced motion get the page with
nothing moving.

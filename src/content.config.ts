/**
 * Content collections.
 *
 * Long-form content lives in Markdown, structured lists in JSON — both under
 * `src/content`. Every collection is wrapped in `resolveLoader`, which hands
 * over to a CMS when `CONTENT_SOURCE` names one and falls back to these local
 * files otherwise. See `src/loaders/index.ts`.
 */
import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';

import { resolveLoader } from './loaders';
import {
  categorySchema,
  faqSchema,
  gallerySchema,
  postSchema,
  productSchema,
  reviewSchema,
  teamSchema,
} from './content/schemas';

const markdown = (dir: string) =>
  glob({ pattern: '**/*.{md,mdx}', base: `./src/content/${dir}` });

const json = (name: string) => file(`./src/content/data/${name}.json`);

/* ------------------------------------------------------------- the shop -- */

const products = defineCollection({
  loader: resolveLoader('products', markdown('products')),
  schema: productSchema,
});

const productCategories = defineCollection({
  loader: resolveLoader('productCategories', json('product-categories')),
  schema: categorySchema,
});

/* ---------------------------------------------------------------- blog -- */

const posts = defineCollection({
  loader: resolveLoader('posts', markdown('posts')),
  schema: postSchema,
});

const blogCategories = defineCollection({
  loader: resolveLoader('blogCategories', json('blog-categories')),
  schema: categorySchema,
});

/* ----------------------------------------------------------- the studio -- */

const team = defineCollection({
  loader: resolveLoader('team', json('team')),
  schema: teamSchema,
});

const reviews = defineCollection({
  loader: resolveLoader('reviews', json('reviews')),
  schema: reviewSchema,
});

const faqs = defineCollection({
  loader: resolveLoader('faqs', json('faqs')),
  schema: faqSchema,
});

const gallery = defineCollection({
  loader: resolveLoader('gallery', json('gallery')),
  schema: gallerySchema,
});

export const collections = {
  products,
  productCategories,
  posts,
  blogCategories,
  team,
  reviews,
  faqs,
  gallery,
};

/**
 * Content schemas.
 *
 * Every source — local files, Contentful, Sanity, Strapi, Shopify — is
 * validated against the same shapes, so a page never needs to know where its
 * data came from. A CMS loader's job is only to map its own field names onto
 * these; see `src/loaders/mapping.ts`.
 */
import type { SchemaContext } from 'astro:content';
import { z } from 'astro/zod';

/** Images may be a bundled asset (local) or an absolute URL (a CMS). */
const imageField = ({ image }: SchemaContext) => z.union([image(), z.url()]);

export const seo = z.object({
  /** Overrides the page title in search results and social cards. */
  title: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  noindex: z.boolean().default(false),
});

/* --------------------------------------------------------------- taxonomy -- */

export const categorySchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  /** Lower numbers list first. */
  order: z.number().default(0),
});

/* --------------------------------------------------------------- the shop -- */

export const productSchema = (ctx: SchemaContext) =>
  z.object({
    title: z.string(),
    excerpt: z.string(),
    /**
     * The number only. The currency is one setting in `src/config/site.ts`,
     * so a shop that trades in euros changes it in one place rather than in
     * every piece of content — and the cart provider is handed a number it can
     * total rather than a string it has to parse.
     */
    price: z.number(),
    /** What a buyer's cart provider will call this line. */
    sku: z.string(),
    /** Matches an entry id in `productCategories`. */
    category: z.string(),
    /** First is the one the cards and the share card use. */
    images: z.array(imageField(ctx)).min(1),
    /** The three panels under the price, in the order the design shows them. */
    details: z.array(z.string()).default([]),
    features: z.array(z.string()).default([]),
    materials: z.string().optional(),
    order: z.number().default(0),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    seo: seo.optional(),
  });

/* ------------------------------------------------------------------ blog -- */

/** An author credited on a post. */
export const person = (ctx: SchemaContext) =>
  z.object({
    name: z.string(),
    role: z.string().optional(),
    avatar: imageField(ctx).optional(),
  });

export const postSchema = (ctx: SchemaContext) =>
  z.object({
    title: z.string(),
    excerpt: z.string(),
    /** Matches an entry id in `blogCategories`. */
    category: z.string(),
    author: person(ctx),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    image: imageField(ctx),
    readingTime: z.number().optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    seo: seo.optional(),
  });

/* ------------------------------------------------------------ the studio -- */

export const teamSchema = (ctx: SchemaContext) =>
  z.object({
    name: z.string(),
    role: z.string(),
    image: imageField(ctx),
    order: z.number().default(0),
    social: z
      .array(z.object({ label: z.string(), href: z.url(), icon: z.string() }))
      .default([]),
  });

export const reviewSchema = (ctx: SchemaContext) =>
  z.object({
    quote: z.string(),
    author: z.string(),
    role: z.string(),
    avatar: imageField(ctx),
    rating: z.number().min(0).max(5).default(5),
    order: z.number().default(0),
  });

export const faqSchema = (ctx: SchemaContext) =>
  z.object({
    question: z.string(),
    answer: z.string(),
    image: imageField(ctx),
    order: z.number().default(0),
  });

export const gallerySchema = (ctx: SchemaContext) =>
  z.object({
    title: z.string(),
    image: imageField(ctx),
    order: z.number().default(0),
  });

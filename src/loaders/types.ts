import type { Loader } from 'astro/loaders';

/** The collections this theme knows how to source from a CMS. */
export type CollectionName =
  | 'products'
  | 'productCategories'
  | 'posts'
  | 'blogCategories'
  | 'team'
  | 'reviews'
  | 'faqs'
  | 'gallery';

/** Every remote source implements this one function. */
export interface ContentSource {
  name: string;
  /** True when the environment holds the credentials this source needs. */
  isConfigured(): boolean;
  /** Returns a loader for one collection, or null if it doesn't provide it. */
  loader(collection: CollectionName): Loader | null;
}

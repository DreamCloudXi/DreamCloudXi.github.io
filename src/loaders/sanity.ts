/**
 * Sanity source.
 *
 * Set `CONTENT_SOURCE=sanity` plus `SANITY_PROJECT_ID` and `SANITY_DATASET`.
 * `SANITY_API_VERSION` defaults to a pinned date, and `SANITY_TOKEN` is only
 * needed for private datasets or drafts.
 *
 * `DOC_TYPES` maps this theme's collections onto your document `_type` values.
 */
import type { Loader } from 'astro/loaders';

import { mapEntry } from './mapping';
import type { CollectionName, ContentSource } from './types';

const DOC_TYPES: Partial<Record<CollectionName, string>> = {
  products: 'product',
  productCategories: 'productCategory',
  posts: 'post',
  blogCategories: 'category',
  team: 'teamMember',
  reviews: 'review',
  faqs: 'faq',
  gallery: 'galleryImage',
};

const env = (key: string) => import.meta.env[key] ?? process.env[key];

/**
 * Projects the document and resolves the two things GROQ won't give us for
 * free: asset URLs, and referenced document slugs.
 */
const PROJECTION = `{
  ...,
  "id": coalesce(slug.current, _id),
  "image": image.asset->url,
  "avatar": avatar.asset->url,
  "logo": logo.asset->url,
  "thumbnail": thumbnail.asset->url,
  "category": category->slug.current
}`;

export const sanity: ContentSource = {
  name: 'sanity',

  isConfigured: () => Boolean(env('SANITY_PROJECT_ID') && env('SANITY_DATASET')),

  loader(collection: CollectionName): Loader | null {
    const type = DOC_TYPES[collection];
    if (!type) return null;

    return {
      name: `sanity:${collection}`,
      load: async ({ store, parseData, logger }) => {
        store.clear();

        const projectId = env('SANITY_PROJECT_ID');
        const dataset = env('SANITY_DATASET');
        const apiVersion = env('SANITY_API_VERSION') ?? '2024-10-01';
        const token = env('SANITY_TOKEN');

        // Published documents only — drafts carry a `drafts.` id prefix.
        const query = `*[_type == "${type}" && !(_id in path("drafts.**"))] ${PROJECTION}`;
        const url = new URL(
          `https://${projectId}.api.sanity.io/v${apiVersion}/data/query/${dataset}`
        );
        url.searchParams.set('query', query);

        const response = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!response.ok) {
          throw new Error(`[sanity] ${collection}: ${response.status} ${response.statusText}`);
        }

        const { result = [] } = await response.json();

        for (const doc of result) {
          const id = doc.id ?? doc._id;
          const data = await parseData({ id, data: mapEntry(collection, doc) });
          store.set({ id, data, digest: doc._rev });
        }

        logger.info(`Loaded ${store.keys().length} ${collection} from Sanity`);
      },
    };
  },
};

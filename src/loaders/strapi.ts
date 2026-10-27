/**
 * Strapi source (v4 and v5).
 *
 * Set `CONTENT_SOURCE=strapi` plus `STRAPI_URL` (e.g. https://cms.example.com)
 * and, for non-public content, `STRAPI_TOKEN`.
 *
 * `API_IDS` maps this theme's collections onto your plural API IDs.
 */
import type { Loader } from 'astro/loaders';

import { mapEntry } from './mapping';
import type { CollectionName, ContentSource } from './types';

const API_IDS: Partial<Record<CollectionName, string>> = {
  products: 'products',
  productCategories: 'product-categories',
  posts: 'posts',
  blogCategories: 'blog-categories',
  team: 'team-members',
  reviews: 'reviews',
  faqs: 'faqs',
  gallery: 'gallery-images',
};

const env = (key: string) => import.meta.env[key] ?? process.env[key];

/** v4 nests fields under `attributes`; v5 returns them flat. */
function flatten(entry: any, base: string): Record<string, unknown> {
  const fields = entry.attributes ?? entry;
  const out: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(fields)) {
    const v = value as any;
    // Media field
    if (v?.data?.attributes?.url) {
      out[key] = new URL(v.data.attributes.url, base).href;
    } else if (v?.url && typeof v.url === 'string') {
      out[key] = new URL(v.url, base).href;
    }
    // Single relation
    else if (v?.data?.attributes) {
      out[key] = v.data.attributes.slug ?? v.data.attributes.name ?? v.data.id;
    } else if (v?.slug) {
      out[key] = v.slug;
    }
    // Repeatable relation or media
    else if (Array.isArray(v?.data)) {
      out[key] = v.data.map((d: any) => d.attributes?.slug ?? d.attributes?.url ?? d.id);
    } else {
      out[key] = v;
    }
  }

  return out;
}

export const strapi: ContentSource = {
  name: 'strapi',

  isConfigured: () => Boolean(env('STRAPI_URL')),

  loader(collection: CollectionName): Loader | null {
    const apiId = API_IDS[collection];
    if (!apiId) return null;

    return {
      name: `strapi:${collection}`,
      load: async ({ store, parseData, logger }) => {
        store.clear();

        const base = String(env('STRAPI_URL')).replace(/\/$/, '');
        const token = env('STRAPI_TOKEN');

        let page = 1;
        let pageCount = 1;

        while (page <= pageCount) {
          const url = new URL(`${base}/api/${apiId}`);
          url.searchParams.set('populate', '*');
          url.searchParams.set('pagination[pageSize]', '100');
          url.searchParams.set('pagination[page]', String(page));

          const response = await fetch(url, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (!response.ok) {
            throw new Error(`[strapi] ${collection}: ${response.status} ${response.statusText}`);
          }

          const payload = await response.json();
          pageCount = payload.meta?.pagination?.pageCount ?? 1;
          page += 1;

          for (const entry of payload.data ?? []) {
            const fields = flatten(entry, base);
            const id = String(fields.slug ?? entry.documentId ?? entry.id);
            const data = await parseData({ id, data: mapEntry(collection, fields) });
            store.set({ id, data, digest: String(fields.updatedAt ?? '') });
          }
        }

        logger.info(`Loaded ${store.keys().length} ${collection} from Strapi`);
      },
    };
  },
};

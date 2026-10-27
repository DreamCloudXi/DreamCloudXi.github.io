/**
 * Contentful source.
 *
 * Set `CONTENT_SOURCE=contentful` plus `CONTENTFUL_SPACE_ID` and
 * `CONTENTFUL_DELIVERY_TOKEN`. `CONTENTFUL_ENVIRONMENT` defaults to `master`,
 * and `CONTENTFUL_PREVIEW=true` reads drafts through the preview API.
 *
 * `CONTENT_TYPES` below maps this theme's collections onto your content type
 * IDs — rename the values to match your space.
 */
import type { Loader } from 'astro/loaders';

import { mapEntry } from './mapping';
import type { CollectionName, ContentSource } from './types';

const CONTENT_TYPES: Partial<Record<CollectionName, string>> = {
  products: 'product',
  productCategories: 'productCategory',
  posts: 'blogPost',
  blogCategories: 'blogCategory',
  team: 'teamMember',
  reviews: 'review',
  faqs: 'faq',
  gallery: 'galleryImage',
};

const env = (key: string) => import.meta.env[key] ?? process.env[key];

function endpoint(): string {
  const space = env('CONTENTFUL_SPACE_ID');
  const environment = env('CONTENTFUL_ENVIRONMENT') ?? 'master';
  const host = env('CONTENTFUL_PREVIEW') === 'true' ? 'preview' : 'cdn';
  return `https://${host}.contentful.com/spaces/${space}/environments/${environment}/entries`;
}

/** Contentful returns links separately; fold assets back into their entries. */
function resolveLinks(items: any[], includes: any): any[] {
  const assets = new Map<string, any>(
    (includes?.Asset ?? []).map((a: any) => [a.sys.id, a])
  );
  const entries = new Map<string, any>(
    (includes?.Entry ?? []).map((e: any) => [e.sys.id, e])
  );

  const resolve = (value: any): any => {
    if (Array.isArray(value)) return value.map(resolve);
    if (value?.sys?.type === 'Link') {
      const target = value.sys.linkType === 'Asset' ? assets.get(value.sys.id) : entries.get(value.sys.id);
      if (!target) return null;
      if (value.sys.linkType === 'Asset') {
        const file = target.fields?.file;
        return file?.url ? `https:${file.url}` : null;
      }
      return target.fields?.slug ?? target.sys.id;
    }
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolve(v)]));
    }
    return value;
  };

  return items.map((item) => ({
    id: item.fields?.slug ?? item.sys.id,
    fields: resolve(item.fields),
    updatedAt: item.sys.updatedAt,
  }));
}

export const contentful: ContentSource = {
  name: 'contentful',

  isConfigured: () => Boolean(env('CONTENTFUL_SPACE_ID') && env('CONTENTFUL_DELIVERY_TOKEN')),

  loader(collection: CollectionName): Loader | null {
    const contentType = CONTENT_TYPES[collection];
    if (!contentType) return null;

    return {
      name: `contentful:${collection}`,
      load: async ({ store, parseData, logger }) => {
        store.clear();

        const token =
          env('CONTENTFUL_PREVIEW') === 'true'
            ? env('CONTENTFUL_PREVIEW_TOKEN') ?? env('CONTENTFUL_DELIVERY_TOKEN')
            : env('CONTENTFUL_DELIVERY_TOKEN');

        // Contentful pages at 1000 entries; walk until we have them all.
        let skip = 0;
        let total = Infinity;

        while (skip < total) {
          const url = new URL(endpoint());
          url.searchParams.set('content_type', contentType);
          url.searchParams.set('include', '2');
          url.searchParams.set('limit', '1000');
          url.searchParams.set('skip', String(skip));

          const response = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!response.ok) {
            throw new Error(
              `[contentful] ${collection}: ${response.status} ${response.statusText}`
            );
          }

          const payload = await response.json();
          total = payload.total ?? 0;
          skip += payload.items?.length ?? 0;

          for (const entry of resolveLinks(payload.items ?? [], payload.includes)) {
            const data = await parseData({
              id: entry.id,
              data: mapEntry(collection, entry.fields),
            });
            store.set({ id: entry.id, data, digest: entry.updatedAt });
          }

          if (!payload.items?.length) break;
        }

        logger.info(`Loaded ${store.keys().length} ${collection} from Contentful`);
      },
    };
  },
};

/**
 * WordPress source, via the REST API that ships with every install.
 *
 * Set `CONTENT_SOURCE=wordpress` and `WORDPRESS_URL` (e.g. https://blog.example.com).
 * `WORDPRESS_AUTH` is only needed for private sites — pass a Basic or Bearer
 * value and it is sent as the Authorization header.
 *
 * WordPress returns rendered HTML rather than Markdown, so the body is handed
 * to Astro as pre-rendered content and `<Content />` outputs it unchanged.
 */
import type { Loader } from 'astro/loaders';

import { toText, summarize } from './html';
import { mapEntry } from './mapping';
import type { CollectionName, ContentSource } from './types';

/** Theme collection -> REST resource. Rename to match a custom post type. */
const RESOURCES: Partial<Record<CollectionName, string>> = {
  posts: 'posts',
  blogCategories: 'categories',
};

const env = (key: string) => import.meta.env[key] ?? process.env[key];

/** Walks the paginated REST collection, honouring X-WP-TotalPages. */
async function* fetchAll(base: string, resource: string, auth?: string) {
  let page = 1;
  let totalPages = 1;

  do {
    const url = new URL(`${base}/wp-json/wp/v2/${resource}`);
    url.searchParams.set('per_page', '100');
    url.searchParams.set('page', String(page));
    // Pulls the featured image, author and terms in the same request.
    if (resource === 'posts') url.searchParams.set('_embed', '1');

    const response = await fetch(url, {
      headers: auth ? { Authorization: auth } : {},
    });
    if (!response.ok) {
      throw new Error(`[wordpress] ${resource}: ${response.status} ${response.statusText}`);
    }

    totalPages = Number(response.headers.get('X-WP-TotalPages') ?? '1');
    for (const item of await response.json()) yield item;
    page += 1;
  } while (page <= totalPages);
}

/** Reshapes a REST post into this theme's post schema. */
function toPost(wp: any) {
  const embedded = wp._embedded ?? {};
  const media = embedded['wp:featuredmedia']?.[0];
  const terms = (embedded['wp:term'] ?? []).flat();
  const category = terms.find((t: any) => t?.taxonomy === 'category');
  const author = embedded.author?.[0];

  return {
    title: toText(wp.title?.rendered),
    excerpt: toText(wp.excerpt?.rendered) || summarize(wp.content?.rendered),
    category: category?.slug ?? 'uncategorized',
    author: {
      name: author?.name ?? 'Editorial',
      role: author?.description ? toText(author.description) : undefined,
      avatar: author?.avatar_urls?.['96'],
    },
    publishedAt: wp.date,
    updatedAt: wp.modified,
    image: media?.source_url,
    draft: wp.status && wp.status !== 'publish',
  };
}

export const wordpress: ContentSource = {
  name: 'wordpress',

  isConfigured: () => Boolean(env('WORDPRESS_URL')),

  loader(collection: CollectionName): Loader | null {
    const resource = RESOURCES[collection];
    if (!resource) return null;

    return {
      name: `wordpress:${collection}`,
      load: async ({ store, parseData, logger }) => {
        store.clear();

        const base = String(env('WORDPRESS_URL')).replace(/\/$/, '');
        const auth = env('WORDPRESS_AUTH');

        for await (const item of fetchAll(base, resource, auth)) {
          const id = item.slug ?? String(item.id);

          if (collection === 'blogCategories') {
            const data = await parseData({
              id,
              data: mapEntry(collection, {
                title: toText(item.name),
                description: toText(item.description) || undefined,
                order: item.count ?? 0,
              }),
            });
            store.set({ id, data });
            continue;
          }

          const data = await parseData({ id, data: mapEntry(collection, toPost(item)) });
          store.set({
            id,
            data,
            digest: item.modified,
            // WordPress gives us HTML, so hand it over already rendered.
            rendered: { html: item.content?.rendered ?? '' },
          });
        }

        logger.info(`Loaded ${store.keys().length} ${collection} from WordPress`);
      },
    };
  },
};

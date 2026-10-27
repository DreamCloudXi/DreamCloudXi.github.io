/**
 * Shopify source, via the Storefront GraphQL API.
 *
 * Set `CONTENT_SOURCE=shopify`, `SHOPIFY_STORE` (the myshopify subdomain) and
 * `SHOPIFY_STOREFRONT_TOKEN`. `SHOPIFY_BLOG_HANDLE` selects which blog to read
 * and defaults to `news`; `SHOPIFY_API_VERSION` pins the API date.
 *
 * Shopify has no equivalent of this theme's other collections, so only the blog
 * is mapped — every other collection falls back to local content.
 */
import type { Loader } from 'astro/loaders';

import { summarize, toText } from './html';
import { mapEntry } from './mapping';
import type { CollectionName, ContentSource } from './types';

const env = (key: string) => import.meta.env[key] ?? process.env[key];

const ARTICLES = `
  query Articles($handle: String!, $cursor: String) {
    blog(handle: $handle) {
      articles(first: 50, after: $cursor, sortKey: PUBLISHED_AT, reverse: true) {
        pageInfo { hasNextPage endCursor }
        edges {
          node {
            id
            handle
            title
            excerpt
            contentHtml
            publishedAt
            tags
            image { url altText }
            authorV2 { name bio }
          }
        }
      }
    }
  }
`;

async function query(variables: Record<string, unknown>) {
  const store = env('SHOPIFY_STORE');
  const version = env('SHOPIFY_API_VERSION') ?? '2024-10';
  const response = await fetch(`https://${store}.myshopify.com/api/${version}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': String(env('SHOPIFY_STOREFRONT_TOKEN')),
    },
    body: JSON.stringify({ query: ARTICLES, variables }),
  });

  if (!response.ok) {
    throw new Error(`[shopify] ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  if (payload.errors?.length) {
    throw new Error(`[shopify] ${payload.errors.map((e: any) => e.message).join('; ')}`);
  }
  return payload.data;
}

export const shopify: ContentSource = {
  name: 'shopify',

  isConfigured: () => Boolean(env('SHOPIFY_STORE') && env('SHOPIFY_STOREFRONT_TOKEN')),

  loader(collection: CollectionName): Loader | null {
    // Shopify models commerce, not a corporate site; only its blog maps here.
    if (collection !== 'posts') return null;

    return {
      name: 'shopify:posts',
      load: async ({ store, parseData, logger }) => {
        store.clear();

        const handle = env('SHOPIFY_BLOG_HANDLE') ?? 'news';
        let cursor: string | null = null;
        let hasNext = true;

        while (hasNext) {
          const data = await query({ handle, cursor });
          const articles = data?.blog?.articles;
          if (!articles) {
            throw new Error(`[shopify] no blog found with handle "${handle}"`);
          }

          for (const { node } of articles.edges) {
            const id = node.handle;
            const parsed = await parseData({
              id,
              data: mapEntry(collection, {
                title: node.title,
                excerpt: toText(node.excerpt) || summarize(node.contentHtml),
                // Shopify has no post categories; its first tag is the closest fit.
                category: node.tags?.[0]?.toLowerCase().replace(/\s+/g, '-') ?? 'uncategorized',
                author: { name: node.authorV2?.name ?? 'Editorial', role: node.authorV2?.bio },
                publishedAt: node.publishedAt,
                image: node.image?.url,
              }),
            });

            store.set({
              id,
              data: parsed,
              digest: node.publishedAt,
              rendered: { html: node.contentHtml ?? '' },
            });
          }

          hasNext = articles.pageInfo.hasNextPage;
          cursor = articles.pageInfo.endCursor;
        }

        logger.info(`Loaded ${store.keys().length} posts from Shopify`);
      },
    };
  },
};

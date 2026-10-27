/**
 * Content source resolution.
 *
 * Local Markdown, MDX and JSON is always the default: a fresh clone renders the
 * complete demo site with no configuration at all. Point `CONTENT_SOURCE` at a
 * CMS to take over one or more collections instead.
 *
 *   CONTENT_SOURCE=contentful
 *   CONTENTFUL_SPACE_ID=…
 *   CONTENTFUL_DELIVERY_TOKEN=…
 *
 * If the named source is missing credentials, or doesn't provide a particular
 * collection, that collection quietly falls back to the local files — so a
 * half-migrated site still builds.
 */
import type { Loader } from 'astro/loaders';

import { contentful } from './contentful';
import { shopify } from './shopify';
import { sanity } from './sanity';
import { strapi } from './strapi';
import { wordpress } from './wordpress';
import type { CollectionName, ContentSource } from './types';

const SOURCES: ContentSource[] = [contentful, sanity, strapi, wordpress, shopify];

const requested = (import.meta.env.CONTENT_SOURCE ?? process.env.CONTENT_SOURCE ?? 'local')
  .toLowerCase()
  .trim();

function activeSource(): ContentSource | null {
  if (requested === 'local') return null;

  const source = SOURCES.find((s) => s.name === requested);
  if (!source) {
    console.warn(
      `[content] Unknown CONTENT_SOURCE "${requested}". Expected one of: local, ${SOURCES.map((s) => s.name).join(', ')}. Using local content.`
    );
    return null;
  }
  if (!source.isConfigured()) {
    console.warn(
      `[content] CONTENT_SOURCE is "${requested}" but its credentials are missing. Using local content.`
    );
    return null;
  }
  return source;
}

const source = activeSource();

/**
 * Picks the loader for a collection: the configured CMS when it provides one,
 * otherwise the local loader passed in.
 */
export function resolveLoader(collection: CollectionName, local: Loader): Loader {
  const remote = source?.loader(collection) ?? null;
  if (!remote) return local;

  console.info(`[content] "${collection}" loading from ${source!.name}.`);
  return remote;
}

export type { CollectionName, ContentSource };

import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

import { ROUTES, SITE } from '../config/site';

/**
 * The blog feed, at /rss.xml.
 *
 * Drafts are left out, and posts are newest first. `site` comes from the Astro
 * config, so the absolute URLs follow whatever `SITE.url` is set to.
 */
export async function GET(context: APIContext) {
  const posts = await getCollection('posts', ({ data }) => !data.draft);

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site ?? SITE.url,
    trailingSlash: true,
    items: posts
      .sort((a, b) => b.data.publishedAt.valueOf() - a.data.publishedAt.valueOf())
      .map((post) => ({
        title: post.data.title,
        description: post.data.excerpt,
        pubDate: post.data.publishedAt,
        link: ROUTES.post(post.id),
        categories: [post.data.category],
        author: post.data.author.name,
      })),
    customData: `<language>${SITE.locale}</language>`,
  });
}

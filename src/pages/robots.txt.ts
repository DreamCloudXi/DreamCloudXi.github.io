import type { APIContext } from 'astro';

import { SITE } from '../config/site';

/**
 * Generated rather than dropped in `public/` so the sitemap line always points
 * at the deployed host instead of a URL that has to be edited by hand.
 */
export function GET(context: APIContext) {
  const site = context.site ?? new URL(SITE.url);

  const body = `User-agent: *
Allow: /

Sitemap: ${new URL('sitemap-index.xml', site).href}
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

# Content sources

Local files are the default and always work. A CMS is opt-in, per collection.

## How resolution works

`src/content.config.ts` wraps every collection in `resolveLoader`:

```ts
const posts = defineCollection({
  loader: resolveLoader('posts', markdown('posts')),
  schema: postSchema,
});
```

At build time `resolveLoader` asks the configured source for a loader for that
collection. It falls back to the local loader when:

- `CONTENT_SOURCE` is unset or `local`
- the named source has no credentials
- that source doesn't map the collection

Each decision is logged, so the build output tells you exactly where each
collection came from.

## Collections

| Collection | Local source | Shape |
| --- | --- | --- |
| `products` | `src/content/products/*.md` | A thing for sale |
| `productCategories` | `src/content/data/product-categories.json` | Shop taxonomy |
| `posts` | `src/content/posts/*.md` | Journal articles |
| `blogCategories` | `src/content/data/blog-categories.json` | Journal taxonomy |
| `team` | `src/content/data/team.json` | The makers |
| `reviews` | `src/content/data/reviews.json` | Customer quotes |
| `faqs` | `src/content/data/faqs.json` | Questions and answers |
| `gallery` | `src/content/data/gallery.json` | Photographs |

A Markdown collection's body is the long copy — a product's description, an
article. The JSON collections carry no body.

## Field mapping

`src/loaders/mapping.ts` reconciles CMS field names with the theme's schema.
Each schema field lists the names it will accept, in priority order:

```ts
const COMMON = {
  excerpt: ['excerpt', 'summary', 'description', 'subtitle', 'intro'],
  publishedAt: ['publishedAt', 'publishDate', 'date', 'publishedDate'],
};
```

If your Contentful model calls it `standfirst`, add it to the front of the
`excerpt` list. Fields the theme doesn't know about pass through untouched, so
schema extensions keep working.

## Images

Schemas accept either a bundled asset or an absolute URL:

```ts
const imageField = ({ image }) => z.union([image(), z.url()]);
```

Local content references a file path relative to the content file, and Astro
optimizes it at build time. CMS content returns a URL, which is used as-is.

## Connecting a platform

Five sources ship with the theme. Set `CONTENT_SOURCE` and that source's
credentials, and the collections it provides switch over. Everything it does
not provide keeps reading local files.

| `CONTENT_SOURCE` | Provides | Body format |
| --- | --- | --- |
| `local` *(default)* | everything | Markdown / MDX |
| `contentful` | products, posts, team, reviews, faqs, gallery, both taxonomies | Markdown |
| `sanity` | same as Contentful | Markdown |
| `strapi` | same as Contentful | Markdown |
| `wordpress` | posts, blog categories | **HTML** |
| `shopify` | posts (from a blog) | **HTML** |

### WordPress

Works against the REST API that ships with every install — no plugin needed.

```sh
CONTENT_SOURCE=wordpress
WORDPRESS_URL=https://blog.example.com
# WORDPRESS_AUTH=Basic dXNlcjpwYXNzd29yZA==   # private sites only
```

The loader requests `_embed`, so the featured image, author and categories
arrive with the post rather than as extra round trips, and it follows
`X-WP-TotalPages` to page through everything.

Mapping is in `src/loaders/wordpress.ts`:

| Theme field | WordPress |
| --- | --- |
| `title` | `title.rendered`, tags stripped |
| `excerpt` | `excerpt.rendered`, or the first 160 characters of the body |
| `category` | first embedded `category` term's slug |
| `author` | embedded author's name, description and 96px avatar |
| `publishedAt` | `date` |
| `image` | embedded featured media `source_url` |
| body | `content.rendered` |

**Custom post types** work by changing one line — point `RESOURCES` at your
type's REST base:

```ts
const RESOURCES = { posts: 'case-studies', blogCategories: 'categories' };
```

Map a WordPress type onto `products` the same way, adding the collection name
and its REST base to that object.

### Shopify

Reads a blog through the Storefront GraphQL API.

```sh
CONTENT_SOURCE=shopify
SHOPIFY_STORE=your-store            # the myshopify subdomain
SHOPIFY_STOREFRONT_TOKEN=xxxx
# SHOPIFY_BLOG_HANDLE=news          # defaults to "news"
```

The loader as shipped maps **only the blog** — every other collection keeps
reading local files. Shopify models this theme’s shop closely, though, so the
product query is the obvious next addition; `docs/commerce.md` says where. Articles have no categories,
so the first tag becomes the category.

To pull products into a collection, add a query for them in
`src/loaders/shopify.ts` and map the fields onto whichever schema fits. Note the
Storefront API is public by design: the token is safe in a build environment,
but do not use an Admin API token here.

### HTML bodies

WordPress and Shopify return **rendered HTML**, not Markdown. A loader hands
that to Astro already rendered:

```ts
store.set({
  id,
  data,
  rendered: { html: post.content.rendered },   // <Content /> outputs this as-is
});
```

Two consequences worth knowing:

- The theme's prose styles apply to whatever tags the platform emits. WordPress
  block markup carries its own classes; if something looks off, style it
  alongside the rules in `src/styles/prose.css`.
- That HTML is rendered without escaping, so it must come from a source you
  control. This is the same trust model as any headless CMS.

Titles and excerpts are different — they go into a schema as plain text, so the
helpers in `src/loaders/html.ts` strip tags and decode entities first.

### Images

Remote sources return URLs, and the schema accepts either:

```ts
const imageField = ({ image }) => z.union([image(), z.url()]);
```

Local files are optimised at build time. Remote URLs are used as-is, because
Astro cannot resize an image it has not downloaded. To optimise them too, add
the hostname to `image.domains` or `image.remotePatterns` in `astro.config.ts`.

## Adding a source

Implement `ContentSource` from `src/loaders/types.ts`:

```ts
export const myCms: ContentSource = {
  name: 'mycms',
  isConfigured: () => Boolean(process.env.MYCMS_TOKEN),
  loader(collection) {
    const type = TYPES[collection];
    if (!type) return null;             // fall back to local files
    return {
      name: `mycms:${collection}`,
      load: async ({ store, parseData }) => {
        store.clear();
        for (const entry of await fetchEntries(type)) {
          const data = await parseData({
            id: entry.slug,
            data: mapEntry(collection, entry),
          });
          store.set({ id: entry.slug, data });
        }
      },
    };
  },
};
```

Then add it to `SOURCES` in `src/loaders/index.ts`. The three built-in loaders
are around 100 lines each and are meant to be copied.

## Live content

For content that must be current at request time rather than build time, Astro
supports live collections in `src/live.config.ts`. That needs a server adapter
and pages marked `export const prerender = false`.

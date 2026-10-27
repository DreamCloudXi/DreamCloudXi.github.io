# Selling things

This theme ships a shop. It does not ship a checkout, and the difference is
deliberate.

A static site has no server. There is nothing to receive a card number, nothing
to hold a basket between two page loads and nothing to charge anybody. A theme
that shipped a checkout page anyway would be shipping a form that collects a
card number and does nothing with it, which is worse than being plain about
where the site stops.

So the export's `checkout.html`, `paypal-checkout.html` and
`order-confirmation.html` are not built. Everything up to that point is:

| Page | Route |
| --- | --- |
| The shop | `/shop/` |
| A category | `/product-categories/<slug>/` |
| A product | `/products/<slug>/` |
| The cart panel | in the header, on every page |

## What Add to Cart actually is

Every Add to Cart in the theme — on the product page, and the bag on every
product card — is a real `<form>` carrying everything a cart provider needs:

```html
<form method="post" action="#" data-add-to-cart>
  <input type="hidden" name="id"       value="HS-CER-002" />
  <input type="hidden" name="name"     value="Handmade Clay Vase" />
  <input type="hidden" name="price"    value="42" />
  <input type="hidden" name="currency" value="USD" />
  <input type="hidden" name="url"      value="/products/handmade-clay-vase/" />
  <input type="hidden" name="quantity" value="1" />
  <button type="submit">Add to Cart</button>
</form>
```

The price is a number, not a formatted string, so nothing downstream has to
parse `$ 42.00 USD` back into `42`. The currency is one setting in
`src/config/site.ts` and every price on the site is formatted from it.

Nothing answers the POST. The form is there so that attaching a provider is a
matter of adding their script and renaming a few attributes — no markup to
rewrite, no components to fork.

## Snipcart

Snipcart reads its own attributes off a button. Edit
`src/components/shop/ProductCard.astro` and the form on
`src/pages/products/[slug].astro`:

```astro
<button
  type="submit"
  class="snipcart-add-item"
  data-item-id={sku}
  data-item-name={title}
  data-item-price={price}
  data-item-url={ROUTES.product(product.id)}
  data-item-image={images[0].src}
>
```

Then add their script to `src/layouts/BaseLayout.astro` and give the header's
cart button `class="snipcart-checkout"`, its count `class="snipcart-items-count"`
and its subtotal `class="snipcart-total-price"` — the elements are already
marked `data-cart-toggle`, `data-cart-count` and `data-cart-total`, so they are
easy to find.

The panel's line list starts `hidden` and the empty state starts visible. A
provider that writes lines into `[data-cart-lines]` should remove the `hidden`
attribute from it and add one to `[data-cart-empty]`; with nothing attached the
panel simply says the cart is empty, which is true.

## Shopify Buy Button

Keep the form and let Shopify's SDK intercept the submit, or replace the
`<button>` with their generated embed. Either way the product data stays in
`src/content/products` and the Buy Button only needs the variant id — add it to
the product schema as `variantId` and render it into the form.

## Loading the catalog from Shopify instead

`src/loaders/shopify.ts` already exists. Set `CONTENT_SOURCE=shopify` with
`SHOPIFY_STORE` and `SHOPIFY_STOREFRONT_TOKEN` and the collections load from
there; it currently maps the blog, and the product query is the obvious next
addition. See `docs/content-sources.md`.

## The gift card and personalization pages

Both are forms, and neither takes a payment. The gift card page lists the
denominations and the personalization page collects what should be lettered and
who it is for; the studio replies with a proof. Point their `action` at a form
service — see `docs/forms.md` — or at your cart provider's own gift card
product, whichever fits.

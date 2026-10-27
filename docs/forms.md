# Forms

Three forms ship with the theme: the newsletter in the footer, the contact form,
and the personalization request. All three run through one handler,
`initForms` in `src/scripts/components.ts`.

## How they behave out of the box

With no `action` set, the handler validates the fields, resets the form, hides
it and shows the thank-you panel in its place. Nothing is sent anywhere. That is
what a demo should do: the flow is complete and honest, and nobody's address
ends up in a log somewhere.

## Making one real

Give the form an `action` and, if you want, a `method`:

```astro
<form class="contact-wrap" name="contact" action="https://formspree.io/f/xxxx" data-contact-form>
```

The handler posts a `FormData` with `Accept: application/json` and shows the
error panel if the response is not ok. That is the shape Formspree, Basin,
Netlify Forms and Web3Forms all accept.

## The markup the handler looks for

| Attribute | On |
| --- | --- |
| `data-newsletter` or `data-contact-form` | the `<form>` |
| `data-newsletter-success` / `data-form-success` | the thank-you panel, `hidden` |
| `data-newsletter-error` / `data-form-error` | the error panel, `hidden` |

Both panels must start with the `hidden` attribute. `additions.css` gives them a
`display` so that removing `hidden` is enough to show them — the design's own
rule hides them unconditionally, which is how the builder's runtime wanted it.

## Spam

None of these has a honeypot or a captcha. Every service above provides one;
turn it on there rather than in the markup, where it is easy to get wrong and
easy to break for a screen reader.

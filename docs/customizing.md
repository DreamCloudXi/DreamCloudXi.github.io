# Customizing

## Retheming in one file

`src/styles/theme.css` is the whole design system. Every color, type size,
radius and spacing rhythm in the theme resolves to a custom property defined
there.

Swapping the palette:

```css
:root {
  --color-primary: #3d5a33;    /* buttons, links, the green in the design */
  --color-secondary: #8baf7e;  /* the fill a button hovers to */
  --color-ink: #1d1914;        /* headings and anything dark */
  --color-ash: #666666;        /* body copy */
  --color-background: #f9f4ea; /* page ground */
  --color-light-lite: #f1ede2; /* cards and panels */
}
```

The responsive tokens — every size that changes across breakpoints — are
corrected in `src/styles/additions.css` rather than in `theme.css`; the
generated file emits them in an order that does not cascade. Change them there.

Nothing else needs to change. The style guide at `/style-guide` renders from
these same tokens, so it is the fastest way to see the effect.

## Responsive type and rhythm

The type scale and section spacing are responsive at the token level:

```css
:root { --size-h1: 64px; --section-space: 100px; }

@media screen and (max-width: 767px) {
  :root { --size-h1: 40px; --section-space: 60px; }
}
```

Because of that, components use `text-h1` or the section spacing token with no breakpoint
variants, and a heading resizes correctly wherever it appears. To make the whole
site tighter on mobile, change the token — not the components.

## Breakpoints

Tailwind's breakpoints are set to the design's own tiers, so `max-lg:`,
`max-md:` and `max-sm:` line up exactly with the original stylesheet:

| Variant | Applies |
| --- | --- |
| `max-sm:` | ≤ 479px |
| `max-md:` | ≤ 767px |
| `max-lg:` | ≤ 991px |
| `xl:` | ≥ 1280px |
| `2xl:` | ≥ 1440px |
| `3xl:` | ≥ 1920px |

## Component classes

Component classes such as `.header-block` and `.pricing-card` live in
`src/styles/components.css`, in the `components` cascade layer. Two consequences
worth knowing:

1. **Every class always exists**, whether or not the theme currently uses it. You
   can add `class="pricing-card"` to your own markup, or compose a class name at
   runtime, and it works.
2. **Tailwind utilities still win**, because the utilities layer comes after.
   `class="header-block mt-8"` does what you would expect.

`components.css` is generated from the original design. To change a component,
add an override in `src/styles/additions.css` rather than editing the generated
file.

## Icons

Drop any SVG into `src/icons/` and render it by file name:

```astro
<Icon name="my-icon" class="some-class" />
<Icon name="my-icon" label="Open menu" />   <!-- adds role and label -->
```

Icons inherit `currentColor`, so they take the color of whatever contains them.
Without a `label` they are marked decorative and hidden from screen readers.

## Adding a page

Create a file in `src/pages/`, wrap it in `BaseLayout`, and compose the sections
you need:

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import PageHero from '../components/sections/PageHero.astro';
import Cta from '../components/sections/Cta.astro';
import { ROUTES } from '../config/site';
---

<BaseLayout title="Careers" description="Open roles across the group.">
  <PageHero
    breadcrumb={[{ label: 'Home', href: ROUTES.home }, { label: 'Careers' }]}
    title="Work with us"
    excerpt="Roles across thirty countries."
  />
  <Cta />
</BaseLayout>
```

Add the route to `ROUTES` in `src/config/site.ts` and to the menus in
`src/config/navigation.ts` so it appears in the nav.

## Forms

The newsletter and contact forms post to whatever `action` you give them, and
show their success and error states in place:

```astro
<ContactForm action="https://formspree.io/f/your-id" />
```

With no `action` the form validates and confirms locally, which is how the demo
behaves. Wiring is in `src/scripts/components.ts`.

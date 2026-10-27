# Notes on the converter

Things `themeconv` did to this export that cost time, each one checked against
the export before it was written down. Nothing here is a complaint about the
tool; it is the list of what the next conversion should expect.

## 1. `text-[var(--x)]` loses every font size

**Where:** `css-to-tailwind.mjs`, in the declaration mapper.

Tailwind's `text-` utility is ambiguous — it sets either a font size or a
color — and with a bare `var()` it cannot tell which. It guesses color. So
every rule the converter emitted as

```css
@apply text-[var(--_typography---text-medium--size)];
```

compiled to nothing at all, and there were **45 of them**. All 45 were the
design's body size, so the theme rendered 16px type at 18px — which changed the
line count of most paragraphs on the site and every grid row that sized to
them. The style gate does not compare `font-size`, so it showed up only as
row heights being a few pixels out, on page after page.

The fix is the type hint the utility takes:

```css
@apply text-[length:var(--_typography---text-medium--size)];
```

Applied by hand to `components.css`, which is regenerated — so it will need
applying again, or fixing at the source. A color is the right guess for
`text-[var(--color-…)]`, of which there were 34 here, and those were fine.

## 2. `theme.css` emits its breakpoint blocks in the order it met them

**Where:** `tokens.py`.

Media queries carry no specificity, so the last matching block wins. The
generated `:root` cascade was written as: unconditional, `min-width: 1920px`,
`min-width: 1440px`, `max-width: 767px`, `max-width: 991px` — and the
unconditional values were the **narrowest** screen's, not the design's default.

Both halves of that are wrong, and they compound:

| Viewport | Export | Theme |
| --- | --- | --- |
| 390px | 430px | 768px |
| 700px | 630px | 768px |
| 1200px | 1232px | 430px |
| 1920px | 1832px | 1372px |

Fifteen tokens vary across breakpoints here, `--container-size` among them, so
the page gutter was wrong at four of the five widths the design draws for.
Corrected in `additions.css` by restating the whole cascade with the default
first and the narrowest query last.

Worth noting that the *same* values are emitted correctly into `global.css`'s
`@layer base body` block, in the right order. Only the `:root` copy in
`theme.css` is wrong — and it is the copy the components read.

## 3. `--family-heading` and `--family-body` are referenced and never defined

**Where:** `css-to-tailwind.mjs`, `rewriteVars`.

A rule asking for a face by role — the export's
`font-family: var(--_typography---heading-04--font)` — is rewritten to
`var(--family-heading)`. Nothing defines that name. Fifty-six rules in
`components.css` referenced one of the two: every `h4`, `h5` and `h6` on the
site, and the whole of the style guide, silently falling through to the system
sans. Aliased in `additions.css`.

## 4. The generated sheet is alphabetized, which reverses two cascades

**Where:** `css-to-tailwind.mjs`, on output.

The export loads `.w-layout-blockcontainer`, `.w-layout-grid` and the commerce
classes first and overrides them with the design's own classes afterwards.
Sorted by name, `w-*` lands last and wins instead.

The visible cost: every page gutter collapsed to the builder's default 940px
rather than the design's 1232px, and the two grids carrying `w-layout-grid` —
the mega menu and the style guide — took its two columns and 16px gap in place
of their own. Repaired by re-opening `@layer components` in `additions.css`,
which appends after the generated file without promoting the rules above
Tailwind's utilities.

## 5. `grid-cols-N` is not `1fr 1fr 1fr`

Known and documented, and it bit here too: `grid-cols-3` is
`repeat(3, minmax(0, 1fr))`, and `minmax(0, 1fr)` lets a column shrink below its
content. Thirty rules restated at the value the export wrote. The style gate
reports these plainly, which is the only reason they were cheap.

## 6. `ix-spec.mjs` decoded a payload this export does not use

**Where:** `ix-spec.mjs`.

It reads the IX2 block out of `webflow.js`. This export is IX3: its motion is
declared as `wf:attribute` targets against `[hero-animation]`,
`[text-animation]`, `[card-animation]` and four more, registered through
`Webflow.require("ix3").getInstance().register(...)`.

The IX2 block is still present — left over, and belonging to some other site.
It decoded cleanly and produced 85KB of plausible-looking spec naming
`.nav-menu-border`, `.cross-icon` and `.secondary-button-icon`, none of which
exist in this design, with a swatch called `--0-main-colors--primary` that is
pink where this theme's primary is green.

That is exactly the failure the script's own header warns about, one level
deeper: the payload parses, the output looks right, and nothing in it names the
theme it came from. The real spec is nine interactions and eight timelines, and
`src/scripts/motion.ts` is written from it.

## 7. The style gate is blind to this export unless jQuery is local

Not a converter fault, but it decides whether the gate means anything.

`gates/collect.mjs` blocks every external request, which is right. This export
loads jQuery from a CDN, and the builder's runtime needs it: without it
`webflow.js` throws before IX3 initializes, and the `visibility: hidden` it puts
on every animated element is never lifted. On `privacy-policy` that left the
export side with **13 visible nodes against the theme's 71**, reported as 446%
of blocks differing — noise that would drown any real finding on every page.

Development was therefore done against a copy of the export with jQuery, GSAP,
Lenis and the Manrope woff2 vendored into it, which renders the reference page
the way a browser with a network would. Against that copy the theme matches
structurally on every page. The recorded baseline in `accepted.json` is from the
run against the export as shipped, so it carries the hidden-element differences
as well.

Two smaller things in the same area:

- The collector records an element as visible when its parent is
  `display: none` — `getComputedStyle` on a child of a hidden parent returns the
  child's own specified `display`, not `none`. A hidden panel therefore vanishes
  from the tree while its contents stay, which reads as "this wrapper is missing
  from the theme" when the wrapper is simply closed.
- The export's own fonts come from Google. Blocked, the reference page lays out
  in a fallback face and wraps its text differently, which shows up as every
  grid row being a few pixels out.

## 8. Small things

- **The asset map is keyed by the file on disk.** Four images in this export are
  referenced as `Sarah-Mitchell_1Sarah-Mitchell.avif` and saved as
  `Sarah-Mitchell_1Sarah Mitchell.avif` — a hyphen in the markup, a space in the
  file. `asset-map.json` has no entry for the spelling the markup uses.
- **`behavior.css`'s inferred display list was right this time.** Three entries,
  all three correct, all three `:where()`-wrapped. Worth saying, given the
  warning.
- **Three variants came through unnamed.** Only one is used in the markup
  (`is-variant-f8e63311`, the dark button whose hover fills green); it is
  renamed `is-ink` in `components.css` and in the `@source` list in `global.css`.
  The other two are unused by any page in the export.

## What the gate's baseline accepts

`.themeconv/` is git-ignored, so the page map and the accepted baseline do not
travel with the theme. The reasoning is worth keeping, so here it is.

Against the export with its runtime working, `structure` matches on every page
but the ones below, `style` reports fifteen findings at three widths — all of
them `grid-template-rows`, the row heights of a grid holding a different number
of items than the export's sample content — and `overflow` is clean at 1440,
900 and 390.

The differences that remain, and why each is deliberate:

| Difference | Why |
| --- | --- |
| `_404-*` → `error-*` | The converter renames a class that cannot start a Tailwind utility. |
| `button` → `button.ink`, `.coffee`, `.link`; `section-info` → `.white`; `hero-info-link` → `.cms` | The builder expressed these as opaque variant classes, which the gate filters as vendor. Named here, they read as a difference. |
| `product-tab-pane` → `.tab-active`, `product-tab-link` → `.current` | Same thing: `w--tab-active` and `w--current` are filtered, the theme's own state classes are not. |
| A carousel dot marked `current` | The slider marks the dot for the slide on screen. The builder's runtime drew no dots into the markup at all. |
| Twelve products where the export lists six, three per category where it lists six, two articles in a category where it lists six | The theme ships a catalog rather than the same six cards repeated. Every card is the same component. |
| One hero image and then the article body, where the export interleaves three rich-text blocks and two images | Images inside an article belong to the article, not to the template. |
| Line counts inside a split heading | `SplitText` wraps each line, so a sentence of a different length produces a different number of wrappers. |

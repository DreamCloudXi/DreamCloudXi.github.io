# License

## The theme

The code in this repository — templates, components, scripts and stylesheets —
is licensed to the purchaser for use on their own projects, under the terms of
the marketplace listing it was bought from.

Everything below is third-party. Check that each one covers the way you intend
to use it before you launch, and replace anything that does not.

## Fonts

Both families are served from your own domain, so the deployed site makes no
third-party request for them. Each family's own license governs redistribution —
bundling a font inside a template you sell is a narrower permission than using
it on a site, and the two are licensed separately by most foundries. Check each
one against how you intend to distribute this theme.

| Family | Used for | License | Where it comes from |
| --- | --- | --- | --- |
| [Libre Baskerville](https://fonts.google.com/specimen/Libre+Baskerville) | Headings | SIL Open Font License 1.1 | Ships in `src/assets/fonts` |
| [Manrope](https://fonts.google.com/specimen/Manrope) | Body copy | SIL Open Font License 1.1 | Fetched once at build time and self-hosted |

The export also referenced Lato, but only from the page builder's own commerce
stylesheet, which this theme does not ship. No Lato file is included.

## Demo photography and video

**The images in `src/assets/images` and any video in `public/videos` are
placeholders.** They came with the original design and are stock, licensed to
whoever made it. That license very likely covers using them on a site, and very
likely does not cover redistributing them inside something you sell.

They come from [Freepik](https://www.freepik.com), and Freepik's own terms
govern them. Those terms turn on which Freepik plan the files were obtained
under and how you intend to use them: depending on the plan, using them on a
live site may require attribution to Freepik, and redistributing them inside a
template or theme is restricted separately from using them yourself.

- **Building a site with this theme** — replace the demo images with your own
  photography, or with files you have licensed yourself. This is the expected
  path, and it sidesteps the question entirely.
- **Redistributing the theme** — do not pass the Freepik files on. Check your
  own Freepik license before including them in anything you share or sell.

Every image lives in `src/assets/images`, and any video in `public/videos`.
Both are referenced by name from the content collections, so swapping a file
for one of your own keeps the layout intact.

## Libraries

| Library | Used for | License |
| --- | --- | --- |
| [Astro](https://astro.build) | The framework | MIT |
| [Tailwind CSS](https://tailwindcss.com) | The utility layer | MIT |
| [GSAP](https://gsap.com) with ScrollTrigger and SplitText | The motion layer | [GSAP standard license](https://gsap.com/licensing/) |
| [Lenis](https://github.com/darkroomengineering/lenis) | Smooth scrolling | MIT |
| [sharp](https://sharp.pixelplumbing.com) | Build-time image encoding | Apache-2.0 |

GSAP's terms changed in 2025 and the plugins this theme uses are now part of the
standard license, but check the current terms for your own case — particularly
if the site charges for access.

## Icons

The SVGs in `src/icons` were drawn for this design and ship with the theme. Use,
edit and redistribute them as part of a site built on it.

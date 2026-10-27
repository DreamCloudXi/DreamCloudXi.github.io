/**
 * Site-wide configuration.
 * Edit this file first when setting the theme up for a new project.
 */
export const SITE = {
  /** Absolute URL of the deployed site. Used for canonical URLs and the sitemap. */
  url: 'https://handspark-astro-preview.tncflow.com',
  name: 'Handspark',
  title: 'Handspark',
  titleTemplate: '%s — Handspark',
  description:
    'A shop for handmade art, prints and personalized gifts — every piece made to order by a small studio of makers.',
  /** Default social sharing image, relative to /public. 1200x630. */
  ogImage: '/og-image.jpg',
  /** Square mark used for the Organization structured data. */
  logo: '/webclip.jpg',
  locale: 'en',
  themeColor: '#3d5a33',
  /** The currency every price on the site is quoted in. */
  currency: 'USD',
  currencySymbol: '$',
  /**
   * Attribution in the footer's bottom row. Set `credit` to null to drop the
   * line entirely.
   */
  credit: {
    prefix: 'Designed by',
    label: 'TNCFlow',
    href: 'https://www.tncflow.com',
  },
  /** Shown in the footer and on the contact page. */
  contact: {
    phone: '(704) 555-0148',
    phoneHref: 'tel:+17045550148',
    email: 'hello@handspark.example.com',
    address: '118 Kiln Row, Asheville, North Carolina 28801',
    hours: 'Studio open Tuesday to Saturday, 10am to 6pm',
  },
  /**
   * The returns panel on every product page. One policy, written once — a shop
   * whose terms differ per product would move this into the product schema.
   */
  returns: [
    'Returns and exchanges within fourteen days',
    'The piece must be unused and in its original packaging',
    'Personalized work cannot be returned once it is lettered',
    'Return postage is the buyer’s unless the piece arrived damaged',
    'Refunds are issued within three days of the piece arriving back',
  ],
  social: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/', icon: 'linkedin' },
    { label: 'Facebook', href: 'https://www.facebook.com/', icon: 'facebook' },
    { label: 'Instagram', href: 'https://www.instagram.com/', icon: 'instagram' },
    { label: 'X', href: 'https://x.com/', icon: 'x' },
  ],
} as const;

/**
 * Every route the theme renders. Keeping them in one place means a rename is a
 * one-line change rather than a search across templates.
 */
export const ROUTES = {
  home: '/',
  about: '/about/',
  shop: '/shop/',
  product: (slug: string) => `/products/${slug}/`,
  productCategory: (slug: string) => `/product-categories/${slug}/`,
  blog: '/blog/',
  post: (slug: string) => `/blog/${slug}/`,
  postCategory: (slug: string) => `/blog-categories/${slug}/`,
  gallery: '/photo-gallery/',
  faq: '/faq/',
  giftCards: '/gift-and-gift-card/',
  personalize: '/personalize-your-gift/',
  privacy: '/privacy-policy/',
  contact: '/contact/',
  styleGuide: '/style-guide/',
  licenses: '/licenses/',
  changelog: '/changelog/',
  instructions: '/instructions/',
  externalLink: '/external-link/',
  notFound: '/404',
} as const;

/** The bar across the top: five links and a mega menu behind "Pages". */
export const NAV = [
  { label: 'Home', href: ROUTES.home },
  { label: 'About', href: ROUTES.about },
  { label: 'Shop', href: ROUTES.shop },
  { label: 'Blog', href: ROUTES.blog },
  { label: 'Contact', href: ROUTES.contact },
] as const;

/** The "Pages" mega menu, which the design lays out as a single column list. */
export const MEGA_MENU = [
  { label: 'About', href: ROUTES.about },
  { label: 'Blog', href: ROUTES.blog },
  { label: 'Shop', href: ROUTES.shop },
  { label: 'Contact', href: ROUTES.contact },
  { label: 'Photo Gallery', href: ROUTES.gallery },
  { label: 'FAQ', href: ROUTES.faq },
  { label: 'Gift & Gift Card', href: ROUTES.giftCards },
  { label: 'Privacy & Policy', href: ROUTES.privacy },
  { label: 'Personalize Your Gift', href: ROUTES.personalize },
  { label: '404', href: ROUTES.notFound },
] as const;

/** The footer's three link columns. */
export const FOOTER_NAV = [
  {
    title: 'Main Pages',
    links: [
      { label: 'Home', href: ROUTES.home },
      { label: 'About', href: ROUTES.about },
      { label: 'Shop', href: ROUTES.shop },
      { label: 'Contact', href: ROUTES.contact },
    ],
  },
  {
    title: 'Quick Links',
    links: [
      { label: 'Blog', href: ROUTES.blog },
      { label: 'FAQ', href: ROUTES.faq },
      { label: 'Photo Gallery', href: ROUTES.gallery },
      { label: 'Privacy Policy', href: ROUTES.privacy },
    ],
  },
  {
    title: 'Utility Pages',
    links: [
      { label: '404', href: ROUTES.notFound },
      { label: 'Licenses', href: ROUTES.licenses },
      { label: 'Style Guide', href: ROUTES.styleGuide },
      { label: 'Change-Log', href: ROUTES.changelog },
    ],
  },
] as const;

/**
 * Site-wide configuration.
 * Edit this file first when setting the theme up for a new project.
 */
export const SITE = {
  /** Absolute URL of the deployed site. Used for canonical URLs and the sitemap. */
  url: 'https://mobellling.github.io',
  name: 'DreamCloudXi',
  title: 'DreamCloudXi',
  titleTemplate: '%s — DreamCloudXi',
  description: 'DreamCloudXi 的个人博客，记录学习、思考与生活。',
  /** Default social sharing image, relative to /public. 1200x630. */
  ogImage: '/og-image.jpg',
  /** Square mark used for the Organization structured data. */
  logo: '/webclip.jpg',
  locale: 'zh-CN',
  themeColor: '#252525',
  /** The currency every price on the site is quoted in. */
  currency: 'CNY',
  currencySymbol: '¥',
  /**
   * Attribution in the footer's bottom row. Set `credit` to null to drop the
   * line entirely.
   */
  credit: {
    prefix: '由',
    label: '晓钟Mobell 维护',
    href: 'https://mobellling.github.io/',
  },
  /** Shown in the footer and on the contact page. */
  contact: {
    phone: '', phoneHref: '', email: 'mobellling@outlook.com',
    address: '', hours: '',
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
  { label: '首页', href: ROUTES.home },
  { label: '博客', href: ROUTES.blog },
  { label: '关于', href: ROUTES.about },
  { label: '联系', href: ROUTES.contact },
] as const;

/** The "Pages" mega menu, which the design lays out as a single column list. */
export const MEGA_MENU = [
  { label: '关于我', href: ROUTES.about },
  { label: '博客', href: ROUTES.blog },
  { label: '联系我', href: ROUTES.contact },
  { label: '照片', href: ROUTES.gallery },
  { label: '常见问题', href: ROUTES.faq },
  { label: '隐私政策', href: ROUTES.privacy },
  { label: '404', href: ROUTES.notFound },
] as const;

/** The footer's three link columns. */
export const FOOTER_NAV = [
  {
    title: '主要页面',
    links: [
      { label: '首页', href: ROUTES.home },
      { label: '关于我', href: ROUTES.about },
      { label: '博客', href: ROUTES.blog },
      { label: '联系我', href: ROUTES.contact },
    ],
  },
  {
    title: '更多内容',
    links: [
      { label: '博客', href: ROUTES.blog },
      { label: '照片', href: ROUTES.gallery },
      { label: '隐私政策', href: ROUTES.privacy },
    ],
  },
  {
    title: '其他',
    links: [
      { label: '404', href: ROUTES.notFound },
      { label: '许可说明', href: ROUTES.licenses },
      { label: '样式指南', href: ROUTES.styleGuide },
      { label: '更新记录', href: ROUTES.changelog },
    ],
  },
] as const;

# 博客使用指南

## 写文章

在 `src/content/posts/` 新建 `.md` 文件，frontmatter 使用 my-astrowind 的格式：

```yaml
---
publishDate: 2026-11-06T08:00:00Z
updateDate: 2026-11-06T08:00:00Z
author: 晓钟 Mobell
title: 文章标题
excerpt: 列表页显示的摘要
image: /images/cover.webp
imageAlt: 封面图描述
category: Technology
tags: [Astro, 博客]
draft: false
---
```

正文直接写 Markdown。图片放在 `public/images/`，引用时使用 `/images/文件名`；也可以使用绝对图片 URL。

## 本地运行

```bash
npm install
npm run dev
```

打开终端提示的地址，一般是 `http://localhost:4321/`。发布前运行 `npm run check` 和 `npm run build`。

## 修改站点信息

编辑 `src/config/site.ts`，修改站点名、描述、域名、社交链接和导航。首页文案在 `src/pages/index.astro`，博客列表标题在 `src/components/blog/BlogIndex.astro`。

## 发布

执行 `npm run build` 生成 `dist/`，再按现有 `docs/deployment.md` 部署到 Cloudflare Pages、Vercel 或静态服务器。

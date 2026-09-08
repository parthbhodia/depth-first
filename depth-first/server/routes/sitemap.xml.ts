import { problems } from '#content/index.js'

export default defineEventHandler((event) => {
  const base = useRuntimeConfig().public.siteUrl.replace(/\/$/, '')
  const today = new Date().toISOString().slice(0, 10)

  const urls = [
    { loc: `${base}/`, priority: '1.0' },
    { loc: `${base}/about`, priority: '0.5' },
    ...problems.map((p: { slug: string }) => ({
      loc: `${base}/problems/${p.slug}`,
      priority: '0.9',
    })),
  ]

  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${u.loc}</loc><lastmod>${today}</lastmod><priority>${u.priority}</priority></url>`
  )
  .join('\n')}
</urlset>
`
})

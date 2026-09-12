import { problems } from '#content/index.js'

/**
 * /llms-full.txt — the teaching content of every problem as plain text, in
 * page order: prerequisites, statement, then each approach's intuition,
 * numbered algorithm and complexity, then failure modes and what comes next.
 * The traces themselves are interactive and are not reproduced here.
 */
const strip = (html: unknown) => String(html || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

export default defineEventHandler((event) => {
  const base = useRuntimeConfig().public.siteUrl.replace(/\/$/, '')
  setHeader(event, 'content-type', 'text/plain; charset=utf-8')

  const out: string[] = [
    '# Depth First — full text',
    '',
    'Interactive, step-by-step traces of interview algorithms. This file carries the written teaching content of every problem page; the traces, tours and lessons are interactive at the URLs given.',
    '',
  ]

  for (const p of problems as any[]) {
    const name = p.number ? `${p.title} (LeetCode ${p.number})` : p.title
    out.push(`# ${name}`, '', `URL: ${base}/problems/${p.slug}`, `Difficulty: ${p.difficulty}. Pattern: ${p.pattern}. Topics: ${p.topics.join(', ')}.`, '', strip(p.blurb), '')
    if (p.prerequisites?.length) {
      out.push('## Prerequisites', '', ...p.prerequisites.map((q: any) => `- ${q.title}: ${strip(q.note)}`), '')
    }
    if (p.statement?.length) out.push('## Problem', '', ...p.statement.map(strip), '')
    if (p.examples?.length) out.push('## Examples', '', ...p.examples.map((e: any) => `- Input: ${strip(e.input)} → Output: ${strip(e.output)}`), '')
    p.approaches.forEach((a: any, i: number) => {
      out.push(`## Approach ${i + 1}: ${a.name}`, '', strip(a.tagline), '')
      if (a.intuition) out.push('### Intuition', '', strip(a.intuition), '')
      if (a.algorithm?.length) out.push('### Algorithm', '', ...a.algorithm.map((s: string, k: number) => `${k + 1}. ${strip(s)}`), '')
      if (a.idea) out.push('### The idea', '', strip(a.idea), '')
      out.push(`Time: ${a.time}. Space: ${a.space}.${a.spaceNote ? ' ' + strip(a.spaceNote) : ''}`, '')
    })
    if (p.traps?.items?.length) {
      out.push(`## ${strip(p.traps.heading)}`, '', ...p.traps.items.map((t: any) => `- ${strip(t.title)}: ${strip(t.body)}`), '')
    }
    if (p.next?.items?.length) {
      out.push(`## ${strip(p.next.heading)}`, '', ...p.next.items.map((n: any) => `- ${n.num ? `LeetCode ${n.num} — ` : ''}${n.title}: ${strip(n.note)}`), '')
    }
    if (p.interview?.html) out.push('## In an interview', '', strip(p.interview.html), '')
  }

  return out.join('\n')
})

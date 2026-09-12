import { problems } from '#content/index.js'

/**
 * /llms.txt — the site described for language models, per the llms.txt
 * convention: a short summary, then a linked index of the pages that matter.
 * Generated from the registry so it can never list a problem that is not there.
 */
const strip = (html: unknown) => String(html || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

export default defineEventHandler((event) => {
  const base = useRuntimeConfig().public.siteUrl.replace(/\/$/, '')
  setHeader(event, 'content-type', 'text/plain; charset=utf-8')

  const entries = (problems as any[]).map((p) => {
    const name = p.number ? `${p.title} (LeetCode ${p.number})` : p.title
    const approaches = p.approaches.map((a: any) => a.name).join(', ')
    return `- [${name}](${base}/problems/${p.slug}): ${strip(p.blurb)} Pattern: ${p.pattern}. Approaches traced: ${approaches}. Languages: Python, JavaScript, Java, C++.`
  })

  return [
    '# Depth First',
    '',
    '> Interactive, step-by-step traces of interview algorithms. Each problem is instrumented so you can watch the recursion tree grow, the call stack push and pop, and the state change one step at a time, with the matching source line highlighted in Python, JavaScript, Java and C++.',
    '',
    'Every problem page follows the same flow: prerequisites (linked to the pages that teach them), the intuition and a numbered algorithm for each approach, a live trace with a "key moments" grain and an "every step" grain, guided tours that land on the frames that matter, essays on the shape of the solution, common failure modes, the next problems in the family, and what to say in an interview. Backtracking problems carry the two-question framing in the code itself: Q1 — is the answer complete? Q2 — what choices do I have?',
    '',
    '## Problems',
    '',
    ...entries,
    '',
    '## Site',
    '',
    `- [Home](${base}/): the learning path as a graph of problem families, and every traced problem.`,
    `- [About](${base}/about): what the site is and how the traces are built.`,
    `- [Full text for models](${base}/llms-full.txt): prerequisites, intuition, algorithm steps, complexity and failure modes for every approach of every problem.`,
    `- [Sitemap](${base}/sitemap.xml)`,
    '',
  ].join('\n')
})

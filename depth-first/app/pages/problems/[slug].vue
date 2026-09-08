<script setup>
import { problemBySlug } from '#content/index.js';

const route = useRoute();
const config = useRuntimeConfig();

const problem = problemBySlug(route.params.slug);
if (!problem) {
  throw createError({ statusCode: 404, statusMessage: 'Problem not found', fatal: true });
}

const url = `${config.public.siteUrl}/problems/${problem.slug}`;
const title = `${problem.title} (LeetCode ${problem.number}) — visual walkthrough`;
const description = `${problem.blurb} Step through recursive DFS, iterative DFS and BFS with a live call stack, tree and code trace.`;

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogType: 'article',
  ogUrl: url,
  ogImage: `${config.public.siteUrl}/og.png`,
  twitterImage: `${config.public.siteUrl}/og.png`,
  twitterCard: 'summary_large_image',
});

useHead({
  link: [{ rel: 'canonical', href: url }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: problem.title,
        description,
        url,
        articleSection: 'Algorithms',
        keywords: problem.topics.join(', '),
      }),
    },
  ],
});
</script>

<template>
  <div class="wrap page">
    <nav class="crumbs" aria-label="Breadcrumb">
      <NuxtLink to="/">Problems</NuxtLink> / LeetCode {{ problem.number }}
    </nav>

    <header class="problem-head">
      <h1>{{ problem.title }}</h1>
      <p class="meta-row">
        <span class="diff" :class="problem.difficulty.toLowerCase()">{{ problem.difficulty }}</span>
        <span>{{ problem.pattern }}</span>
        <a :href="problem.links.leetcode" target="_blank" rel="noopener">LeetCode ↗</a>
        <a :href="problem.links.neetcode" target="_blank" rel="noopener">NeetCode ↗</a>
      </p>
      <p class="lede" v-html="problem.lede" />
    </header>

    <div class="statement">
      <div>
        <span class="k">Problem</span>
        <p v-for="(para, i) in problem.statement" :key="i" v-html="para" />
      </div>
      <div>
        <span class="k">Examples</span>
        <div v-for="(ex, i) in problem.examples" :key="i" class="ex">
          <b>{{ ex.input }}</b> → <span class="out">{{ ex.output }}</span>
        </div>
      </div>
      <div>
        <span class="k">Constraints</span>
        <ul>
          <li v-for="(c, i) in problem.constraints" :key="i">{{ c }}</li>
        </ul>
      </div>
    </div>

    <AlgoTrace :problem="problem" />

    <article class="essay">
      <section v-for="(s, i) in problem.essay" :key="'e' + i">
        <h2>{{ s.kicker }}</h2>
        <h3>{{ s.heading }}</h3>
        <div v-html="s.html" />
      </section>

      <section>
        <h2>{{ problem.comparison.kicker }}</h2>
        <h3>{{ problem.comparison.heading }}</h3>
        <div class="tbl-hold">
          <table>
            <thead>
              <tr><th v-for="c in problem.comparison.columns" :key="c">{{ c }}</th></tr>
            </thead>
            <tbody>
              <tr v-for="(row, r) in problem.comparison.rows" :key="r">
                <td v-for="(cell, c) in row" :key="c">
                  <code v-if="c === 2 || c === 3">{{ cell }}</code>
                  <template v-else>{{ cell }}</template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p style="margin-top:16px" v-html="problem.comparison.footnote" />
      </section>

      <section>
        <h2>{{ problem.traps.kicker }}</h2>
        <h3>{{ problem.traps.heading }}</h3>
        <ol class="traps">
          <li v-for="(t, i) in problem.traps.items" :key="i">
            <b v-html="t.title" />
            <p v-html="t.body" />
          </li>
        </ol>
      </section>

      <section>
        <h2>{{ problem.next.kicker }}</h2>
        <h3>{{ problem.next.heading }}</h3>
        <p>{{ problem.next.intro }}</p>
        <ul class="next">
          <li v-for="n in problem.next.items" :key="n.num">
            <span class="num">{{ n.num }}</span>
            <b>{{ n.title }}</b>
            <span v-html="n.note" />
          </li>
        </ul>
      </section>

      <section>
        <h2>{{ problem.interview.kicker }}</h2>
        <h3>{{ problem.interview.heading }}</h3>
        <div v-html="problem.interview.html" />
      </section>
    </article>
  </div>
</template>

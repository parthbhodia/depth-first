<script setup>
import { computed } from 'vue';
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

// One idea stays open. Everything else is one click away — the exemplars
// (Red Blob, Ciechanowski) never run more than ~150-300 words without a visual,
// and this page was running 1,289.
const leadSection = computed(() => problem.essay[0]);
const deeperSections = computed(() => problem.essay.slice(1));

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
      <p class="lede short" v-html="problem.blurb" />
    </header>

    <AlgoTrace :problem="problem" />

    <article class="essay lead">
      <section>
        <h2>{{ leadSection.kicker }}</h2>
        <h3>{{ leadSection.heading }}</h3>
        <div v-html="leadSection.html" />
        <TraceFigure
          v-if="leadSection.figure"
          :problem="problem"
          :approach="leadSection.figure.approach"
          :at="leadSection.figure.at"
          :input="leadSection.figure.input"
          :caption="leadSection.figure.caption"
        />
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
    </article>

    <section v-if="problem.video" class="videoblock">
      <h2>Watch it explained</h2>
      <p class="videonote">
        The trace above shows <em>what</em> happens, step by step. For someone talking you
        through the reasoning, {{ problem.video.channel }}'s walkthrough is the best there is.
      </p>
      <div class="videoframe">
        <iframe
          :src="`https://www.youtube-nocookie.com/embed/${problem.video.youtubeId}`"
          :title="problem.video.title"
          loading="lazy"
          referrerpolicy="strict-origin-when-cross-origin"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
        />
      </div>
      <p class="videocredit">
        <a :href="`https://www.youtube.com/watch?v=${problem.video.youtubeId}`" target="_blank" rel="noopener">
          {{ problem.video.title }}
        </a>
        — by {{ problem.video.channel }}
      </p>
    </section>

    <div class="deeper">
      <h2 class="deeper-head">Go deeper</h2>

      <details v-for="(sec, i) in deeperSections" :key="'d' + i" class="fold">
        <summary>{{ sec.heading }}</summary>
        <div class="foldbody essay">
          <section>
            <div v-html="sec.html" />
            <TraceFigure
              v-if="sec.figure"
              :problem="problem"
              :approach="sec.figure.approach"
              :at="sec.figure.at"
              :input="sec.figure.input"
              :caption="sec.figure.caption"
            />
          </section>
        </div>
      </details>

      <details class="fold">
        <summary>{{ problem.traps.heading }}</summary>
        <div class="foldbody essay">
          <section>
            <ol class="traps">
              <li v-for="(t, i) in problem.traps.items" :key="i">
                <b v-html="t.title" />
                <p v-html="t.body" />
              </li>
            </ol>
          </section>
        </div>
      </details>

      <details class="fold">
        <summary>{{ problem.next.heading }}</summary>
        <div class="foldbody essay">
          <section>
            <p>{{ problem.next.intro }}</p>
            <ul class="next">
              <li v-for="n in problem.next.items" :key="n.num">
                <span class="num">{{ n.num }}</span>
                <b>{{ n.title }}</b>
                <span v-html="n.note" />
              </li>
            </ul>
          </section>
        </div>
      </details>

      <details class="fold">
        <summary>{{ problem.interview.heading }}</summary>
        <div class="foldbody essay"><section><div v-html="problem.interview.html" /></section></div>
      </details>

      <details class="fold">
        <summary>Problem statement, examples and constraints</summary>
        <div class="foldbody">
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
        </div>
      </details>
    </div>

  </div>
</template>

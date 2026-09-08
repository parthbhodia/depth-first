<script setup>
import { problems } from '#content/index.js';

const config = useRuntimeConfig();
const title = 'Depth First — step through the algorithms, don\'t just read them';
const description =
  'Interactive, step-by-step traces of classic interview algorithms. Watch the call stack grow, the tree fill in, and the code light up one line at a time.';

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogType: 'website',
  ogUrl: config.public.siteUrl,
  ogImage: `${config.public.siteUrl}/og.png`,
  twitterImage: `${config.public.siteUrl}/og.png`,
  twitterCard: 'summary_large_image',
});
</script>

<template>
  <div class="wrap page">
    <section class="hero">
      <p class="kicker">Interview algorithms, one step at a time</p>
      <h1>Stop reading solutions. Watch them run.</h1>
      <p class="sub">
        Every problem here comes with a live trace: the code highlights the line it is on, the data
        structure redraws itself, and the call stack grows and unwinds in front of you. Change the input,
        scrub backwards, switch languages — the point is to build the mental picture, not memorise a snippet.
      </p>
    </section>

    <div class="index-head">
      <h2>Problems</h2>
      <span>{{ problems.length }} traced</span>
    </div>

    <ul class="plist">
      <li v-for="p in problems" :key="p.slug">
        <NuxtLink :to="`/problems/${p.slug}`">
          <span class="pnum">{{ p.number }}</span>
          <span>
            <span class="ptitle">{{ p.title }}</span>
            <p class="pblurb">{{ p.blurb }}</p>
            <span class="ptags">
              <span v-for="t in p.topics" :key="t" class="ptag">{{ t }}</span>
            </span>
          </span>
          <span class="diff" :class="p.difficulty.toLowerCase()">{{ p.difficulty }}</span>
        </NuxtLink>
      </li>
    </ul>

    <p class="soon">
      More on the way — the tree patterns first (110, 543, 111, 102, 199), then the
      graph and dynamic-programming families. Each one is a trace, not a wall of text.
    </p>
  </div>
</template>

<script setup>
import { problems } from '#content/index.js';
import { roadmap, startHere } from '#content/roadmap.js';

const config = useRuntimeConfig();
const title = 'Depth First — step through the algorithms, don\'t just read them';
const description =
  'Interactive, step-by-step traces of classic interview algorithms. Watch the call stack grow, the tree fill in, and the code light up one line at a time.';

// One obvious next click. Without this the page is a list, and a list makes
// every entry look equally reasonable to start with — which is the same as
// no direction at all.
const first = startHere();

// The list under the map is grouped the way the map is: one family per box,
// in map order, so a problem sits under the idea it belongs to. Anything the
// map does not claim (system design) gets its own group at the end.
const map = roadmap();
const families = map.nodes
  .filter((n) => n.ready)
  .map((n) => ({ id: n.id, label: n.label, blurb: n.blurb, traced: n.traced, total: n.total, problems: n.live }));
const claimed = new Set(families.flatMap((f) => f.problems.map((p) => p.slug)));
const others = problems.filter((p) => !claimed.has(p.slug));
if (others.length) {
  families.push({ id: 'other', label: 'System design', blurb: 'Not on the map — traced all the same.', traced: others.length, total: others.length, problems: others });
}

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

    <div v-if="first" class="starthere">
      <span class="sh-k">Start here</span>
      <p class="sh-t">
        <b>{{ first.number }} · {{ first.title }}</b> — {{ first.blurb }}
      </p>
      <NuxtLink class="btn primary" :to="`/problems/${first.slug}`">Run the trace →</NuxtLink>
    </div>

    <RoadmapGraph />

    <div class="index-head">
      <h2>Problems</h2>
      <span>{{ problems.length }} traced</span>
    </div>

    <section v-for="fam in families" :key="fam.id" :id="`family-${fam.id}`" class="family">
      <div class="family-head">
        <h3>{{ fam.label }}</h3>
        <span class="family-meta">{{ fam.traced }} of {{ fam.total }} traced · {{ fam.blurb }}</span>
      </div>
      <ul class="plist">
        <li v-for="p in fam.problems" :key="p.slug">
          <NuxtLink :to="`/problems/${p.slug}`">
            <span class="pnum" :class="{ sys: !p.number }">{{ p.number || 'SYS' }}</span>
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
    </section>

    <p class="soon">
      The map above is the plan, not a wishlist — each box gets the same treatment: a running
      trace first, the prose second. Backtracking is filling in (78, 90, 46 and 39 are live; 77 and
      22 next), then the rest of the trees row (110, 543, 111) and the 1-D dynamic programming row.
    </p>
  </div>
</template>

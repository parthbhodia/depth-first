<script setup>
import { computed } from 'vue';
import { problemBySlug } from '#content/index.js';

/**
 * The part of a problem page you read before you watch anything: what to
 * know first, the idea of the selected approach in a few sentences, and the
 * algorithm as numbered steps in words. The instrument sits right under it,
 * so the steps and the trace describe the same thing in the same order.
 */
const props = defineProps({
  problem: { type: Object, required: true },
  approach: { type: Object, required: true },
});

const number = computed(() =>
  props.problem.approaches.findIndex((a) => a.id === props.approach.id) + 1);

const plain = (html) => String(html || '').replace(/<[^>]+>/g, '');

// A prerequisite links to the site's own page for it when there is one.
const prereqs = computed(() =>
  (props.problem.prerequisites || []).map((p) => {
    const target = p.slug ? problemBySlug(p.slug) : null;
    return { ...p, hint: plain(p.note), href: target ? `/problems/${target.slug}` : null };
  }));
</script>

<template>
  <section class="brief" aria-label="Before the trace">
    <p v-if="prereqs.length" class="prereq-band">
      <b>Before this problem</b>
      <span v-for="p in prereqs" :key="p.title" class="prereq">
        <NuxtLink v-if="p.href" :to="p.href" :title="p.hint">{{ p.title }} →</NuxtLink>
        <span v-else :title="p.hint">{{ p.title }}</span>
      </span>
    </p>

    <slot />

    <div v-if="approach.intuition || approach.algorithm" class="brief-block approach-brief">
      <h2><i class="brief-num">{{ number }}.</i>{{ approach.name }}</h2>
      <div class="approach-brief-cols">
        <div v-if="approach.intuition">
          <h3>Intuition</h3>
          <div class="brief-prose" v-html="approach.intuition" />
        </div>
        <div v-if="approach.algorithm">
          <h3>Algorithm</h3>
          <ol class="algo">
            <li v-for="(s, i) in approach.algorithm" :key="i" v-html="s" />
          </ol>
        </div>
      </div>
    </div>
  </section>
</template>

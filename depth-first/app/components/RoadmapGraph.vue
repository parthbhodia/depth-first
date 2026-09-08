<script setup>
import { computed } from 'vue';
import { roadmap, NODE_W, NODE_H } from '#content/roadmap.js';

/**
 * The path through the site, drawn as a DAG.
 *
 * Edges are SVG — curves are easier there — and the nodes are real HTML laid
 * over the top, so a traced node is an actual link with real hover, focus and
 * middle-click behaviour instead of a click handler bolted onto a <rect>.
 */
const map = computed(() => roadmap());

const path = (e) => {
  const fx = e.from.x + NODE_W;
  const fy = e.from.y + NODE_H / 2;
  const tx = e.to.x;
  const ty = e.to.y + NODE_H / 2;
  const bend = Math.max(28, (tx - fx) * 0.55);
  return `M ${fx} ${fy} C ${fx + bend} ${fy}, ${tx - bend} ${ty}, ${tx} ${ty}`;
};
</script>

<template>
  <div class="roadmap">
    <div class="index-head">
      <h2>The path</h2>
      <span>{{ map.tracedCount }} of {{ map.totalCount }} traced</span>
    </div>

    <p class="roadnote">
      Each box is a family of problems that share one idea, and the arrows are prerequisites —
      everything downstream assumes you have already watched what feeds into it. Boxes with a
      solid border have a trace you can run today; the faint ones are on the way.
    </p>

    <div class="roadhold">
      <div class="roadcanvas" :style="{ width: map.width + 'px', height: map.height + 'px' }">
        <svg
          class="roadedges"
          :viewBox="`0 0 ${map.width} ${map.height}`"
          :width="map.width"
          :height="map.height"
          aria-hidden="true"
        >
          <defs>
            <marker id="rm-arrow" viewBox="0 0 8 8" refX="7" refY="4"
                    markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 0 L8 4 L0 8 z" fill="currentColor" />
            </marker>
          </defs>
          <path
            v-for="(e, i) in map.edges"
            :key="i"
            :d="path(e)"
            class="roadedge"
            :class="{ live: e.from.ready }"
            marker-end="url(#rm-arrow)"
          />
        </svg>

        <template v-for="n in map.nodes" :key="n.id">
          <NuxtLink
            v-if="n.ready"
            :to="`/problems/${n.live[0].slug}`"
            class="roadnode ready"
            :style="{ left: n.x + 'px', top: n.y + 'px', width: n.w + 'px', height: n.h + 'px' }"
          >
            <span class="rn-label">{{ n.label }}</span>
            <span class="rn-blurb">{{ n.blurb }}</span>
            <span class="rn-meta">{{ n.traced }} of {{ n.total }} traced</span>
          </NuxtLink>
          <div
            v-else
            class="roadnode planned"
            :style="{ left: n.x + 'px', top: n.y + 'px', width: n.w + 'px', height: n.h + 'px' }"
          >
            <span class="rn-label">{{ n.label }}</span>
            <span class="rn-blurb">{{ n.blurb }}</span>
            <span class="rn-meta">{{ n.total }} planned</span>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  lay: { type: Object, required: true },
  frame: { type: Object, default: null },
  // Figures scale to fit; the live canvas keeps natural size and scrolls.
  compact: { type: Boolean, default: false },
  // A teaching figure: nodes and edges only. Return badges and repeat marks
  // answer questions the reader has not asked yet.
  plain: { type: Boolean, default: false },
});

const revealed = computed(() => (props.frame ? props.frame.revealed || 0 : 0));
const returns = computed(() => (props.frame && props.frame.returns) || {});
const path = computed(() => (props.frame && props.frame.path) || []);
const hits = computed(() => (props.frame && props.frame.memoHits) || []);

// Nodes are laid out up front so nothing moves mid-animation, but a call that
// hasn't happened yet must not be on screen.
const shown = computed(() => props.lay.nodes.filter((n) => n.id < revealed.value));
const shownEdges = computed(() =>
  props.lay.edges.filter((e) => e.to < revealed.value && e.from < revealed.value)
);

const box = computed(() => {
  // Room above each node for the return badge and the repeat marker.
  const w = (props.lay.width || 100) + 40;
  const h = (props.lay.height || 100) + 18;
  return { w, h, vb: `-20 -14 ${w} ${h}` };
});

const nodeClass = (n) => ({
  act: props.frame && props.frame.active === n.id,
  open: path.value.includes(n.id) && !(props.frame && props.frame.active === n.id),
  done: returns.value[n.id] !== undefined && !(props.frame && props.frame.active === n.id),
  hit: hits.value.includes(n.id),
  dup: n.dup,
});
</script>

<template>
  <div class="calltree-hold" :class="{ bare: !lay.nodes.length, compact }">
    <p v-if="!lay.nodes.length" class="empty-note">
      No recursion tree — this version never calls itself.
    </p>

    <svg
      v-else
      class="calltree"
      :viewBox="box.vb"
      :width="box.w"
      :height="box.h"
      role="img"
      :aria-label="frame ? frame.caption : 'Call tree'"
    >
      <line
        v-for="(e, i) in shownEdges"
        :key="'ce' + i"
        class="cedge"
        :class="{ lit: path.includes(e.from) && path.includes(e.to) }"
        :x1="lay.byId.get(e.from).x"
        :y1="lay.byId.get(e.from).y + lay.byId.get(e.from).h / 2"
        :x2="lay.byId.get(e.to).x"
        :y2="lay.byId.get(e.to).y - lay.byId.get(e.to).h / 2"
      />

      <g v-for="n in shown" :key="'cn' + n.id">
        <rect
          class="cnode"
          :class="nodeClass(n)"
          :x="n.x - n.w / 2"
          :y="n.y - n.h / 2"
          :width="n.w"
          :height="n.h"
          rx="4"
        />
        <text class="cnodet" :x="n.x" :y="n.y">{{ n.label }}</text>
        <text
          v-if="n.dup && !plain"
          class="cdup"
          :x="n.x - n.w / 2 + 1"
          :y="n.y - n.h / 2 - 6"
        >×{{ n.dupCount }}</text>
        <g v-if="returns[n.id] !== undefined && !plain">
          <circle class="cbadge" :cx="n.x + n.w / 2 - 2" :cy="n.y - n.h / 2 + 1" r="10" />
          <text class="cbadget" :x="n.x + n.w / 2 - 2" :y="n.y - n.h / 2 + 1">{{ returns[n.id] }}</text>
        </g>
      </g>
    </svg>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { LAYOUT } from '#engine/tree.js';

const props = defineProps({
  lay: { type: Object, required: true },
  frame: { type: Object, default: null },
  badgeLabel: { type: String, default: 'Value' },
  // Only problems where context flows DOWN set these; everything else ignores them.
  carryLabel: { type: String, default: 'Carried in' },
});

// The viewBox has to leave room for things that live outside the node bounds:
// return-value badges sit above-right, ghost null slots hang below the last row.
const box = computed(() => {
  const w = (props.lay.width || 100) + 44;
  const h = (props.lay.height || 100) + 70;
  return { w, h, vb: `-22 -12 ${w} ${h}` };
});

const returns = computed(() => (props.frame && props.frame.returns) || {});
const path = computed(() => (props.frame && props.frame.path) || []);

// carried = the value handed DOWN into that node's call. marks = a per-node
// verdict. Both are opt-in: a frame that omits them renders exactly as before.
const carried = computed(() => (props.frame && props.frame.carried) || {});
const marks = computed(() => (props.frame && props.frame.marks) || {});

/** A missing child still gets a real call. Drawing it is the base case made visible. */
const ghost = computed(() => {
  const slot = props.frame && props.frame.nullSlot;
  if (!slot) return null;
  const parent = props.lay.byId.get(slot.parentId);
  if (!parent) return null;
  const dx = (slot.side === 'left' ? -1 : 1) * (LAYOUT.xGap * 0.46);
  return { px: parent.x, py: parent.y, x: parent.x + dx, y: parent.y + LAYOUT.yGap * 0.68 };
});

/** BFS highlights the row it is currently draining. */
const band = computed(() => {
  const lvl = props.frame && props.frame.levelBand;
  if (lvl === null || lvl === undefined) return null;
  const row = props.lay.nodes.filter((n) => n.depth === lvl);
  if (!row.length) return null;
  return { y: row[0].y - 30, h: 60 };
});

const litEdge = (e) => path.value.includes(e.from) && path.value.includes(e.to);

const nodeClass = (n) => {
  const isActive = Boolean(props.frame && props.frame.active === n.id);
  const mark = marks.value[n.id];
  return {
    act: isActive,
    path: path.value.includes(n.id) && !isActive && !mark,
    res: returns.value[n.id] !== undefined && !isActive && !mark,
    good: mark === 'good' && !isActive,
    bad: mark === 'bad' && !isActive,
  };
};
</script>

<template>
  <div class="canvas-hold">
    <p v-if="!lay.nodes.length" class="empty-note">Empty tree — nothing to traverse.</p>
    <svg
      v-else
      class="tree"
      :viewBox="box.vb"
      :width="box.w"
      :height="box.h"
      role="img"
      :aria-label="frame ? frame.caption : 'Binary tree'"
    >
      <rect v-if="band" class="band" :x="-16" :y="band.y" :width="lay.width + 32" :height="band.h" rx="4" />

      <line
        v-for="(e, i) in lay.edges"
        :key="'e' + i"
        class="edge"
        :class="{ lit: litEdge(e) }"
        :x1="lay.byId.get(e.from).x"
        :y1="lay.byId.get(e.from).y"
        :x2="lay.byId.get(e.to).x"
        :y2="lay.byId.get(e.to).y"
      />

      <g v-if="ghost">
        <line class="edge lit" :x1="ghost.px" :y1="ghost.py" :x2="ghost.x" :y2="ghost.y" />
        <circle class="ghost act" :cx="ghost.x" :cy="ghost.y" r="19" />
        <text class="ghostt" :x="ghost.x" :y="ghost.y">null</text>
      </g>

      <g v-for="n in lay.nodes" :key="'n' + n.id">
        <circle class="nodec" :class="nodeClass(n)" :cx="n.x" :cy="n.y" :r="24" />
        <text class="nodet" :x="n.x" :y="n.y">{{ n.val }}</text>
        <g v-if="carried[n.id] !== undefined">
          <title>{{ carryLabel }}: {{ carried[n.id] }}</title>
          <rect class="badge-c" :x="n.x - 42" :y="n.y - 32" :width="30" height="19" rx="4" />
          <text class="badge-ct" :x="n.x - 27" :y="n.y - 22">{{ carried[n.id] }}</text>
        </g>
        <g v-if="returns[n.id] !== undefined">
          <title>{{ badgeLabel }}: {{ returns[n.id] }}</title>
          <circle class="badge-r" :cx="n.x + 22" :cy="n.y - 22" r="11" />
          <text class="badge-t" :x="n.x + 22" :y="n.y - 22">{{ returns[n.id] }}</text>
        </g>
      </g>
    </svg>
  </div>
</template>

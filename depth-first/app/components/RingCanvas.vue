<script setup>
import { computed } from 'vue';
import { RING, pointAt } from '#engine/ring.js';

/**
 * Renders a consistent-hashing frame. Two views, chosen by the frame:
 *   view: 'buckets' → the modulo baseline, keys dropped into N columns
 *   view: 'ring'    → the ring itself, servers + virtual nodes + keys
 *
 * Like the other canvases, this paints frame data and never computes placement
 * itself — the algorithm already recorded everything.
 */
const props = defineProps({
  frame: { type: Object, default: null },
});

const view = computed(() => (props.frame && props.frame.view) || 'ring');
const box = computed(() => `0 0 ${RING.width} ${RING.height}`);

// ---- ring geometry ----
const servers = computed(() => (props.frame && props.frame.servers) || []);
const keys = computed(() => (props.frame && props.frame.keys) || []);
const arc = computed(() => (props.frame && props.frame.arc) || null);
const sweep = computed(() => (props.frame && props.frame.sweep) ?? null);

const nodePt = (deg, virtual) => pointAt(deg, RING.r);
const keyPt = (deg) => pointAt(deg, RING.r - RING.keyInset);
const labelPt = (deg) => pointAt(deg, RING.r + 26);

// A shaded arc from `from`→`to` degrees, drawn as an SVG path along the ring.
const arcPath = (from, to) => {
  const a = pointAt(from, RING.r);
  const b = pointAt(to, RING.r);
  const large = ((to - from + 360) % 360) > 180 ? 1 : 0;
  return `M ${RING.cx} ${RING.cy} L ${a.x} ${a.y} A ${RING.r} ${RING.r} 0 ${large} 1 ${b.x} ${b.y} Z`;
};

const sweepPt = computed(() => (sweep.value === null ? null : keyPt(sweep.value)));

// ---- buckets ----
const buckets = computed(() => (props.frame && props.frame.buckets) || []);
</script>

<template>
  <div class="canvas-hold ring-hold">
    <!-- MODULO BUCKETS -->
    <div v-if="view === 'buckets'" class="buckets" :style="{ '--n': buckets.length }">
      <div v-for="b in buckets" :key="b.id" class="bucket" :class="{ hot: b.hot }">
        <div class="bhead">{{ b.id }}<span v-if="b.formula" class="bform">{{ b.formula }}</span></div>
        <div class="bkeys">
          <span
            v-for="k in b.keys"
            :key="k.id"
            class="kchip"
            :class="{ moved: k.moved, act: k.active }"
          >{{ k.label }}</span>
          <span v-if="!b.keys.length" class="bempty">—</span>
        </div>
      </div>
    </div>

    <!-- THE RING -->
    <svg v-else class="ring" :viewBox="box" role="img" :aria-label="frame ? frame.caption : 'Hash ring'">
      <circle class="ring-track" :cx="RING.cx" :cy="RING.cy" :r="RING.r" />

      <path v-if="arc" class="ring-arc" :d="arcPath(arc.from, arc.to)" />

      <!-- clockwise-walk pointer -->
      <g v-if="sweepPt">
        <line class="sweep" :x1="RING.cx" :y1="RING.cy" :x2="sweepPt.x" :y2="sweepPt.y" />
      </g>

      <!-- keys: sit just inside the ring, joined to their owner by a spoke -->
      <g v-for="k in keys" :key="'k' + k.id">
        <line
          v-if="k.ownerAngle !== undefined && k.ownerAngle !== null"
          class="spoke"
          :class="{ moved: k.moved }"
          :x1="keyPt(k.angle).x" :y1="keyPt(k.angle).y"
          :x2="nodePt(k.ownerAngle).x" :y2="nodePt(k.ownerAngle).y"
        />
        <circle
          class="keyd"
          :class="{ act: k.active, moved: k.moved, homeless: k.homeless }"
          :cx="keyPt(k.angle).x" :cy="keyPt(k.angle).y" :r="RING.keyR"
        />
      </g>

      <!-- server nodes (and virtual nodes) -->
      <g v-for="(s, i) in servers" :key="'s' + s.id + i">
        <circle
          class="serverd"
          :class="['sv-' + (s.colorIndex ?? 0), { vnode: s.virtual, act: s.active, added: s.added }]"
          :cx="nodePt(s.angle).x" :cy="nodePt(s.angle).y"
          :r="s.virtual ? RING.vnodeR : RING.serverR"
        />
        <text
          v-if="!s.virtual"
          class="servert"
          :x="nodePt(s.angle).x" :y="nodePt(s.angle).y"
        >{{ s.short }}</text>
        <text
          v-if="!s.virtual && s.label"
          class="serverlabel"
          :x="labelPt(s.angle).x" :y="labelPt(s.angle).y"
        >{{ s.label }}</text>
      </g>
    </svg>
  </div>
</template>

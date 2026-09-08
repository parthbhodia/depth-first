<script setup>
import { computed } from 'vue';
import { layout, LAYOUT } from '#engine/tree.js';
import { layoutCallTree, CALL_LAYOUT } from '#engine/calltree.js';

/**
 * A still from the real trace, used as a figure inside the prose.
 *
 * The essay had 1,289 words and one visual. Rather than draw bespoke diagrams
 * that would drift from the code, this re-runs the actual instrumented
 * algorithm and freezes it at a meaningful frame — so a figure can never
 * disagree with the trace above it.
 *
 * `at` is 'last', a frame index, or { anchor } to find the first frame at that
 * step. 'last' and anchors survive edits to the frame list; raw indices do not.
 */
const props = defineProps({
  problem: { type: Object, required: true },
  approach: { type: String, required: true },
  at: { type: [String, Number, Object], default: 'last' },
  input: { type: String, default: null },
  caption: { type: String, default: '' },
});

const approachObj = computed(() => props.problem.approachById(props.approach));
const value = computed(() => props.problem.parseInput(props.input ?? props.problem.defaultInput));
const built = computed(() => approachObj.value.build(value.value));

const frame = computed(() => {
  const f = built.value.frames;
  if (!f.length) return null;
  if (props.at === 'last') return f[f.length - 1];
  if (typeof props.at === 'number') return f[Math.min(props.at, f.length - 1)];
  if (props.at && props.at.anchor) {
    return f.find((x) => x.anchor === props.at.anchor) || f[f.length - 1];
  }
  return f[f.length - 1];
});

const isCallTree = computed(() => props.problem.stage === 'call-tree');

const lay = computed(() => (isCallTree.value
  ? layoutCallTree(built.value.nodes || [], CALL_LAYOUT)
  : layout(value.value, LAYOUT)));

const badgeLabel = computed(
  () => props.problem.badgeLabels?.[props.approach] || 'Value'
);
</script>

<template>
  <figure class="tracefig">
    <div class="tracefig-canvas">
      <CallTreeCanvas v-if="isCallTree" :lay="lay" :frame="frame" compact />
      <TreeCanvas v-else :lay="lay" :frame="frame" :badge-label="badgeLabel" :carry-label="carryLabel" />
    </div>
    <figcaption v-if="caption">{{ caption }}</figcaption>
  </figure>
</template>

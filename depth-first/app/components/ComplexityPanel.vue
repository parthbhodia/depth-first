<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue';

/**
 * Time and space complexity, counted on the run the reader is looking at.
 *
 * The bound is stated the textbook way; the argument for it is then checked
 * against the actual trace: how many nodes each level of the tree has, how
 * many times each loop ran, how deep the stack really got. The animation
 * reveals the levels one by one while the equation assembles beside them.
 * Every number is computed from approach.build(input) — nothing is typed in.
 */
const props = defineProps({
  problem: { type: Object, required: true },
  approach: { type: Object, required: true },
  input: { type: String, default: null },
});

const cx = computed(() => props.approach.complexity);
const parsed = computed(() => props.problem.parseInput(props.input ?? props.problem.defaultInput));
const built = computed(() => props.approach.build(parsed.value));

// What the trace actually did.
const m = computed(() => {
  const frames = built.value.frames;
  const nodes = (built.value.nodes || []).filter((n) => !n.phantom);
  const byDepth = [];
  nodes.forEach((n) => { byDepth[n.depth] = (byDepth[n.depth] || 0) + 1; });
  const levels = Array.from(byDepth, (c) => c || 0);
  const parents = new Set(nodes.map((n) => n.parentId).filter((p) => p !== null && p !== undefined));
  const by = {};
  frames.forEach((f) => { by[f.anchor] = (by[f.anchor] || 0) + 1; });
  const iter = cx.value?.time?.iterationAnchors || [];
  const size = cx.value?.size ? cx.value.size(parsed.value) : { n: nodes.length, label: '' };
  return {
    ...size,
    calls: nodes.length,
    leaves: nodes.filter((n) => !parents.has(n.id)).length,
    answers: by[cx.value?.time?.answerAnchor || 'record'] || 0,
    iterations: iter.reduce((a, k) => a + (by[k] || 0), 0),
    by,
    maxDepth: Math.max(0, ...frames.map((f) => (f.callStack || []).length)),
    frames: frames.length,
    levels,
  };
});

const say = (item) => (typeof item === 'function' ? item(m.value) : item);

// The line of source a loop row points at — resolved by anchor, in Python.
const codeLine = (anchor) => {
  const entry = props.approach.code.python;
  const n = entry.anchors[anchor];
  return n ? entry.source.split('\n')[n - 1].trim() : anchor;
};

/* ---------- the level-by-level count ---------- */
const shown = ref(0);
let timer = null;
const total = computed(() => m.value.levels.length + 1);
function stop() { if (timer) clearInterval(timer); timer = null; }
function play() {
  stop();
  shown.value = 0;
  timer = setInterval(() => {
    shown.value += 1;
    if (shown.value >= total.value) stop();
  }, 600);
}
// At rest the count is complete; the button replays it.
watch(() => [props.approach.id, props.input], () => { stop(); shown.value = total.value; }, { immediate: true });
onBeforeUnmount(stop);

const maxLevel = computed(() => Math.max(1, ...m.value.levels));
const equation = computed(() => {
  const L = m.value.levels;
  const k = Math.min(shown.value, L.length);
  if (k === 0) return '';
  if (cx.value.time.count === 'product') {
    const mults = [];
    for (let d = 1; d < k; d++) mults.push(L[d] / L[d - 1]);
    const text = mults.map((x) => (Number.isInteger(x) ? x : x.toFixed(2))).join(' × ');
    return k === L.length ? `${text || '1'} = ${L[L.length - 1]} leaves` : text;
  }
  const parts = L.slice(0, k);
  return k === L.length ? `${parts.join(' + ')} = ${L.reduce((a, b) => a + b, 0)} nodes` : parts.join(' + ');
});
</script>

<template>
  <section class="cx" aria-label="Time and space complexity">
    <h2>Time and space complexity</h2>
    <p class="cx-lead">{{ say(cx.lead) }}</p>

    <div class="cx-cols">
      <div class="cx-block">
        <h3>Time <b>{{ cx.time.bound }}</b></h3>
        <ol class="cx-story">
          <li v-for="(s, i) in cx.time.story" :key="i" v-html="say(s)" />
        </ol>

        <div class="cx-anim">
          <div class="cx-levels">
            <div v-for="(c, d) in m.levels" :key="d" class="cx-level" :class="{ on: d < shown }">
              <span class="cx-lvl">{{ d === 0 ? 'root' : `level ${d}` }}</span>
              <span class="cx-bar"><i :style="{ width: (d < shown ? (c / maxLevel) * 100 : 0) + '%' }" /></span>
              <span class="cx-count">{{ d < shown ? c : '' }}</span>
            </div>
          </div>
          <p class="cx-eq">{{ equation }}</p>
          <p v-if="shown >= total && cx.time.final" class="cx-final" v-html="say(cx.time.final)" />
          <button class="btn" type="button" @click="play">↻ Count it again</button>
        </div>

        <div v-if="cx.time.loops" class="tbl-hold">
          <table class="cx-loops">
            <thead><tr><th>Loop</th><th>How often it runs</th><th>On this input</th></tr></thead>
            <tbody>
              <tr v-for="(l, i) in cx.time.loops" :key="i">
                <td><code>{{ codeLine(l.anchor) }}</code></td>
                <td v-html="say(l.runs)" />
                <td v-html="say(l.measured)" />
              </tr>
            </tbody>
          </table>
        </div>
        <p v-if="cx.time.note" class="cx-note" v-html="say(cx.time.note)" />
      </div>

      <div class="cx-block">
        <h3>Space <b>{{ cx.space.bound }}</b></h3>
        <ol class="cx-story">
          <li v-for="(s, i) in cx.space.story" :key="i" v-html="say(s)" />
        </ol>
        <dl class="cx-measured">
          <template v-for="([k, v], i) in say(cx.space.measured)" :key="i">
            <dt>{{ k }}</dt>
            <dd>{{ v }}</dd>
          </template>
        </dl>
        <p v-if="cx.space.note" class="cx-note" v-html="say(cx.space.note)" />
      </div>
    </div>
  </section>
</template>

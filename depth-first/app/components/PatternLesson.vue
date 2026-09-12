<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { highlight } from '#engine/highlight.js';
import { fmt } from '#engine/frames.js';
import { useNarration } from '~/composables/useNarration.js';

/**
 * An intuition-first lesson that sits above the instrument.
 *
 * Closed by default: one strip that says what it is and offers to start, so
 * the code and the trace stay where they have always been — first. Open, it
 * is a stepper: one idea and one big visual per step, optionally read aloud,
 * with the instrument one click away the whole time.
 *
 * Every visual is derived from real code and a real trace — a figure is a
 * frame of an actual run, annotated code resolves anchors to line numbers,
 * a step can embed a whole (compact) instrument on the input the lesson is
 * about, a ledger lists what that instrument's frames recorded, and a toggle
 * runs the same builder with a different option — so nothing here can drift
 * from what the instrument shows.
 */
const props = defineProps({
  problem: { type: Object, required: true },
  lesson: { type: Object, required: true },
});
const emit = defineEmits(['jump', 'skip']);

const open = ref(false);
const at = ref(0);
const steps = computed(() => props.lesson.steps);
const step = computed(() => steps.value[at.value]);
const isLast = computed(() => at.value === steps.value.length - 1);
// A picture step reads like a slide: visual on top, one short thought under it.
const visualFirst = computed(() => Boolean(step.value.figure || step.value.grow || step.value.instrument || step.value.toggle));

const go = (i) => { at.value = Math.max(0, Math.min(steps.value.length - 1, i)); grown.value = 1; };
function start() { open.value = true; go(0); }
function close() { open.value = false; cancel(); }
function finish() { close(); emit('jump', props.lesson.finish); }

// A visual names the problem it draws: the page's own, or the lesson's warm-up.
const probFor = (ref) => (ref && ref.problem === 'warmup' ? props.lesson.warmup : props.problem);

/* ---------- the embedded instrument ----------
   It runs the approach and input the step names, and reports its step so a
   ledger beside it can fill as the reader moves. Keyed per step so a new
   step gets a fresh instrument rather than one carrying old state. */
const mini = ref(null);
const miniApproach = ref(null);
const miniInput = ref(null);
const miniIndex = ref(0);
watch(at, () => {
  const s = step.value;
  miniApproach.value = s.instrument?.approach ?? null;
  miniInput.value = s.instrument?.input ?? null;
  miniIndex.value = 0;
}, { immediate: true });

const miniBuilt = computed(() => {
  const s = step.value;
  if (!s.instrument) return null;
  const p = probFor(s.instrument);
  const a = p.approachById(miniApproach.value ?? s.instrument.approach);
  return a.build(p.parseInput(miniInput.value ?? p.defaultInput));
});

// Jumps aimed at the embedded instrument stay here; the rest go to the page.
function jump(j) {
  if (j.target === 'warmup' || j.target === 'embedded') { mini.value?.jumpTo(j); return; }
  emit('jump', j);
}

/* ---------- ledger: every time a test ran, filled as it happens ----------
   Frames that evaluated something carry `test`; the rows are those frames,
   revealed up to the embedded instrument's current step. */
const ledgerRows = computed(() => {
  const b = miniBuilt.value;
  if (!b || !step.value.ledger) return [];
  return b.frames
    .map((f, idx) => (f.test ? { ...f.test, idx, shown: idx <= miniIndex.value } : null))
    .filter(Boolean);
});
const yesno = (v) => (v === null || v === undefined ? 'n/a' : v ? 'true' : 'false');

/* ---------- toggle: the same builder, a different option ----------
   Each option re-runs the approach with its own build options. The first
   option is the reference; anything it produces that another option loses
   is struck through, and the root frame's loop is drawn cell by cell. */
const toggleSel = ref(0);
watch(at, () => { toggleSel.value = 0; });
const toggleData = computed(() => {
  const s = step.value;
  if (!s.toggle) return null;
  const p = probFor(s.toggle);
  const a = p.approachById(s.toggle.approach);
  const input = p.parseInput(s.toggle.input ?? p.defaultInput);
  const runs = s.toggle.options.map((o) => a.build(input, o.opts || {}));
  const collect = s.toggle.collect || 'subsets';
  const base = runs[0][collect] || [];
  return s.toggle.options.map((o, k) => {
    const built = runs[k];
    const have = new Set((built[collect] || []).map((x) => x.join(',')));
    const outs = base.map((x) => ({ text: fmt(x), lost: !have.has(x.join(',')) }));
    const rootTests = built.frames.filter((f) => f.test && (f.callStack || []).length === 1);
    const byI = new Map(rootTests.map((f) => [f.test.i, f.test.verdict]));
    const cells = input.map((v, i) => ({ v, i, verdict: byI.has(i) ? byI.get(i) : 'never' }));
    const m = { count: have.size, lostCount: outs.filter((x) => x.lost).length, lost: outs.filter((x) => x.lost).map((x) => x.text) };
    return { ...o, cells, outs, m, verdictText: typeof o.verdict === 'function' ? o.verdict(m) : o.verdict };
  });
});
const cellNote = (opt, c) => (c.verdict === 'take' ? 'take it' : c.verdict === 'skip' ? opt.skipNote : 'never reached');

/* ---------- read aloud ----------
   The same voice as the trace. Each step is one spoken thought; the prose is
   written to be read, so tags come off and the title leads. */
const { supported: voiceSupported, enabled: voiceOn, speak, cancel, toggle: toggleVoice } = useNarration();
const spokenText = (s) => `${s.title}. ${s.html.replace(/<[^>]+>/g, ' ')}`;
function toggleRead() {
  toggleVoice();
  if (voiceOn.value) speak(spokenText(step.value), 0.95);
}
watch(at, () => { if (open.value && voiceOn.value) speak(spokenText(step.value), 0.95); });
onBeforeUnmount(cancel);

const codeLines = (source, lang = 'python') =>
  source.split('\n').map((l, i) => ({ n: i + 1, html: highlight(l, lang) }));

// Which part of the code each line belongs to, by anchor — never by number.
const partLines = computed(() => {
  const s = step.value;
  if (!s.parts) return [];
  const approach = probFor(s).approachById(s.approach);
  const lang = s.lang || 'python';
  const entry = approach.code[lang];
  const owner = new Map();
  s.parts.forEach((p, k) => p.anchors.forEach((a) => owner.set(entry.anchors[a], k)));
  return codeLines(entry.source, lang).map((l) => ({ ...l, part: owner.has(l.n) ? owner.get(l.n) : null }));
});

// "Grow the tree": reveal one call at a time, in the order the DFS makes them.
const grown = ref(1);
const callFrames = computed(() => {
  const s = step.value;
  if (!s.grow) return [];
  const problem = probFor(s.grow);
  const approach = problem.approachById(s.grow.approach);
  const { frames } = approach.build(problem.parseInput(s.grow.input ?? problem.defaultInput));
  return frames.map((f, i) => (f.anchor === 'call' ? i : -1)).filter((i) => i >= 0);
});
const growAt = computed(() => callFrames.value[Math.min(grown.value, callFrames.value.length) - 1] ?? 0);
const grow = () => { if (grown.value < callFrames.value.length) grown.value += 1; };
const regrow = () => { grown.value = 1; };
</script>

<template>
  <section class="lesson" :class="{ open }" aria-label="Lesson">
    <!-- Closed: one strip. The instrument below stays the first real thing on the page. -->
    <div v-if="!open" class="lesson-strip">
      <div class="lesson-strip-text">
        <h2>{{ lesson.kicker }}</h2>
        <p class="lesson-thesis">{{ lesson.heading }}</p>
        <p class="lesson-meta">{{ lesson.invite || `New here? ${steps.length} short steps with pictures, before the code.` }}</p>
      </div>
      <button class="btn primary lesson-start" type="button" @click="start">▶ Start the lesson</button>
    </div>

    <template v-else>
      <div class="lesson-head">
        <h2>{{ lesson.kicker }}</h2>
        <ol class="lesson-dots" aria-label="Lesson steps">
          <li v-for="(s, i) in steps" :key="i">
            <button
              type="button"
              :aria-current="i === at ? 'step' : null"
              :aria-label="`Step ${i + 1}: ${s.title}`"
              @click="go(i)"
            >{{ i + 1 }}</button>
          </li>
        </ol>
        <span class="lesson-tools">
          <button
            v-if="voiceSupported"
            class="btn narrate"
            type="button"
            title="Read each step aloud"
            :aria-pressed="voiceOn ? 'true' : 'false'"
            @click="toggleRead"
          >{{ voiceOn ? '🔊 Reading' : '🔇 Read aloud' }}</button>
          <button class="btn ghost" type="button" @click="emit('skip')">Skip to the code ↓</button>
          <button class="btn ghost" type="button" aria-label="Close the lesson" @click="close">✕</button>
        </span>
      </div>

      <div class="lesson-body" :class="{ 'visual-first': visualFirst }">
        <div class="lesson-visual">
          <pre v-if="step.snippet" class="code lesson-code"><div
            v-for="ln in codeLines(step.snippet.source, step.snippet.lang)"
            :key="ln.n"
            class="cl"
          ><span class="n">{{ ln.n }}</span><span v-html="ln.html" /></div></pre>

          <TraceFigure
            v-else-if="step.figure"
            :problem="probFor(step.figure)"
            :approach="step.figure.approach"
            :at="step.figure.at"
            :input="step.figure.input"
            :caption="step.figure.caption"
            plain
          />

          <div v-else-if="step.grow" class="lesson-grow">
            <TraceFigure
              :problem="probFor(step.grow)"
              :approach="step.grow.approach"
              :at="growAt"
              :input="step.grow.input"
              :caption="`${Math.min(grown, callFrames.length)} of ${callFrames.length} nodes — each one appears the moment the DFS reaches it.`"
              plain
            />
            <div class="lesson-growbar">
              <button class="btn primary" type="button" :disabled="grown >= callFrames.length" @click="grow">
                {{ grown >= callFrames.length ? 'All grown' : 'Grow' }}
              </button>
              <button class="btn ghost" type="button" @click="regrow">Start over</button>
            </div>
          </div>

          <div v-else-if="step.instrument" class="lesson-embed">
            <AlgoTrace
              :key="'mini' + at"
              ref="mini"
              :problem="probFor(step.instrument)"
              v-model:approach="miniApproach"
              v-model:input="miniInput"
              compact
              @step="miniIndex = $event"
            />
            <div v-if="step.ledger" class="lesson-ledger">
              <p class="lesson-ledger-head">{{ step.ledger.title || 'Every time the test runs' }} <em>filled as it happens</em></p>
              <div class="tbl-hold">
                <table>
                  <thead><tr><th v-for="c in (step.ledger.columns || ['frame', 'index', 'i', 'i > index', 'equal?', 'verdict'])" :key="c">{{ c }}</th></tr></thead>
                  <tbody>
                    <tr v-for="r in ledgerRows" :key="r.idx" :class="r.shown ? r.verdict : 'pending'">
                      <template v-if="r.shown">
                        <td>{{ r.label }}</td><td>{{ r.index }}</td><td>{{ r.i }}</td>
                        <td>{{ r.gt ? 'TRUE' : 'false' }}</td><td>{{ yesno(r.eq) }}</td><td class="v">{{ r.verdict }}</td>
                      </template>
                      <template v-else><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td class="v">—</td></template>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div v-else-if="step.toggle && toggleData" class="lesson-toggle">
            <div class="lesson-toggle-bar" role="group" :aria-label="step.toggle.label || 'Variant'">
              <button
                v-for="(o, k) in toggleData"
                :key="o.id"
                class="btn"
                :class="{ primary: k === toggleSel }"
                type="button"
                :aria-pressed="k === toggleSel ? 'true' : 'false'"
                @click="toggleSel = k"
              ><code>{{ o.label }}</code></button>
            </div>
            <p class="lesson-ledger-head">{{ step.toggle.cellsTitle || 'Root loop' }}</p>
            <div class="lesson-cells">
              <div v-for="c in toggleData[toggleSel].cells" :key="c.i" class="lesson-cell" :class="c.verdict">
                <b>{{ c.v }}</b><i>i = {{ c.i }}</i><i>{{ cellNote(toggleData[toggleSel], c) }}</i>
              </div>
            </div>
            <p class="lesson-ledger-head">{{ step.toggle.outsTitle || 'Everything the algorithm produces' }} <em>{{ toggleData[0].m.count }} when correct</em></p>
            <div class="lesson-outs">
              <span v-for="o in toggleData[toggleSel].outs" :key="o.text" class="lesson-out" :class="{ lost: o.lost }">{{ o.text }}</span>
            </div>
            <p class="lesson-verdict" v-html="toggleData[toggleSel].verdictText" />
          </div>

          <div v-else-if="step.questions" class="lesson-qs">
            <div v-for="(q, i) in step.questions" :key="i" class="lesson-q">
              <span class="lesson-qn">Q{{ i + 1 }}</span>
              <b>{{ q.q }}</b>
              <p v-html="q.a" />
            </div>
          </div>

          <div v-else-if="step.parts" class="lesson-parts">
            <pre class="code lesson-code"><div
              v-for="ln in partLines"
              :key="ln.n"
              class="cl"
              :class="ln.part !== null ? 'part p' + ln.part : ''"
            ><span class="n">{{ ln.n }}</span><span v-html="ln.html" /></div></pre>
            <ol class="lesson-partkey">
              <li v-for="(p, k) in step.parts" :key="k" :class="'p' + k">
                <b>{{ p.label }}</b>
                <span>{{ p.note }}</span>
              </li>
            </ol>
          </div>
        </div>

        <div class="lesson-text">
          <p class="lesson-stepno">Step {{ at + 1 }} of {{ steps.length }}</p>
          <h3>{{ step.title }}</h3>
          <div class="lesson-prose" v-html="step.html" />
          <div v-if="step.jumps" class="lesson-actions">
            <button
              v-for="(j, i) in step.jumps"
              :key="i"
              class="btn"
              :class="{ key: j.key }"
              type="button"
              @click="jump(j)"
            >{{ j.label }} ›</button>
          </div>
        </div>
      </div>

      <div class="lesson-nav">
        <button class="btn" type="button" :disabled="at === 0" @click="go(at - 1)">‹ Back</button>
        <span v-if="lesson.credit" class="lesson-credit" v-html="lesson.credit" />
        <button
          class="btn primary"
          type="button"
          @click="isLast ? finish() : go(at + 1)"
        >{{ isLast ? (lesson.finish?.label || 'Play the trace') : 'Next' }} ›</button>
      </div>
    </template>
  </section>
</template>

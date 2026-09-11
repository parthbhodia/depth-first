<script setup>
import { ref, computed } from 'vue';
import { highlight } from '#engine/highlight.js';

/**
 * An intuition-first lesson, read BEFORE the instrument.
 *
 * The trace shows what happens; this is for someone who does not yet know why
 * the algorithm has the shape it has. It is a stepper rather than an essay so
 * the instrument stays near the top of the page: one idea, one visual, next.
 *
 * Every visual is derived from the problem's own code and trace — a figure is
 * a frame of the real run, and annotated code resolves anchors to line
 * numbers — so nothing here can drift from what the instrument shows.
 */
const props = defineProps({
  problem: { type: Object, required: true },
  lesson: { type: Object, required: true },
});
const emit = defineEmits(['jump']);

const at = ref(0);
const steps = computed(() => props.lesson.steps);
const step = computed(() => steps.value[at.value]);
const isLast = computed(() => at.value === steps.value.length - 1);
const go = (i) => { at.value = Math.max(0, Math.min(steps.value.length - 1, i)); };

const codeLines = (source, lang = 'python') =>
  source.split('\n').map((l, i) => ({ n: i + 1, html: highlight(l, lang) }));

// Which part of the code each line belongs to, by anchor — never by number.
const partLines = computed(() => {
  const s = step.value;
  if (!s.parts) return [];
  const approach = props.problem.approachById(s.approach);
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
  const approach = props.problem.approachById(s.grow.approach);
  const { frames } = approach.build(props.problem.parseInput(s.grow.input ?? props.problem.defaultInput));
  return frames.map((f, i) => (f.anchor === 'call' ? i : -1)).filter((i) => i >= 0);
});
const growAt = computed(() => callFrames.value[Math.min(grown.value, callFrames.value.length) - 1] ?? 0);
const grow = () => { if (grown.value < callFrames.value.length) grown.value += 1; };
const regrow = () => { grown.value = 1; };
</script>

<template>
  <section class="lesson" aria-label="Lesson">
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
    </div>
    <p class="lesson-thesis">{{ lesson.heading }}</p>

    <div class="lesson-body">
      <div class="lesson-text">
        <p class="lesson-stepno">Step {{ at + 1 }} of {{ steps.length }}</p>
        <h3>{{ step.title }}</h3>
        <div class="lesson-prose" v-html="step.html" />
        <div v-if="step.jumps" class="lesson-actions">
          <button
            v-for="(j, i) in step.jumps"
            :key="i"
            class="btn"
            type="button"
            @click="emit('jump', j)"
          >{{ j.label }} ›</button>
        </div>
      </div>

      <div class="lesson-visual">
        <pre v-if="step.snippet" class="code lesson-code"><div
          v-for="ln in codeLines(step.snippet.source, step.snippet.lang)"
          :key="ln.n"
          class="cl"
        ><span class="n">{{ ln.n }}</span><span v-html="ln.html" /></div></pre>

        <TraceFigure
          v-else-if="step.figure"
          :problem="problem"
          :approach="step.figure.approach"
          :at="step.figure.at"
          :input="step.figure.input"
          :caption="step.figure.caption"
        />

        <div v-else-if="step.grow" class="lesson-grow">
          <TraceFigure
            :problem="problem"
            :approach="step.grow.approach"
            :at="growAt"
            :input="step.grow.input"
            :caption="`${Math.min(grown, callFrames.length)} of ${callFrames.length} nodes — each one created the moment the DFS reaches it.`"
          />
          <div class="lesson-growbar">
            <button class="btn primary" type="button" :disabled="grown >= callFrames.length" @click="grow">
              {{ grown >= callFrames.length ? 'All grown' : 'Grow' }}
            </button>
            <button class="btn ghost" type="button" @click="regrow">Start over</button>
          </div>
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
    </div>

    <div class="lesson-nav">
      <button class="btn" type="button" :disabled="at === 0" @click="go(at - 1)">‹ Back</button>
      <span v-if="lesson.credit" class="lesson-credit" v-html="lesson.credit" />
      <button
        class="btn primary"
        type="button"
        @click="isLast ? emit('jump', lesson.finish) : go(at + 1)"
      >{{ isLast ? (lesson.finish?.label || 'Play the trace') : 'Next' }} ›</button>
    </div>
  </section>
</template>

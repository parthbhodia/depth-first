<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { layout, LAYOUT } from '#engine/tree.js';
import { layoutCallTree, CALL_LAYOUT } from '#engine/calltree.js';
import { speechRate } from '#engine/speech.js';
import { useTrace } from '~/composables/useTrace.js';
import { useNarration } from '~/composables/useNarration.js';

const props = defineProps({
  problem: { type: Object, required: true },
});

const approachId = ref(props.problem.approaches[0].id);
const langId = ref('python');
const treeText = ref(props.problem.defaultInput);

const approach = computed(() => props.problem.approachById(approachId.value));
const isCallTree = computed(() => props.problem.stage === 'call-tree');

// Each problem owns how its input string becomes a value.
const input = computed(() => props.problem.parseInput(treeText.value));

// Recomputing every frame from scratch on each change is cheap (a few hundred
// objects) and keeps the trace and the picture impossible to desynchronise.
const built = computed(() => approach.value.build(input.value));
const framesRef = computed(() => built.value.frames);

// A binary tree is the INPUT and is known up front. A call tree is the
// EXECUTION — laid out once over every call the run will make, then revealed.
const lay = computed(() => (isCallTree.value
  ? layoutCallTree(built.value.nodes || [], CALL_LAYOUT)
  : layout(input.value, LAYOUT)));

const {
  supported: voiceSupported,
  enabled: voiceOn,
  voices: voiceList,
  voiceURI,
  speak,
  cancel: cancelSpeech,
  toggle: toggleVoice,
  persist: persistVoice,
} = useNarration();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// When narration is on, the sentence sets the pace — the trace waits for the
// voice to finish rather than racing a fixed timer against it.
async function pace(f, speed) {
  if (voiceOn.value && f) {
    const spoke = await speak(f.caption, speechRate(speed));
    await sleep(spoke ? 220 : 950 / speed);
    return;
  }
  await sleep(950 / speed);
}

const { index, playing, speed, frame, frames, last, toggle, step, restart, scrub } =
  useTrace(framesRef, { pace });

// Stepping by hand should read the step you landed on. During playback the
// pacer is already doing the talking, so don't double up.
watch(index, () => {
  if (!voiceOn.value || playing.value) return;
  speak(frame.value?.caption, speechRate(speed.value));
});

watch(playing, (isPlaying) => {
  if (!isPlaying) cancelSpeech();
});

function toggleNarration() {
  toggleVoice();
  // Immediate feedback that the voice works, and on which sentence.
  if (voiceOn.value && !playing.value) {
    speak(frame.value?.caption, speechRate(speed.value));
  }
}

function onVoiceChange() {
  persistVoice();
  if (voiceOn.value && !playing.value) {
    speak(frame.value?.caption, speechRate(speed.value));
  }
}

function readIdea() {
  if (!voiceSupported.value) return;
  voiceOn.value = true;
  speak(approach.value.idea, speechRate(speed.value));
}

const badgeLabel = computed(
  () => props.problem.badgeLabels?.[approachId.value] || 'Value'
);

const panelTitle = computed(() => {
  if (approach.value.stackPanel === 'none') return 'Call stack';
  if (approach.value.stackPanel === 'call') return 'Call stack  (bottom → top)';
  return frame.value?.aux?.title || '';
});

const panelItems = computed(() => {
  if (!frame.value || approach.value.stackPanel === 'none') return [];
  if (approach.value.stackPanel === 'call') return frame.value.callStack || [];
  return frame.value.aux ? frame.value.aux.items : [];
});

const emptyPanelNote = computed(() =>
  approach.value.stackPanel === 'none'
    ? 'none — this version is a loop'
    : 'empty');

const legend = computed(() => {
  if (!isCallTree.value) {
    return [
      { cls: 'a', text: 'executing' },
      { cls: 'p', text: 'on the stack' },
      { cls: 'd', text: `${badgeLabel.value.toLowerCase()} known` },
      { cls: 'g', text: 'null child' },
    ];
  }
  if (!lay.value.nodes.length) return [];
  const out = [
    { cls: 'a', text: 'executing' },
    { cls: 'p', text: 'on the stack' },
    { cls: 'd', text: 'returned' },
  ];
  if (approachId.value === 'memo') out.push({ cls: 'h', text: 'answered from memo' });
  if (lay.value.dupKeys && lay.value.dupKeys.size) {
    out.push({ cls: 'u', text: 'repeated subproblem' });
  }
  return out;
});

const isRow = computed(() => approach.value.stackPanel !== 'call');

function isTop(i) {
  if (approach.value.stackPanel === 'call') return i === panelItems.value.length - 1;
  // A stack is consumed from the end, a queue from the front.
  return frame.value?.aux?.kind === 'stack' ? i === panelItems.value.length - 1 : i === 0;
}

const result = computed(() => {
  const r = frame.value?.result;
  return r === null || r === undefined ? null : r;
});

watch([approachId, treeText], () => {
  cancelSpeech();
  restart();
});

function onKey(e) {
  if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
  else if (e.key === ' ') { e.preventDefault(); toggle(); }
  else if (e.key === 'r' || e.key === 'R') restart();
  else if (e.key === 'v' || e.key === 'V') toggleNarration();
}

onMounted(() => window.addEventListener('keydown', onKey));
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey);
  cancelSpeech();
});
</script>

<template>
  <section class="instrument" aria-label="Algorithm trace">
    <div class="rig-head">
      <div class="tabs">
        <button
          v-for="a in problem.approaches"
          :key="a.id"
          class="tab"
          type="button"
          :aria-pressed="a.id === approachId ? 'true' : 'false'"
          @click="approachId = a.id"
        >{{ a.name }}</button>
      </div>
      <div class="tab-note">{{ approach.time }} time · {{ approach.space }} space</div>
    </div>

    <div class="rig">
      <CodePane
        :code="approach.code"
        :lang="langId"
        :anchor="frame ? frame.anchor : null"
        @update:lang="langId = $event"
      />

      <div class="pane pane-stage">
        <div class="pane-head">
          <span>{{ isCallTree ? 'Call tree' : 'Tree' }}</span>
          <span class="tab-note">{{ badgeLabel }}</span>
        </div>

        <div class="stage-body">
          <CallTreeCanvas v-if="isCallTree" :lay="lay" :frame="frame" />
          <TreeCanvas v-else :lay="lay" :frame="frame" :badge-label="badgeLabel" />

          <DpTable v-if="isCallTree" :frame="frame" />

          <div v-if="legend.length" class="legend">
            <span v-for="l in legend" :key="l.text"><i class="dot" :class="l.cls" />{{ l.text }}</span>
          </div>
        </div>

        <div class="readouts">
          <div class="stackbox">
            <div class="pane-head">{{ panelTitle }}</div>
            <div class="frames" :class="{ row: isRow }">
              <div
                v-for="(f, i) in panelItems"
                :key="f.key || i"
                class="fr"
                :class="{ top: isTop(i), nul: f.isNull }"
              >{{ f.label }}</div>
              <p v-if="!panelItems.length" class="empty-note">{{ emptyPanelNote }}</p>
            </div>
          </div>

          <div class="vars">
            <div class="pane-head">State</div>
            <div v-for="v in (frame ? frame.vars : [])" :key="v.name" class="varrow">
              <b>{{ v.name }}</b><i>{{ v.value }}</i>
            </div>
            <div v-if="frame && frame.returning !== null && frame.returning !== undefined" class="varrow">
              <b>returns</b><i style="color: var(--done)">{{ frame.returning }}</i>
            </div>
            <div class="answer">
              answer
              <strong :class="{ pending: result === null }">{{ result === null ? '—' : result }}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>

    <p class="caption" :class="{ speaking: voiceOn && playing }" aria-live="polite">
      <span class="step">{{ String(index + 1).padStart(2, '0') }} / {{ frames.length }}</span>
      <span>{{ frame ? frame.caption : '' }}</span>
    </p>

    <div class="transport">
      <button class="btn" type="button" title="Restart (R)" @click="restart">⟲ Restart</button>
      <button class="btn" type="button" title="Previous (←)" :disabled="index === 0" @click="step(-1)">‹ Back</button>
      <button class="btn primary" type="button" @click="toggle">{{ playing ? '❚❚ Pause' : '▶ Play' }}</button>
      <button class="btn" type="button" title="Next (→)" :disabled="index === last" @click="step(1)">Next ›</button>
      <input
        type="range"
        min="0"
        :max="last"
        :value="index"
        aria-label="Scrub through steps"
        @input="scrub($event.target.value)"
      >
      <button
        v-if="voiceSupported"
        class="btn narrate"
        type="button"
        title="Read each step aloud (V)"
        :aria-pressed="voiceOn ? 'true' : 'false'"
        @click="toggleNarration"
      >{{ voiceOn ? '🔊' : '🔇' }} Narrate</button>
      <span class="speed">
        <button
          v-for="s in [0.5, 1, 2]"
          :key="s"
          class="lang"
          type="button"
          :aria-pressed="speed === s ? 'true' : 'false'"
          @click="speed = s"
        >{{ s }}×</button>
      </span>
    </div>

    <div class="inputs">
      <label for="tree-arr">{{ problem.inputLabel }}</label>
      <input id="tree-arr" v-model="treeText" type="text" spellcheck="false">
      <button
        v-for="p in problem.presets"
        :key="p.name"
        class="chip"
        type="button"
        @click="treeText = p.arr"
      >{{ p.name }}</button>

      <select
        v-if="voiceSupported && voiceList.length"
        v-model="voiceURI"
        class="voice"
        aria-label="Narration voice"
        @change="onVoiceChange"
      >
        <option v-for="v in voiceList" :key="v.voiceURI" :value="v.voiceURI">
          {{ v.name }}
        </option>
      </select>
    </div>

    <p class="idea">
      <b>
        {{ approach.name }} — the idea
        <button
          v-if="voiceSupported"
          class="hear"
          type="button"
          title="Read this aloud"
          @click="readIdea"
        >🔊 hear it</button>
      </b>
      {{ approach.idea }}
    </p>
  </section>
</template>

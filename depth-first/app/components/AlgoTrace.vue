<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';
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
const isRing = computed(() => props.problem.stage === 'ring');

// Each problem owns how its input string becomes a value.
const input = computed(() => props.problem.parseInput(treeText.value));

// Recomputing every frame from scratch on each change is cheap (a few hundred
// objects) and keeps the trace and the picture impossible to desynchronise.
const built = computed(() => approach.value.build(input.value));
const framesRef = computed(() => built.value.frames);

// A binary tree is the INPUT and is known up front. A call tree is the
// EXECUTION — laid out once over every call the run will make, then revealed.
// The ring canvas reads the frame directly and needs no precomputed layout.
const lay = computed(() => {
  if (isRing.value) return {};
  return isCallTree.value
    ? layoutCallTree(built.value.nodes || [], { ...CALL_LAYOUT, ...(props.problem.callLayout || {}) })
    : layout(input.value, LAYOUT);
});

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

// Set only by problems that carry context down the tree.
const carryLabel = computed(
  () => props.problem.carryLabels?.[approachId.value] || 'Carried in'
);
const usesCarry = computed(() => Boolean(props.problem.carryLabels));

// The note beside the tabs explains the number drawn on the nodes. Where
// context flows down, the carried value is the one worth explaining.
const tabNote = computed(() => {
  if (isRing.value) return '';
  return usesCarry.value ? carryLabel.value : badgeLabel.value;
});

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
  if (isRing.value) {
    if (approachId.value === 'modulo') {
      return [{ cls: 'x', text: 'moved when a server joins' }];
    }
    return [
      { cls: 'ring-os', text: 'oscar' },
      { cls: 'ring-gr', text: 'grid' },
      { cls: 'ring-he', text: 'helm' },
      { cls: 'ring-ec', text: 'echo (added)' },
      { cls: 'x', text: 'key moved' },
    ];
  }
  if (!isCallTree.value) {
    if (usesCarry.value) {
      return [
        { cls: 'a', text: 'executing' },
        { cls: 'c', text: `${carryLabel.value.toLowerCase()} (from above)` },
        { cls: 'd', text: 'good' },
        { cls: 'x', text: 'blocked by an ancestor' },
        { cls: 'g', text: 'null child' },
      ];
    }
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

// The approaches tell a story in order. Numbering them and handing off at the
// end of each trace is what turns three tabs into a sequence you follow.
const approachIndex = computed(() =>
  props.problem.approaches.findIndex((a) => a.id === approachId.value));

const nextApproach = computed(() =>
  props.problem.approaches[approachIndex.value + 1] || null);

// Before the first play the stage is a single inert node — it reads as broken.
// A start cue removes that, and disappears for good once they've engaged.
const started = ref(false);
watch(playing, (v) => { if (v) started.value = true; });
watch(index, (v) => { if (v > 0) started.value = true; });

function startTrace() {
  started.value = true;
  if (!playing.value) toggle();
}

/* ---------- guided tour ----------
   A scripted sequence that drives the instrument rather than talking over it:
   each stop selects an approach, rings the panel under discussion, and either
   plays the trace or jumps to the frame that makes the point. */
const tour = computed(() => props.problem.tour || []);
const tourOn = ref(false);
const tourAt = ref(0);
const tourStop = computed(() => (tourOn.value ? tour.value[tourAt.value] || null : null));
const focusZone = computed(() => (tourStop.value ? tourStop.value.focus : null));

function applyStop() {
  const stop = tourStop.value;
  if (!stop) return;
  if (stop.approach && stop.approach !== approachId.value) approachId.value = stop.approach;
  started.value = true;

  // The approach switch resets frames via the watcher; act after that lands.
  nextTick(() => {
    cancelSpeech();
    if (stop.play) {
      restart();
      if (!playing.value) toggle();
      return;
    }
    stop2(stop);
  });
}

function stop2(stop) {
  if (stop.at === 'last') { scrub(last.value); return; }
  if (typeof stop.at === 'number') { scrub(stop.at); return; }
  if (stop.at && stop.at.anchor) {
    const i = frames.value.findIndex((f) => f.anchor === stop.at.anchor);
    scrub(i >= 0 ? i : 0);
    return;
  }
  if (!stop.play) restart();
}

function startTour() {
  tourOn.value = true;
  tourAt.value = 0;
  applyStop();
}
function tourNext() {
  if (tourAt.value >= tour.value.length - 1) { endTour(); return; }
  tourAt.value += 1;
  applyStop();
}
function tourBack() {
  if (tourAt.value === 0) return;
  tourAt.value -= 1;
  applyStop();
}
function endTour() {
  tourOn.value = false;
  stop();
  cancelSpeech();
}

function goNext() {
  if (!nextApproach.value) return;
  approachId.value = nextApproach.value.id;
  // restart() runs from the frames watcher; play once the new trace is loaded.
  nextTick(() => { started.value = true; toggle(); });
}

const result = computed(() => {
  const r = frame.value?.result;
  return r === null || r === undefined ? null : r;
});

watch(treeText, () => { started.value = false; });
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
      <div class="tabs" :class="{ 'tour-focus': focusZone === 'tabs' }">
        <button
          v-for="(a, i) in problem.approaches"
          :key="a.id"
          class="tab"
          type="button"
          :aria-pressed="a.id === approachId ? 'true' : 'false'"
          @click="approachId = a.id"
        ><i class="tabnum">{{ i + 1 }}</i>{{ a.name }}</button>
      </div>
      <div class="tab-note">{{ approach.time }} time · {{ approach.space }} space</div>
    </div>

    <!-- Controls sit ABOVE the panes: the whole instrument is ~1000px tall, so
         bottom-mounted controls put Play a screen and a half below the fold. -->
    <div class="transport top">
      <button class="btn primary" type="button" @click="toggle">
        {{ playing ? '❚❚ Pause' : (index === 0 ? '▶ Play the trace' : '▶ Resume') }}
      </button>
      <button class="btn" type="button" title="Previous (←)" :disabled="index === 0" @click="step(-1)">‹</button>
      <button class="btn" type="button" title="Next (→)" :disabled="index === last" @click="step(1)">›</button>
      <button class="btn" type="button" title="Restart (R)" @click="restart">⟲</button>
      <span class="stepcount">{{ String(index + 1).padStart(2, '0') }} / {{ frames.length }}</span>
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
      >{{ voiceOn ? '🔊' : '🔇' }}</button>
      <span class="speed">
        <button
          v-for="sp in [0.5, 1, 2]"
          :key="sp"
          class="lang"
          type="button"
          :aria-pressed="speed === sp ? 'true' : 'false'"
          @click="speed = sp"
        >{{ sp }}×</button>
      </span>
    </div>

    <div v-if="tourOn" class="tourbar">
      <span class="tourstep">Tour {{ tourAt + 1 }} / {{ tour.length }}</span>
      <p class="tourtext">{{ tourStop ? tourStop.text : '' }}</p>
      <span class="tournav">
        <button class="btn" type="button" :disabled="tourAt === 0" @click="tourBack">‹ Back</button>
        <button class="btn primary" type="button" @click="tourNext">
          {{ tourAt === tour.length - 1 ? 'Finish' : 'Next ›' }}
        </button>
        <button class="btn ghost" type="button" @click="endTour">Exit</button>
      </span>
    </div>

    <p v-else-if="approach.watchFor" class="watchfor">
      <b>What to watch</b>{{ approach.watchFor }}
      <button v-if="tour.length" class="tourstart" type="button" @click="startTour">
        ✦ Take the guided tour
      </button>
    </p>

    <div class="rig" :class="{ touring: tourOn }">
      <CodePane
        :class="{ 'tour-focus': focusZone === 'code' }"
        :code="approach.code"
        :lang="langId"
        :anchor="frame ? frame.anchor : null"
        @update:lang="langId = $event"
      />

      <div class="pane pane-stage" :class="{ 'tour-focus': focusZone === 'stage' }">
        <div class="pane-head">
          <span>{{ isRing ? (frame && frame.view === 'buckets' ? 'Servers' : 'Hash ring') : (isCallTree ? 'Call tree' : 'Tree') }}</span>
          <span class="tab-note">{{ tabNote }}</span>
        </div>

        <div class="stage-body">
          <button v-if="!started" class="startcue" type="button" @click="startTrace">
            <span class="startcue-btn">▶</span>
            <b>Play the trace</b>
            <em>{{ frames.length }} steps · or press space</em>
          </button>

          <RingCanvas v-if="isRing" :frame="frame" />
          <CallTreeCanvas v-else-if="isCallTree" :lay="lay" :frame="frame" />
          <TreeCanvas v-else :lay="lay" :frame="frame" :badge-label="badgeLabel" :carry-label="carryLabel" />

          <DpTable v-if="isCallTree" :frame="frame" :class="{ 'tour-focus': focusZone === 'dp' }" />

          <div v-if="legend.length" class="legend">
            <span v-for="l in legend" :key="l.text"><i class="dot" :class="l.cls" />{{ l.text }}</span>
          </div>
        </div>

        <div class="readouts">
          <div class="stackbox" :class="{ 'tour-focus': focusZone === 'stack' }">
            <div class="pane-head">{{ panelTitle }}</div>
            <div class="frames" :class="{ row: isRow }">
              <div
                v-for="(f, i) in panelItems"
                :key="f.key || i"
                class="fr"
                :class="{ top: isTop(i), nul: f.isNull }"
              >
                <span class="fr-lbl">{{ f.label }}</span>
                <span v-if="f.locals" class="fr-locals">
                  <i v-for="l in f.locals" :key="l.name">{{ l.name }}<b>{{ l.value }}</b></i>
                </span>
              </div>
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
      <span>{{ frame ? frame.caption : '' }}</span>
    </p>

    <div v-if="index === last && nextApproach" class="handoff">
      <span>That's the whole trace.</span>
      <button class="btn primary" type="button" @click="goNext">
        Next: {{ nextApproach.name }} →
      </button>
      <span class="handoff-why">{{ nextApproach.tagline }}</span>
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

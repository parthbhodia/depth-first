import { ref, computed, watch, onBeforeUnmount } from 'vue';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Playback state over a list of pre-computed frames.
 *
 * The algorithm has already run by the time this sees anything — `frames` is a
 * plain array. That is what makes stepping backwards, scrubbing and speed
 * control trivial: there is no execution to rewind, only an index to move.
 *
 * @param framesRef  ref/computed holding the frame array
 * @param options.pace  optional async (frame, speed) => void. Resolve when it is
 *   time to advance. Narration uses this so the trace waits for the sentence to
 *   finish instead of racing a fixed timer.
 */
export function useTrace(framesRef, options = {}) {
  const index = ref(0);
  const playing = ref(false);
  const speed = ref(1);

  // Every play session gets an id; a stale loop sees the id change and exits.
  let runId = 0;

  const frames = computed(() => framesRef.value || []);
  const last = computed(() => Math.max(0, frames.value.length - 1));
  const frame = computed(() => frames.value[Math.min(index.value, last.value)] || null);
  const atEnd = computed(() => index.value >= last.value);

  function stop() {
    runId += 1;
    playing.value = false;
  }

  async function run() {
    const id = ++runId;
    while (playing.value && id === runId && !atEnd.value) {
      if (options.pace) await options.pace(frame.value, speed.value);
      else await sleep(950 / speed.value);

      if (!playing.value || id !== runId) return;
      index.value += 1;
    }
    if (id === runId) stop();
  }

  function toggle() {
    if (playing.value) { stop(); return; }
    if (atEnd.value) index.value = 0;
    playing.value = true;
    run();
  }

  function step(delta) {
    stop();
    index.value = Math.max(0, Math.min(last.value, index.value + delta));
  }

  function restart() {
    stop();
    index.value = 0;
  }

  function scrub(v) {
    stop();
    index.value = Math.max(0, Math.min(last.value, Number(v)));
  }

  // A new frame list means a different algorithm or a different tree.
  watch(frames, () => restart());

  onBeforeUnmount(stop);

  return { index, playing, speed, frame, frames, last, atEnd, toggle, step, restart, scrub, stop };
}

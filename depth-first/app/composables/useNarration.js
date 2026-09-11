import { ref, shallowRef, onMounted, onBeforeUnmount } from 'vue';
import { toSpeech, toSentences } from '#engine/speech.js';

const STORE_KEY = 'depthfirst.narration';

/*
 * Voice ranking. The browser hands us every voice the OS has, in an order
 * that differs per browser, and "first English voice" can be a British
 * accent or one of Apple's joke voices. So: score them, and never auto-pick
 * anything that is not a real narrating voice.
 */

// Apple's novelty and legacy voices. Fun; not for a lesson.
const NOVELTY = /^(albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|jester|junior|organ|pipe organ|superstar|trinoids|whisper|wobble|zarvox|fred|ralph|kathy|bruce|agnes|vicki|victoria|princess)\b/i;
// The platform's own "better" tier: Apple Enhanced/Premium, Microsoft Natural, anything neural.
const HIGH = /premium|enhanced|natural|neural/i;
// Cloud voices — clearly more human than the compact local ones.
const CLOUD = /google|microsoft .*online/i;
// The standard, good local voices on Apple platforms.
const CLASSIC = /^(samantha|alex|ava|allison|zoe|nicky|tom|aaron|nathan|evan|joelle|susan|noelle|daniel|kate|serena|oliver|arthur|martha|karen|lee|catherine|moira|fiona|rishi|aman|tara|tessa)\b/i;

function score(v) {
  if (NOVELTY.test(v.name)) return -1;
  let s = 0;
  if (HIGH.test(v.name)) s += 100;
  else if (CLOUD.test(v.name)) s += 80;
  else if (/microsoft/i.test(v.name)) s += 40;
  if (CLASSIC.test(v.name)) s += 30;
  if (v.default) s += 20;
  // US English is the accent most listeners follow most easily. Any other
  // English voice is still one click away in the picker.
  if (/^en[-_]?us/i.test(v.lang)) s += 25;
  return s;
}

/**
 * Speech narration over the trace, using the browser's own voices.
 *
 * Deliberately not a recorded voiceover: captions are generated per frame from
 * whatever tree the viewer typed in, so there is nothing to pre-record. This
 * also means narration covers every approach, every language and every custom
 * input for free — and ships zero bytes of audio.
 */
export function useNarration() {
  const supported = ref(false);
  const enabled = ref(false);
  const voices = shallowRef([]);
  const voiceURI = ref('');

  let detach = null;
  // Bumped by every speak() and cancel(); a running sentence loop that sees
  // the number change knows it has been superseded.
  let turn = 0;

  function loadVoices() {
    const all = window.speechSynthesis.getVoices() || [];
    const ranked = all
      .filter((v) => /^en/i.test(v.lang) && score(v) >= 0)
      .sort((a, b) => score(b) - score(a) || a.name.localeCompare(b.name));
    voices.value = ranked;
    if (!ranked.length) return;
    // Best voice by default; also the fallback when a saved choice is not on
    // this device (the list differs per browser).
    if (!ranked.some((v) => v.voiceURI === voiceURI.value)) {
      voiceURI.value = ranked[0].voiceURI;
    }
  }

  onMounted(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    supported.value = true;

    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
      if (saved.voiceURI) voiceURI.value = saved.voiceURI;
      // `enabled` is never restored — audio must not start on its own.
    } catch { /* private mode, blocked storage — fine */ }

    loadVoices();
    // Chrome populates the voice list asynchronously.
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    detach = () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
  });

  onBeforeUnmount(() => {
    if (detach) detach();
    cancel();
  });

  function persist() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ voiceURI: voiceURI.value }));
    } catch { /* ignore */ }
  }

  function cancel() {
    turn += 1;
    if (!supported.value) return;
    try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
  }

  /**
   * Speaks the text one sentence at a time. Resolves when the last sentence
   * finishes, or with false if it was cut off or superseded — never rejects.
   */
  function speak(text, rate = 1) {
    return new Promise((resolve) => {
      if (!supported.value || !enabled.value || !text) return resolve(false);
      const sentences = toSentences(toSpeech(text));
      if (!sentences.length) return resolve(false);

      cancel();
      const mine = turn;
      const voice = voices.value.find((x) => x.voiceURI === voiceURI.value);

      let done = false;
      let guard = null;
      const finish = (ok) => {
        if (done) return;
        done = true;
        if (guard) clearTimeout(guard);
        resolve(ok);
      };

      let i = 0;
      const next = () => {
        if (mine !== turn) return finish(false);
        if (i >= sentences.length) return finish(true);

        const u = new SpeechSynthesisUtterance(sentences[i++]);
        if (voice) { u.voice = voice; u.lang = voice.lang; }
        u.rate = Math.min(2, Math.max(0.6, rate));
        // A short breath between sentences.
        u.onend = () => setTimeout(next, 120);
        u.onerror = () => finish(false);
        // Chrome occasionally drops an utterance silently. Don't hang the trace on it.
        if (guard) clearTimeout(guard);
        guard = setTimeout(() => finish(false), 15000);

        try { window.speechSynthesis.speak(u); } catch { finish(false); }
      };

      // cancel() immediately followed by speak() is flaky in Chrome; give it a tick.
      setTimeout(next, 60);
    });
  }

  function toggle() {
    enabled.value = !enabled.value;
    if (!enabled.value) cancel();
  }

  return { supported, enabled, voices, voiceURI, speak, cancel, toggle, persist };
}

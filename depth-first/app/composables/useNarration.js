import { ref, shallowRef, onMounted, onBeforeUnmount } from 'vue';
import { toSpeech } from '#engine/speech.js';

const STORE_KEY = 'depthfirst.narration';

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

  function loadVoices() {
    const all = window.speechSynthesis.getVoices() || [];
    voices.value = all.filter((v) => /^en/i.test(v.lang));
    if (!voiceURI.value && voices.value.length) {
      // Prefer the higher-quality system voices when the platform has them.
      const nice = voices.value.find((v) => /natural|neural|premium|enhanced|google|samantha|daniel/i.test(v.name));
      voiceURI.value = (nice || voices.value[0]).voiceURI;
    }
  }

  onMounted(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    supported.value = true;
    loadVoices();
    // Chrome populates the voice list asynchronously.
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);
    detach = () => window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);

    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
      if (saved.voiceURI) voiceURI.value = saved.voiceURI;
      // `enabled` is never restored — audio must not start on its own.
    } catch { /* private mode, blocked storage — fine */ }
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
    if (!supported.value) return;
    try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
  }

  /** Resolves when the utterance finishes (or fails) — never rejects. */
  function speak(text, rate = 1) {
    return new Promise((resolve) => {
      if (!supported.value || !enabled.value || !text) return resolve(false);
      const phrase = toSpeech(text);
      if (!phrase) return resolve(false);

      cancel();

      const u = new SpeechSynthesisUtterance(phrase);
      const v = voices.value.find((x) => x.voiceURI === voiceURI.value);
      if (v) { u.voice = v; u.lang = v.lang; }
      u.rate = Math.min(2, Math.max(0.6, rate));

      let done = false;
      let guard = null;
      const finish = (ok) => {
        if (done) return;
        done = true;
        if (guard) clearTimeout(guard);
        resolve(ok);
      };
      u.onend = () => finish(true);
      u.onerror = () => finish(false);
      // Chrome occasionally drops an utterance silently. Don't hang the trace on it.
      guard = setTimeout(() => finish(false), 15000);

      // cancel() immediately followed by speak() is flaky in Chrome; give it a tick.
      setTimeout(() => {
        try { window.speechSynthesis.speak(u); } catch { finish(false); }
      }, 60);
    });
  }

  function toggle() {
    enabled.value = !enabled.value;
    if (!enabled.value) cancel();
  }

  return { supported, enabled, voices, voiceURI, speak, cancel, toggle, persist };
}

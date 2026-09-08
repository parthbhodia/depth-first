<script setup>
import { computed } from 'vue';
import { highlight } from '#engine/highlight.js';
import { languages } from '#engine/languages.js';

const props = defineProps({
  code: { type: Object, required: true }, // { [langId]: { source, anchors } }
  lang: { type: String, required: true },
  anchor: { type: String, default: null },
});

const emit = defineEmits(['update:lang']);

const activeLine = computed(() => {
  const entry = props.code[props.lang];
  return entry && props.anchor ? entry.anchors[props.anchor] : null;
});

const lines = computed(() => {
  const entry = props.code[props.lang];
  if (!entry) return [];
  return entry.source.split('\n').map((l, i) => ({ n: i + 1, html: highlight(l, props.lang) }));
});
</script>

<template>
  <div class="pane pane-code">
    <div class="pane-head">
      <span>Source</span>
      <span class="langs">
        <button
          v-for="l in languages"
          :key="l.id"
          class="lang"
          type="button"
          :aria-pressed="l.id === lang ? 'true' : 'false'"
          @click="emit('update:lang', l.id)"
        >{{ l.name }}</button>
      </span>
    </div>
    <pre class="code"><div
      v-for="ln in lines"
      :key="ln.n"
      class="cl"
      :class="{ on: ln.n === activeLine }"
    ><span class="n">{{ ln.n }}</span><span v-html="ln.html" /></div></pre>
  </div>
</template>

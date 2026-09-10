<script setup>
import { computed } from 'vue';

const props = defineProps({
  frame: { type: Object, default: null },
});

const memoEntries = computed(() => {
  const m = props.frame && props.frame.memo;
  if (!m) return null;
  return Object.keys(m)
    .map(Number)
    .sort((a, b) => a - b)
    .map((k) => ({ k, v: m[k] }));
});

const probe = computed(() => (props.frame && props.frame.memoProbe) || null);
const cells = computed(() => (props.frame && props.frame.table) || null);
// Problems whose answer is a collection (subsets, permutations, combinations)
// fill this instead of a memo: the list growing IS half the explanation.
const collected = computed(() => (props.frame && props.frame.collected) || null);
const focus = computed(() => (props.frame && props.frame.tableFocus));
const deps = computed(() => (props.frame && props.frame.tableDeps) || []);

const memoClass = (k) => ({
  probing: probe.value && probe.value.key === k && !probe.value.wrote,
  hit: probe.value && probe.value.key === k && probe.value.hit,
  wrote: probe.value && probe.value.key === k && probe.value.wrote,
});

const cellClass = (c) => ({
  set: c.set,
  focus: focus.value === c.i,
  dep: deps.value.includes(c.i),
});
</script>

<template>
  <div v-if="memoEntries || cells || collected" class="dp">
    <!-- Top-down: the memo, filling from the bottom of the recursion upward. -->
    <div v-if="memoEntries" class="dp-row">
      <span class="dp-label">memo</span>
      <div class="dp-cells">
        <span
          v-if="!memoEntries.length"
          class="dp-empty"
          :class="{ probing: probe && !probe.hit }"
        >empty</span>
        <span
          v-for="e in memoEntries"
          :key="'m' + e.k"
          class="dp-chip"
          :class="memoClass(e.k)"
        ><b>{{ e.k }}</b>{{ e.v }}</span>
        <span
          v-if="probe && !probe.hit && !probe.wrote"
          class="dp-chip miss"
        ><b>{{ probe.key }}</b>?</span>
      </div>
    </div>

    <!-- Collections: res filling up, newest entry flashing as it lands. -->
    <div v-if="collected" class="dp-row">
      <span class="dp-label">{{ collected.label }}</span>
      <div class="dp-cells">
        <span v-if="!collected.items.length" class="dp-empty">empty</span>
        <span
          v-for="(item, i) in collected.items"
          :key="'g' + i"
          class="dp-chip out"
          :class="{ wrote: collected.justAdded === i }"
        >{{ item }}</span>
      </div>
    </div>

    <!-- Bottom-up: the array itself, and what each cell was read from. -->
    <div v-if="cells" class="dp-row">
      <span class="dp-label">dp</span>
      <div class="dp-cells">
        <span v-for="c in cells" :key="'c' + c.i" class="dp-cell" :class="cellClass(c)">
          <i>{{ c.i }}</i>
          <b>{{ c.set ? c.v : '·' }}</b>
        </span>
      </div>
    </div>
  </div>
</template>

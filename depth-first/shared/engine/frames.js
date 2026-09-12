/**
 * frames.js — the few things every call-tree frame builder needs.
 *
 * A frame is a plain object the instrument reads field by field; `blank`
 * carries every field the panels look at so a builder only writes the ones
 * that changed. The formatters keep on-screen and spoken forms consistent
 * across problems: "[1,2]" for the eye, "1 and 2" for the ear.
 */
export const blank = {
  callStack: null, path: [], active: null, returns: {},
  memoHits: [], memo: null, memoProbe: null, revealed: 0,
  table: null, tableFocus: null, tableDeps: null,
  collected: null,
  vars: [], result: null, flash: null, dupNote: null,
};

export const fmt = (a) => (a.length ? `[${a.join(',')}]` : '[ ]');
export const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
export const words = (a) => (a.length ? a.join(', ').replace(/, ([^,]*)$/, ' and $1') : 'empty');
export const named = (a, noun) => (a.length ? `the ${noun} ${words(a)}` : `the empty ${noun}`);

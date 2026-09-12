/**
 * algorithms.js — LeetCode 46, instrumented two ways.
 *
 * Subsets where order matters. Two things move: the loop starts at 0 every
 * time (any unused number may come next), so a `used` set has to stop a
 * number being placed twice; and an answer is complete only when every
 * number has been placed, so the record moves to the leaves.
 *
 *   used  — loop from 0, skip what is used, record at the leaves. First tab.
 *   swap  — fill position `first` by swapping each later number into it.
 *           No extra list, no used array: the array itself is the state.
 */
import { blank, fmt, plural, words, named } from '#engine/frames.js';

/* ------------------------------------------------------------------ */
/* Source, per language, with a line anchor per semantic step          */
/* ------------------------------------------------------------------ */

const usedCode = {
  python: {
    source: `class Solution:
    def permute(self, nums: list[int]) -> list[list[int]]:
        res = []
        self.backtrack(nums, [], [False] * len(nums), res)
        return res

    def backtrack(self, nums, curr, used, res):
        # Q1 — complete answer? Every number has been placed.
        if len(curr) == len(nums):
            res.append(list(curr))
            return

        # Q2 — what choices do I have? Any number not used yet.
        for i in range(len(nums)):
            if used[i]:
                continue
            used[i] = True
            curr.append(nums[i])
            self.backtrack(nums, curr, used, res)
            curr.pop()
            used[i] = False`,
    anchors: { start: 4, call: 7, check: 9, record: 10, loop: 14, skip: 15, choose: 18, recurse: 19, unchoose: 20, done: 5 },
  },
  javascript: {
    source: `var permute = function(nums) {
    const res = [];
    const used = new Array(nums.length).fill(false);

    const backtrack = (curr) => {
        // Q1 — complete answer? Every number has been placed.
        if (curr.length === nums.length) {
            res.push([...curr]);
            return;
        }

        // Q2 — what choices do I have? Any number not used yet.
        for (let i = 0; i < nums.length; i++) {
            if (used[i]) continue;
            used[i] = true;
            curr.push(nums[i]);
            backtrack(curr);
            curr.pop();
            used[i] = false;
        }
    };

    backtrack([]);
    return res;
};`,
    anchors: { start: 23, call: 5, check: 7, record: 8, loop: 13, skip: 14, choose: 16, recurse: 17, unchoose: 18, done: 24 },
  },
  java: {
    source: `class Solution {
    public List<List<Integer>> permute(int[] nums) {
        List<List<Integer>> res = new ArrayList<>();
        backtrack(nums, new ArrayList<>(), new boolean[nums.length], res);
        return res;
    }

    private void backtrack(int[] nums, List<Integer> curr,
                           boolean[] used, List<List<Integer>> res) {
        // Q1 — complete answer? Every number has been placed.
        if (curr.size() == nums.length) {
            res.add(new ArrayList<>(curr));
            return;
        }

        // Q2 — what choices do I have? Any number not used yet.
        for (int i = 0; i < nums.length; i++) {
            if (used[i]) continue;
            used[i] = true;
            curr.add(nums[i]);
            backtrack(nums, curr, used, res);
            curr.remove(curr.size() - 1);
            used[i] = false;
        }
    }
}`,
    anchors: { start: 4, call: 8, check: 11, record: 12, loop: 17, skip: 18, choose: 20, recurse: 21, unchoose: 22, done: 5 },
  },
  cpp: {
    source: `class Solution {
public:
    vector<vector<int>> permute(vector<int>& nums) {
        vector<vector<int>> res;
        vector<int> curr;
        vector<bool> used(nums.size(), false);
        backtrack(nums, curr, used, res);
        return res;
    }

    void backtrack(vector<int>& nums, vector<int>& curr,
                   vector<bool>& used, vector<vector<int>>& res) {
        // Q1 — complete answer? Every number has been placed.
        if (curr.size() == nums.size()) {
            res.push_back(curr);
            return;
        }

        // Q2 — what choices do I have? Any number not used yet.
        for (int i = 0; i < nums.size(); i++) {
            if (used[i]) continue;
            used[i] = true;
            curr.push_back(nums[i]);
            backtrack(nums, curr, used, res);
            curr.pop_back();
            used[i] = false;
        }
    }
};`,
    anchors: { start: 7, call: 11, check: 14, record: 15, loop: 20, skip: 21, choose: 23, recurse: 24, unchoose: 25, done: 8 },
  },
};

const swapCode = {
  python: {
    source: `class Solution:
    def permute(self, nums: list[int]) -> list[list[int]]:
        res = []
        self.backtrack(0, nums, res)
        return res

    def backtrack(self, first, nums, res):
        # Q1 — complete answer? Every position has been filled.
        if first == len(nums):
            res.append(list(nums))
            return

        # Q2 — what choices do I have? Any number not yet placed,
        # swapped into position first.
        for i in range(first, len(nums)):
            nums[first], nums[i] = nums[i], nums[first]
            self.backtrack(first + 1, nums, res)
            nums[first], nums[i] = nums[i], nums[first]`,
    anchors: { start: 4, call: 7, check: 9, record: 10, loop: 15, swap: 16, recurse: 17, unswap: 18, done: 5 },
  },
  javascript: {
    source: `var permute = function(nums) {
    const res = [];

    const backtrack = (first) => {
        // Q1 — complete answer? Every position has been filled.
        if (first === nums.length) {
            res.push([...nums]);
            return;
        }

        // Q2 — what choices do I have? Any number not yet placed,
        // swapped into position first.
        for (let i = first; i < nums.length; i++) {
            [nums[first], nums[i]] = [nums[i], nums[first]];
            backtrack(first + 1);
            [nums[first], nums[i]] = [nums[i], nums[first]];
        }
    };

    backtrack(0);
    return res;
};`,
    anchors: { start: 20, call: 4, check: 6, record: 7, loop: 13, swap: 14, recurse: 15, unswap: 16, done: 21 },
  },
  java: {
    source: `class Solution {
    public List<List<Integer>> permute(int[] nums) {
        List<List<Integer>> res = new ArrayList<>();
        backtrack(0, nums, res);
        return res;
    }

    private void backtrack(int first, int[] nums, List<List<Integer>> res) {
        // Q1 — complete answer? Every position has been filled.
        if (first == nums.length) {
            List<Integer> copy = new ArrayList<>();
            for (int x : nums) copy.add(x);
            res.add(copy);
            return;
        }

        // Q2 — what choices do I have? Any number not yet placed,
        // swapped into position first.
        for (int i = first; i < nums.length; i++) {
            swap(nums, first, i);
            backtrack(first + 1, nums, res);
            swap(nums, first, i);
        }
    }

    private void swap(int[] a, int i, int j) { int t = a[i]; a[i] = a[j]; a[j] = t; }
}`,
    anchors: { start: 4, call: 8, check: 10, record: 13, loop: 19, swap: 20, recurse: 21, unswap: 22, done: 5 },
  },
  cpp: {
    source: `class Solution {
public:
    vector<vector<int>> permute(vector<int>& nums) {
        vector<vector<int>> res;
        backtrack(0, nums, res);
        return res;
    }

    void backtrack(int first, vector<int>& nums, vector<vector<int>>& res) {
        // Q1 — complete answer? Every position has been filled.
        if (first == nums.size()) {
            res.push_back(nums);
            return;
        }

        // Q2 — what choices do I have? Any number not yet placed,
        // swapped into position first.
        for (int i = first; i < nums.size(); i++) {
            swap(nums[first], nums[i]);
            backtrack(first + 1, nums, res);
            swap(nums[first], nums[i]);
        }
    }
};`,
    anchors: { start: 5, call: 9, check: 11, record: 12, loop: 18, swap: 19, recurse: 20, unswap: 21, done: 6 },
  },
};

/* ------------------------------------------------------------------ */
/* Frame builders                                                      */
/* ------------------------------------------------------------------ */

const perm = (a) => named(a, 'permutation');

/* 1. Loop from 0, skip what is used, record at the leaves. */

function usedFrames(nums) {
  const frames = [];
  const nodes = [];
  const stack = [];
  const returns = {};
  const res = [];
  const curr = [];
  const used = nums.map(() => false);
  let nextId = 0;
  let flashAdd = false;

  const usedList = () => fmt(nums.filter((_, k) => used[k]));
  const snap = (anchor, caption, extra = {}) => {
    frames.push({
      ...blank,
      anchor,
      caption,
      callStack: stack.map((f) => ({
        label: f.label,
        nodeId: f.id,
        locals: [{ name: 'i', value: f.i }],
      })),
      path: stack.map((f) => f.id),
      returns: { ...returns },
      revealed: nextId,
      collected: {
        label: 'res',
        items: res.map(fmt),
        justAdded: flashAdd ? res.length - 1 : null,
      },
      vars: [
        { name: 'curr', value: fmt(curr) },
        { name: 'used', value: usedList() },
      ],
      ...extra,
    });
    flashAdd = false;
  };

  function go(parentId, depth) {
    const id = nextId++;
    const label = fmt(curr);
    nodes.push({ id, parentId, key: String(id), label, depth });
    const fr = { id, label, i: '—' };
    stack.push(fr);

    snap('call', depth === 0
      ? `Start: nothing placed yet, so every number is available.`
      : `New frame. curr is ${fmt(curr)}; ${plural(nums.length - curr.length, 'number')} still unplaced.`,
    { active: id, flash: 'call', key: depth === 0, spoken: depth === 0 ? null : `New frame. curr is ${words(curr)}; ${plural(nums.length - curr.length, 'number')} still unplaced.` });

    const mark = res.length;

    if (curr.length === nums.length) {
      snap('check', `Q1 — complete answer? All ${nums.length} numbers are placed. Yes.`, { active: id });
      res.push([...curr]);
      flashAdd = true;
      returns[id] = 1;
      snap('record', `Record ${fmt(curr)} and return.`, { active: id, flash: 'best', key: true, spoken: `Record ${perm(curr)} and return.` });
      stack.pop();
      return;
    }

    snap('check', `Q1 — complete answer? Only ${curr.length} of ${nums.length} placed. Keep going.`, { active: id });

    for (let i = 0; i < nums.length; i++) {
      fr.i = i;
      if (used[i]) {
        snap('skip', `nums[${i}] = ${nums[i]} is already in curr. Skip it — a number goes in once.`, { active: id });
        continue;
      }
      snap('loop', i === 0 || curr.length === 0
        ? `Q2 — what choices do I have? Any number not used yet. The loop starts at 0 every time: order matters, so an earlier number may still come later.`
        : `Next unused number: ${nums[i]}.`,
      { active: id });

      used[i] = true;
      curr.push(nums[i]);
      snap('choose', `Place ${nums[i]}. curr is now ${fmt(curr)}; mark it used.`, { active: id, flash: 'call', spoken: `Place ${nums[i]}. curr is now ${words(curr)}; mark it used.` });

      go(id, depth + 1);

      snap('recurse', `Back from that call, still on i = ${i}.`, { active: id });

      curr.pop();
      used[i] = false;
      snap('unchoose', `Pop ${nums[i]} and mark it unused. curr is back to ${fmt(curr)}.`, { active: id, flash: 'return', key: true, spoken: `Pop ${nums[i]} and mark it unused. curr is back to ${words(curr)}.` });
    }

    fr.i = 'done';
    returns[id] = res.length - mark;
    snap('loop', `Every number tried in this position. This frame produced ${plural(res.length - mark, 'permutation')}.`, { active: id, flash: 'return' });
    stack.pop();
  }

  go(null, 0);

  frames.push({
    ...blank,
    anchor: 'done',
    caption: `Done: ${plural(res.length, 'permutation')} — that is ${nums.length}!. Every leaf of the tree is one answer, and no answer appears twice.`,
    spoken: `Done: ${plural(res.length, 'permutation')}, that is ${nums.length} factorial. Every leaf of the tree is one answer, and no answer appears twice.`,
    callStack: [],
    returns: { ...returns },
    revealed: nodes.length,
    collected: { label: 'res', items: res.map(fmt), justAdded: null },
    vars: [{ name: 'curr', value: '[ ]' }, { name: 'used', value: '[ ]' }],
    result: res.length,
    flash: 'done',
    key: true,
  });

  return { frames, answer: res.length, nodes, perms: res };
}

/* 2. Swap each later number into position `first`; the array is the state. */

function swapFrames(input) {
  const nums = [...input];
  const frames = [];
  const nodes = [];
  const stack = [];
  const returns = {};
  const res = [];
  let nextId = 0;
  let flashAdd = false;

  const snap = (anchor, caption, first, extra = {}) => {
    frames.push({
      ...blank,
      anchor,
      caption,
      callStack: stack.map((f) => ({
        label: f.label,
        nodeId: f.id,
        locals: [
          { name: 'first', value: f.first },
          { name: 'i', value: f.i },
        ],
      })),
      path: stack.map((f) => f.id),
      returns: { ...returns },
      revealed: nextId,
      collected: {
        label: 'res',
        items: res.map(fmt),
        justAdded: flashAdd ? res.length - 1 : null,
      },
      vars: [
        { name: 'nums', value: fmt(nums) },
        { name: 'fixed', value: fmt(nums.slice(0, first)) },
      ],
      ...extra,
    });
    flashAdd = false;
  };

  function go(first, parentId, depth) {
    const id = nextId++;
    const label = fmt(nums);
    nodes.push({ id, parentId, key: String(id), label, depth });
    const fr = { id, label, first, i: '—' };
    stack.push(fr);

    snap('call', depth === 0
      ? `Start. Nothing is fixed yet; the whole array is still up for grabs.`
      : `New frame: positions before ${first} are fixed — ${fmt(nums.slice(0, first))} — and the rest may still move.`,
    first, { active: id, flash: 'call', key: depth === 0, spoken: depth === 0 ? null : `New frame: positions before ${first} are fixed, ${words(nums.slice(0, first))}, and the rest may still move.` });

    const mark = res.length;

    if (first === nums.length) {
      snap('check', `Q1 — complete answer? Every position is filled. Yes.`, first, { active: id });
      res.push([...nums]);
      flashAdd = true;
      returns[id] = 1;
      snap('record', `Record ${fmt(nums)} — the array itself, copied — and return.`, first, { active: id, flash: 'best', key: true, spoken: `Record ${perm(nums)}, the array itself, copied, and return.` });
      stack.pop();
      return;
    }

    snap('check', `Q1 — complete answer? Position ${first} is still open. Keep going.`, first, { active: id });

    for (let i = first; i < nums.length; i++) {
      fr.i = i;
      snap('loop', i === first
        ? `Q2 — what choices do I have? Any of the unplaced numbers, ${words(nums.slice(first))}, can take position ${first}. First: leave ${nums[first]} where it is.`
        : `Next: bring ${nums[i]} into position ${first}.`,
      first, { active: id });

      [nums[first], nums[i]] = [nums[i], nums[first]];
      snap('swap', i === first
        ? `Swap position ${first} with itself — nums is unchanged, ${fmt(nums)}. Position ${first} is now fixed.`
        : `Swap positions ${first} and ${i}. nums becomes ${fmt(nums)}; position ${first} is now fixed.`,
      first, { active: id, flash: 'call', spoken: i === first ? `Swap position ${first} with itself, so nums is unchanged. Position ${first} is now fixed.` : `Swap positions ${first} and ${i}. nums becomes ${words(nums)}; position ${first} is now fixed.` });

      go(first + 1, id, depth + 1);

      snap('recurse', `Back from that call, still on i = ${i}.`, first, { active: id });

      [nums[first], nums[i]] = [nums[i], nums[first]];
      snap('unswap', `Swap back. nums is ${fmt(nums)} again — exactly as this frame received it.`, first,
        { active: id, flash: 'return', key: true, spoken: `Swap back. nums is ${words(nums)} again, exactly as this frame received it.` });
    }

    fr.i = 'done';
    returns[id] = res.length - mark;
    snap('loop', `Every number has taken position ${first} once. This frame produced ${plural(res.length - mark, 'permutation')}.`, first, { active: id, flash: 'return' });
    stack.pop();
  }

  go(0, null, 0);

  frames.push({
    ...blank,
    anchor: 'done',
    caption: `Done: ${plural(res.length, 'permutation')} — ${nums.length}! — and nums is back to ${fmt(nums)}, because every swap was undone.`,
    spoken: `Done: ${plural(res.length, 'permutation')}, ${nums.length} factorial, and nums is back to ${words(nums)}, because every swap was undone.`,
    callStack: [],
    returns: { ...returns },
    revealed: nodes.length,
    collected: { label: 'res', items: res.map(fmt), justAdded: null },
    vars: [{ name: 'nums', value: fmt(nums) }, { name: 'fixed', value: '[ ]' }],
    result: res.length,
    flash: 'done',
    key: true,
  });

  return { frames, answer: res.length, nodes, perms: res };
}

/* ------------------------------------------------------------------ */
/* Complexity, stated and then counted on the trace (see ComplexityPanel) */
/* ------------------------------------------------------------------ */

const sizeOf = (nums) => ({ n: nums.length, label: `nums = [${nums.join(',')}], so n = ${nums.length}` });
const lead = (m) => `Counted on ${m.label}. Change the input in the trace above and every number here follows.`;

const usedComplexity = {
  size: sizeOf,
  lead,
  time: {
    bound: 'O(n · n!)',
    count: 'product',
    iterationAnchors: ['choose', 'skip'],
    story: [
      (m) => `Position 1 can take any of the ${m.n} numbers, position 2 any of the ${m.n - 1} left, and so on: ${m.n}! = ${m.leaves} complete orderings, one per leaf.`,
      (m) => `Every leaf copies its ${m.n} numbers into the result: ${m.leaves} × ${m.n} = ${m.leaves * m.n} element writes. That is the <code>n · n!</code>.`,
      'The loop is the same order. A frame runs it n times whatever its depth — used numbers are skipped, not avoided — and there are fewer than e · n! frames in total, so the loop work is also O(n · n!).',
    ],
    final: (m) => `${m.leaves} leaves × ${m.n} to copy each = ${m.leaves * m.n}.`,
    loops: [
      {
        anchor: 'loop',
        runs: (m) => `<code>n = ${m.n}</code> times in every non-leaf frame, no matter how deep — the used numbers are skipped inside the loop, not left out of it.`,
        measured: (m) => `${m.iterations} iterations across ${m.calls - m.leaves} non-leaf frames: ${m.by.choose || 0} placed a number, ${m.by.skip || 0} skipped a used one.`,
      },
    ],
    note: 'Say the factorial first, then the copy. Quoting O(n!) alone is the same small miss as forgetting the copy on Subsets.',
  },
  space: {
    bound: 'O(n)',
    story: [
      (m) => `The stack is never deeper than n + 1 = ${m.n + 1} frames: one per number placed, plus the leaf that records.`,
      (m) => `<code>curr</code> holds at most n = ${m.n} numbers and <code>used</code> is n flags. Both are shared by every branch and put back on the way up — never copied per frame.`,
      'The result is n · n! numbers, but that is the output you were asked for, not working memory.',
    ],
    measured: (m) => [
      ['Deepest stack', `${m.maxDepth} frames`],
      ['Frames created in total', `${m.calls}`],
      ['Permutations recorded', `${m.answers}`],
    ],
  },
};

const swapComplexity = {
  size: sizeOf,
  lead,
  time: {
    bound: 'O(n · n!)',
    count: 'product',
    iterationAnchors: ['swap'],
    story: [
      (m) => `Position 0 has ${m.n} candidates, position 1 has ${m.n - 1}, and so on: ${m.n}! = ${m.leaves} leaves, each a complete ordering.`,
      (m) => `Every leaf copies the array: ${m.leaves} × ${m.n} = ${m.leaves * m.n} element writes — the same <code>n · n!</code> as the first tab.`,
      'The loop is cheaper here: a frame at depth d runs it n − d times, not n, because the placed numbers are already out of the way. That trims the constant, not the bound.',
    ],
    final: (m) => `${m.leaves} leaves × ${m.n} to copy each = ${m.leaves * m.n}.`,
    loops: [
      {
        anchor: 'loop',
        runs: '<code>n − first</code> times in the frame that owns it: only the unplaced numbers are candidates for position <code>first</code>.',
        measured: (m) => `${m.iterations} swaps in total — one per non-root frame, because every iteration creates exactly one child.`,
      },
    ],
    note: 'Two swaps per child instead of a push, a pop and two flag writes. Same complexity class; the interviewer may still ask you to name the difference.',
  },
  space: {
    bound: 'O(n)',
    story: [
      (m) => `Only the stack: at most n + 1 = ${m.n + 1} frames, one per position filled.`,
      'No <code>curr</code> and no <code>used</code>. The array itself is the state, and every swap is undone on the way back up.',
      'The result is n · n! numbers, but that is the output, not working memory.',
    ],
    measured: (m) => [
      ['Deepest stack', `${m.maxDepth} frames`],
      ['Frames created in total', `${m.calls}`],
      ['Permutations recorded', `${m.answers}`],
    ],
  },
};

/* ------------------------------------------------------------------ */

export const approaches = [
  {
    id: 'used',
    name: 'Backtracking',
    tagline: 'Loop from 0, skip what is used, record at the leaves.',
    intuition: `
      <p>A permutation is an ordering, so the question at each step is "which of the
      numbers not yet placed comes next?" — and any of them may. Unlike Subsets, the loop
      cannot start after the last choice; it starts at <code>0</code> every time, and a
      <code>used</code> array stops a number from being placed twice.</p>
      <p>An ordering is only complete once every number is in it, so answers live at the
      leaves: record when <code>curr</code> has all <code>n</code> numbers.</p>`,
    algorithm: [
      'Define <code>backtrack(curr)</code>, with a <code>used</code> array alongside it.',
      'If <code>len(curr) == n</code>, every number has been placed: add a copy of <code>curr</code> to the result and return.',
      'For each <code>i</code> from <code>0</code> to <code>n − 1</code>: if <code>used[i]</code>, <b>skip</b> it.',
      '<b>Choose</b> — mark <code>used[i]</code>, append <code>nums[i]</code>; <b>explore</b> — call <code>backtrack(curr)</code>; <b>un-choose</b> — pop it and clear <code>used[i]</code>.',
      'Start with <code>backtrack([])</code> and return the result.',
    ],
    watchFor:
      'Watch the loop restart at 0 in every frame, and watch used in the State panel: a number leaves it the moment its branch is undone, so it is available to the next branch.',
    idea:
      'Subsets with two changes. Q1: an answer is complete only when every number has been placed, so the record moves to the leaves. Q2: the loop starts at 0 — order matters, so a number that came earlier in the array may still come later in the ordering — and a used array is what stops a number appearing twice. '
      + 'The un-choose now undoes two things: the pop and the used flag. Forget either and the branches bleed into each other.',
    time: 'O(n · n!)',
    space: 'O(n)',
    spaceNote: 'The stack and curr are at most n deep; used is n flags. The n! is the output.',
    complexity: usedComplexity,
    stackPanel: 'call',
    code: usedCode,
    build: usedFrames,
  },
  {
    id: 'swap',
    name: 'Swap in place',
    tagline: 'Fill each position by swapping every later number into it.',
    intuition: `
      <p>The same tree with no extra list and no <code>used</code> array: the array
      itself is the state. Position <code>first</code> is filled by swapping each number
      at or after it into place; everything before <code>first</code> is fixed, everything
      after is still "unused".</p>
      <p>Undoing a choice is swapping back, which returns the array to exactly what the
      frame received — the same discipline as pop, in a different form.</p>`,
    algorithm: [
      'Define <code>backtrack(first)</code>: positions before <code>first</code> are fixed.',
      'If <code>first == n</code>, every position is filled: add a copy of <code>nums</code> to the result and return.',
      'For each <code>i</code> from <code>first</code> to <code>n − 1</code>: <b>swap</b> <code>nums[first]</code> and <code>nums[i]</code>.',
      '<b>Explore</b> — call <code>backtrack(first + 1)</code>; then <b>swap back</b>.',
      'Start with <code>backtrack(0)</code> and return the result.',
    ],
    watchFor:
      'Watch nums in the State panel: it is different in every frame, yet after each swap back it is exactly what it was. The array carries the whole search state.',
    idea:
      'Two questions, no extra state. Q1: an answer is complete when first reaches n — every position has been filled. Q2: any number from first onward can take position first, so swap it in and recurse on first + 1. '
      + 'The swap back is the un-choose. It leaves nums exactly as the frame received it, which is why the next sibling starts from a clean array.',
    time: 'O(n · n!)',
    space: 'O(n)',
    spaceNote: 'Only the stack, n deep. Order of output differs from the first tab; LeetCode accepts any order.',
    complexity: swapComplexity,
    stackPanel: 'call',
    code: swapCode,
    build: swapFrames,
  },
];

export const approachById = (id) => approaches.find((a) => a.id === id) || approaches[0];

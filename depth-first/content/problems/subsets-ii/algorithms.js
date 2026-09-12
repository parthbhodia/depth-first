/**
 * algorithms.js — LeetCode 90, instrumented two ways.
 *
 * Subsets with duplicates in the input. The whole problem is one line: at
 * any level of the tree, do not start a second branch on a value that an
 * earlier sibling already started. Sorting puts equal values side by side so
 * that line can be a single comparison.
 *
 *   loop  — sort, then skip equal siblings. Never builds a duplicate. First tab.
 *   set   — build everything, keep each subset once. Correct, and the tree
 *           shows every duplicate it built and threw away (the ×2 marks).
 */
import { blank, fmt, plural, words, named } from '#engine/frames.js';

/* ------------------------------------------------------------------ */
/* Source, per language, with a line anchor per semantic step          */
/* ------------------------------------------------------------------ */

const loopCode = {
  python: {
    source: `class Solution:
    def subsetsWithDup(self, nums: list[int]) -> list[list[int]]:
        nums.sort()
        res = []
        self.backtrack(0, nums, [], res)
        return res

    def backtrack(self, index, nums, curr, res):
        # Q1 — complete answer? Every path is one: record it.
        res.append(list(curr))

        # Q2 — what choices do I have? Everything right of index,
        # but not a value an earlier sibling already tried.
        for i in range(index, len(nums)):
            if i > index and nums[i] == nums[i - 1]:
                continue
            curr.append(nums[i])
            self.backtrack(i + 1, nums, curr, res)
            curr.pop()`,
    anchors: { start: 5, call: 8, record: 10, loop: 14, skip: 15, choose: 17, recurse: 18, unchoose: 19, done: 6 },
  },
  javascript: {
    source: `var subsetsWithDup = function(nums) {
    nums.sort((a, b) => a - b);
    const res = [];

    const backtrack = (index, curr) => {
        // Q1 — complete answer? Every path is one: record it.
        res.push([...curr]);

        // Q2 — what choices do I have? Everything right of index,
        // but not a value an earlier sibling already tried.
        for (let i = index; i < nums.length; i++) {
            if (i > index && nums[i] === nums[i - 1]) continue;
            curr.push(nums[i]);
            backtrack(i + 1, curr);
            curr.pop();
        }
    };

    backtrack(0, []);
    return res;
};`,
    anchors: { start: 19, call: 5, record: 7, loop: 11, skip: 12, choose: 13, recurse: 14, unchoose: 15, done: 20 },
  },
  java: {
    source: `class Solution {
    public List<List<Integer>> subsetsWithDup(int[] nums) {
        Arrays.sort(nums);
        List<List<Integer>> res = new ArrayList<>();
        backtrack(0, nums, new ArrayList<>(), res);
        return res;
    }

    private void backtrack(int index, int[] nums,
                           List<Integer> curr, List<List<Integer>> res) {
        // Q1 — complete answer? Every path is one: record it.
        res.add(new ArrayList<>(curr));

        // Q2 — what choices do I have? Everything right of index,
        // but not a value an earlier sibling already tried.
        for (int i = index; i < nums.length; i++) {
            if (i > index && nums[i] == nums[i - 1]) continue;
            curr.add(nums[i]);
            backtrack(i + 1, nums, curr, res);
            curr.remove(curr.size() - 1);
        }
    }
}`,
    anchors: { start: 5, call: 9, record: 12, loop: 16, skip: 17, choose: 18, recurse: 19, unchoose: 20, done: 6 },
  },
  cpp: {
    source: `class Solution {
public:
    vector<vector<int>> subsetsWithDup(vector<int>& nums) {
        sort(nums.begin(), nums.end());
        vector<vector<int>> res;
        vector<int> curr;
        backtrack(0, nums, curr, res);
        return res;
    }

    void backtrack(int index, vector<int>& nums,
                   vector<int>& curr, vector<vector<int>>& res) {
        // Q1 — complete answer? Every path is one: record it.
        res.push_back(curr);

        // Q2 — what choices do I have? Everything right of index,
        // but not a value an earlier sibling already tried.
        for (int i = index; i < nums.size(); i++) {
            if (i > index && nums[i] == nums[i - 1]) continue;
            curr.push_back(nums[i]);
            backtrack(i + 1, nums, curr, res);
            curr.pop_back();
        }
    }
};`,
    anchors: { start: 7, call: 11, record: 14, loop: 18, skip: 19, choose: 20, recurse: 21, unchoose: 22, done: 8 },
  },
};

const setCode = {
  python: {
    source: `class Solution:
    def subsetsWithDup(self, nums: list[int]) -> list[list[int]]:
        nums.sort()
        seen = set()
        res = []
        self.backtrack(0, nums, [], seen, res)
        return res

    def backtrack(self, index, nums, curr, seen, res):
        # Q1 — complete answer? Every path is one — but keep it only once.
        key = tuple(curr)
        if key not in seen:
            seen.add(key)
            res.append(list(curr))

        # Q2 — what choices do I have? Everything right of index.
        for i in range(index, len(nums)):
            curr.append(nums[i])
            self.backtrack(i + 1, nums, curr, seen, res)
            curr.pop()`,
    anchors: { start: 6, call: 9, check: 12, reject: 12, record: 14, loop: 17, choose: 18, recurse: 19, unchoose: 20, done: 7 },
  },
  javascript: {
    source: `var subsetsWithDup = function(nums) {
    nums.sort((a, b) => a - b);
    const seen = new Set();
    const res = [];

    const backtrack = (index, curr) => {
        // Q1 — complete answer? Every path is one — but keep it only once.
        const key = curr.join(',');
        if (!seen.has(key)) {
            seen.add(key);
            res.push([...curr]);
        }

        // Q2 — what choices do I have? Everything right of index.
        for (let i = index; i < nums.length; i++) {
            curr.push(nums[i]);
            backtrack(i + 1, curr);
            curr.pop();
        }
    };

    backtrack(0, []);
    return res;
};`,
    anchors: { start: 22, call: 6, check: 9, reject: 9, record: 11, loop: 15, choose: 16, recurse: 17, unchoose: 18, done: 23 },
  },
  java: {
    source: `class Solution {
    Set<String> seen = new HashSet<>();

    public List<List<Integer>> subsetsWithDup(int[] nums) {
        Arrays.sort(nums);
        List<List<Integer>> res = new ArrayList<>();
        backtrack(0, nums, new ArrayList<>(), res);
        return res;
    }

    private void backtrack(int index, int[] nums,
                           List<Integer> curr, List<List<Integer>> res) {
        // Q1 — complete answer? Every path is one — but keep it only once.
        String key = curr.toString();
        if (!seen.contains(key)) {
            seen.add(key);
            res.add(new ArrayList<>(curr));
        }

        // Q2 — what choices do I have? Everything right of index.
        for (int i = index; i < nums.length; i++) {
            curr.add(nums[i]);
            backtrack(i + 1, nums, curr, res);
            curr.remove(curr.size() - 1);
        }
    }
}`,
    anchors: { start: 7, call: 11, check: 15, reject: 15, record: 17, loop: 21, choose: 22, recurse: 23, unchoose: 24, done: 8 },
  },
  cpp: {
    source: `class Solution {
public:
    vector<vector<int>> subsetsWithDup(vector<int>& nums) {
        sort(nums.begin(), nums.end());
        vector<vector<int>> res;
        vector<int> curr;
        backtrack(0, nums, curr, res);
        return res;
    }

    set<vector<int>> seen;

    void backtrack(int index, vector<int>& nums,
                   vector<int>& curr, vector<vector<int>>& res) {
        // Q1 — complete answer? Every path is one — but keep it only once.
        if (!seen.count(curr)) {
            seen.insert(curr);
            res.push_back(curr);
        }

        // Q2 — what choices do I have? Everything right of index.
        for (int i = index; i < nums.size(); i++) {
            curr.push_back(nums[i]);
            backtrack(i + 1, nums, curr, res);
            curr.pop_back();
        }
    }
};`,
    anchors: { start: 7, call: 13, check: 16, reject: 16, record: 18, loop: 22, choose: 23, recurse: 24, unchoose: 25, done: 8 },
  },
};

/* ------------------------------------------------------------------ */
/* Frame builders                                                      */
/* ------------------------------------------------------------------ */

const subset = (a) => named(a, 'subset');

// Both builders share the stack shape: each frame owns its index and its i.
function makeSnap(frames, stack, returns, res, nextIdRef, extraVars) {
  return (anchor, caption, flashAdd, extra = {}) => {
    frames.push({
      ...blank,
      anchor,
      caption,
      callStack: stack.map((f) => ({
        label: f.label,
        nodeId: f.id,
        locals: [
          { name: 'index', value: f.index },
          { name: 'i', value: f.i },
        ],
      })),
      path: stack.map((f) => f.id),
      returns: { ...returns },
      revealed: nextIdRef.value,
      collected: {
        label: 'res',
        items: res.map(fmt),
        justAdded: flashAdd ? res.length - 1 : null,
      },
      vars: extraVars(),
      ...extra,
    });
  };
}

/* 1. Sort, then skip equal siblings. */

function loopFrames(nums) {
  const frames = [];
  const nodes = [];
  const stack = [];
  const returns = {};
  const res = [];
  const curr = [];
  const nextId = { value: 0 };
  let flashAdd = false;
  const snap = makeSnap(frames, stack, returns, res, nextId, () => [{ name: 'curr', value: fmt(curr) }]);
  const S = (anchor, caption, extra) => { snap(anchor, caption, flashAdd, extra); flashAdd = false; };

  function go(index, parentId, depth) {
    const id = nextId.value++;
    const label = fmt(curr);
    nodes.push({ id, parentId, key: `${depth}:${curr.join(',')}`, label, depth });
    const fr = { id, label, index, i: '—' };
    stack.push(fr);

    S('call', depth === 0
      ? `Start. The input is sorted first — ${words(nums)} — so equal values sit side by side.`
      : `A new frame with index = ${index}. It may only pick from position ${index} onward.`,
    { active: id, flash: 'call', key: depth === 0 });

    const mark = res.length;
    res.push([...curr]);
    flashAdd = true;
    const rec = (list) => (depth === 0
      ? 'Save the empty subset first — every path is an answer, this one included.'
      : `Save ${list}. Every path is a subset, so record on arrival.`);
    S('record', rec(fmt(curr)), { active: id, flash: 'best', key: true, spoken: rec(subset(curr)) });

    for (let i = index; i < nums.length; i++) {
      fr.i = i;
      if (i > index && nums[i] === nums[i - 1]) {
        S('skip', `nums[${i}] is another ${nums[i]}. A sibling branch on this level already started with ${nums[i]}, so starting again would rebuild the same subsets. Skip it.`,
          { active: id, flash: 'return', key: true });
        continue;
      }
      S('loop', i === index
        ? `Look at the choices from position ${index} on. First: ${nums[i]}.`
        : `Next choice: ${nums[i]}.`,
      { active: id });

      curr.push(nums[i]);
      S('choose', `Pick ${nums[i]}. curr is now ${fmt(curr)}.`, { active: id, flash: 'call', spoken: `Pick ${nums[i]}. curr is now ${words(curr)}.` });

      go(i + 1, id, depth + 1);

      S('recurse', `Back from that call, still on i = ${i}.`, { active: id });

      curr.pop();
      const undo = (list) => `Pop ${nums[i]}. curr is back to ${list}.`;
      S('unchoose', undo(fmt(curr)), { active: id, flash: 'return', key: true, spoken: undo(words(curr)) });
    }

    fr.i = 'done';
    returns[id] = res.length - mark;
    S('loop', `No choices left here. This frame added ${plural(res.length - mark, 'subset')}.`, { active: id, flash: 'return' });
    stack.pop();
  }

  go(0, null, 0);

  frames.push({
    ...blank,
    anchor: 'done',
    caption: `Done: ${plural(res.length, 'subset')}, each built exactly once. The tree has ${nodes.length} nodes and no two of them are the same subset.`,
    callStack: [],
    returns: { ...returns },
    revealed: nodes.length,
    collected: { label: 'res', items: res.map(fmt), justAdded: null },
    vars: [{ name: 'curr', value: '[ ]' }],
    result: res.length,
    flash: 'done',
    key: true,
  });

  return { frames, answer: res.length, nodes, subsets: res };
}

/* 2. Build everything, keep each subset once. */

function setFrames(nums) {
  const frames = [];
  const nodes = [];
  const stack = [];
  const returns = {};
  const res = [];
  const curr = [];
  const seen = new Set();
  let wasted = 0;
  const nextId = { value: 0 };
  let flashAdd = false;
  const snap = makeSnap(frames, stack, returns, res, nextId, () => [
    { name: 'curr', value: fmt(curr) },
    { name: 'seen', value: `${seen.size} kept · ${wasted} dropped` },
  ]);
  const S = (anchor, caption, extra) => { snap(anchor, caption, flashAdd, extra); flashAdd = false; };

  function go(index, parentId, depth) {
    const id = nextId.value++;
    const label = fmt(curr);
    // Same key for the same subset at the same depth: the canvas marks repeats ×2.
    nodes.push({ id, parentId, key: `${depth}:${curr.join(',')}`, label, depth });
    const fr = { id, label, index, i: '—' };
    stack.push(fr);

    S('call', depth === 0
      ? `Start. Sorted input — ${words(nums)} — but nothing stops a duplicate branch; the set will catch the duplicates afterwards.`
      : `A new frame with index = ${index}.`,
    { active: id, flash: 'call', key: depth === 0 });

    const mark = res.length;
    const key = curr.join(',');
    if (seen.has(key)) {
      wasted += 1;
      S('reject', `${fmt(curr)} again. The set already has it, so it is dropped — the whole branch that built it was wasted work.`,
        { active: id, flash: 'return', key: true, spoken: `${subset(curr)} again. The set already has it, so it is dropped.` });
    } else {
      seen.add(key);
      res.push([...curr]);
      flashAdd = true;
      S('record', depth === 0 ? 'Keep the empty subset.' : `${fmt(curr)} is new: keep it.`,
        { active: id, flash: 'best', key: true, spoken: depth === 0 ? null : `${subset(curr)} is new: keep it.` });
    }

    for (let i = index; i < nums.length; i++) {
      fr.i = i;
      S('loop', i === index ? `Choices from position ${index} on. First: ${nums[i]}.` : `Next choice: ${nums[i]}.`, { active: id });
      curr.push(nums[i]);
      S('choose', `Pick ${nums[i]}. curr is now ${fmt(curr)}.`, { active: id, flash: 'call', spoken: `Pick ${nums[i]}. curr is now ${words(curr)}.` });
      go(i + 1, id, depth + 1);
      S('recurse', `Back from that call, still on i = ${i}.`, { active: id });
      curr.pop();
      const undo = (list) => `Pop ${nums[i]}. curr is back to ${list}.`;
      S('unchoose', undo(fmt(curr)), { active: id, flash: 'return', key: true, spoken: undo(words(curr)) });
    }

    fr.i = 'done';
    returns[id] = res.length - mark;
    S('loop', `No choices left here. This frame kept ${plural(res.length - mark, 'new subset')}.`, { active: id, flash: 'return' });
    stack.pop();
  }

  go(0, null, 0);

  frames.push({
    ...blank,
    anchor: 'done',
    caption: `Done: ${plural(res.length, 'subset')} kept, ${plural(wasted, 'duplicate')} built and thrown away. The tree has ${nodes.length} nodes — every ×2 is work the first tab never did.`,
    callStack: [],
    returns: { ...returns },
    revealed: nodes.length,
    collected: { label: 'res', items: res.map(fmt), justAdded: null },
    vars: [{ name: 'curr', value: '[ ]' }, { name: 'seen', value: `${seen.size} kept · ${wasted} dropped` }],
    result: res.length,
    flash: 'done',
    key: true,
  });

  return { frames, answer: res.length, nodes, subsets: res };
}

/* ------------------------------------------------------------------ */
/* Complexity, stated and then counted on the trace (see ComplexityPanel) */
/* ------------------------------------------------------------------ */

const sizeOf = (nums) => ({ n: nums.length, label: `nums = [${nums.join(',')}], so n = ${nums.length}` });
const lead = (m) => `Counted on ${m.label}. Change the input in the trace above and every number here follows.`;

const loopComplexity = {
  size: sizeOf,
  lead,
  time: {
    bound: 'O(n · 2ⁿ)',
    count: 'sum',
    iterationAnchors: ['choose', 'skip'],
    story: [
      (m) => `Every node is an answer, so the tree has exactly as many nodes as there are subsets: ${m.calls} here. With no repeated values that would be 2ⁿ = ${2 ** m.n}; the skips remove the rest.`,
      (m) => `Each subset is copied when it is recorded, at most n = ${m.n} numbers: ${m.answers} × ${m.n} ≤ ${m.answers * m.n} element writes. That is the <code>n · 2ⁿ</code> in the worst case.`,
      'The loop in a frame at depth d looks at n − d positions, and a skip costs one comparison. Summed over every frame that is still O(n · 2ⁿ) — the bound does not improve, the tree does.',
    ],
    final: (m) => `${m.levels.join(' + ')} = ${m.calls} nodes, every one of them an answer.`,
    loops: [
      {
        anchor: 'loop',
        runs: '<code>n − index</code> times in the frame that owns it — everything to the right of the last pick.',
        measured: (m) => `${m.iterations} iterations in total: ${m.by.choose || 0} started a branch, ${m.by.skip || 0} were skipped as duplicates of a sibling.`,
      },
      {
        anchor: 'skip',
        runs: 'Once per iteration — one comparison against the previous value on the same level.',
        measured: (m) => `${m.by.skip || 0} branch${(m.by.skip || 0) === 1 ? '' : 'es'} refused before existing.`,
      },
    ],
    note: 'Quote O(n · 2ⁿ), then say the skip removes duplicate branches without changing the bound. Interviewers ask for both halves.',
  },
  space: {
    bound: 'O(n)',
    story: [
      (m) => `The stack is at most n + 1 = ${m.n + 1} frames deep, and <code>curr</code> holds at most n numbers — shared by every branch, restored by every pop.`,
      'Sorting is in place. No set, no map: nothing grows with the number of subsets except the result you return.',
    ],
    measured: (m) => [
      ['Deepest stack', `${m.maxDepth} frames`],
      ['Frames created in total', `${m.calls}`],
      ['Subsets recorded', `${m.answers}`],
    ],
  },
};

const setComplexity = {
  size: sizeOf,
  lead,
  time: {
    bound: 'O(n · 2ⁿ)',
    count: 'sum',
    iterationAnchors: ['choose'],
    story: [
      (m) => `Nothing stops a duplicate branch, so the tree is the full Subsets tree: 2ⁿ = ${m.calls} nodes on this input, ${m.answers} of them answers and ${m.by.reject || 0} thrown away.`,
      (m) => `Every arrival hashes <code>curr</code> — O(n) each — and every kept subset is copied: ${m.calls} × ${m.n} = ${m.calls * m.n} element reads and writes, duplicates included.`,
      'Same bound as the first tab, but the first tab reaches it only when nothing repeats. This one always does the full 2ⁿ.',
    ],
    final: (m) => `${m.levels.join(' + ')} = ${m.calls} nodes; ${m.by.reject || 0} of them built a subset the set already had.`,
    loops: [
      {
        anchor: 'loop',
        runs: '<code>n − index</code> times in the frame that owns it, with no skip — every position starts a branch.',
        measured: (m) => `${m.iterations} iterations, every one of them a branch. Compare the first tab on the same input.`,
      },
    ],
    note: 'The set fixes the answer, not the work. Say so when you offer it as a first draft.',
  },
  space: {
    bound: 'O(n · 2ⁿ)',
    story: [
      (m) => `The stack is still n + 1 = ${m.n + 1} frames at most.`,
      (m) => `But <code>seen</code> holds every subset ever recorded — ${m.answers} here, up to 2ⁿ in general, each up to n long. That is working memory, on top of the result.`,
    ],
    measured: (m) => [
      ['Deepest stack', `${m.maxDepth} frames`],
      ['Subsets kept in the set', `${m.answers}`],
      ['Duplicates built and dropped', `${m.by.reject || 0}`],
    ],
  },
};

/* ------------------------------------------------------------------ */

export const approaches = [
  {
    id: 'loop',
    name: 'Backtracking',
    tagline: 'Sort, then never start a sibling branch on a value you already tried.',
    intuition: `
      <p>Subsets, with one complication: the input can contain the same value more than
      once, and <code>[1,2]</code> built from the first 2 is the same subset as
      <code>[1,2]</code> built from the second.</p>
      <p>Duplicates come from <em>siblings</em>, not from parents and children — choosing a 2
      after a 2 is fine (that is <code>[2,2]</code>). So sort first, and at each level skip a
      value equal to the one an earlier sibling on that level just started with.</p>`,
    algorithm: [
      'Sort <code>nums</code>, so equal values sit next to each other.',
      'Define <code>backtrack(index, curr)</code> and add a copy of <code>curr</code> to the result immediately — every path is a valid subset.',
      'For each <code>i</code> from <code>index</code> to the end: if <code>i > index</code> and <code>nums[i] == nums[i - 1]</code>, <b>skip</b> it — a sibling already started a branch with that value.',
      '<b>Choose</b> — append <code>nums[i]</code>; <b>explore</b> — call <code>backtrack(i + 1, curr)</code>; <b>un-choose</b> — pop it.',
      'Start with <code>backtrack(0, [])</code> and return the result.',
    ],
    watchFor:
      'Watch the skip frames. The comparison is i > index, not i > 0: the second 2 is skipped as a sibling of the first, but chosen happily as its child, which is how [2,2] still gets built.',
    idea:
      'Two questions, same as Subsets. Q1: every path is a complete answer, so record on arrival. Q2: everything to the right of index — minus one thing: a value equal to the one an earlier sibling on this level already started with. '
      + 'Sorting is what makes that a single comparison, nums[i] == nums[i - 1]. The i > index guard is what keeps the same value allowed as a child, so [2,2] still appears.',
    time: 'O(n · 2ⁿ)',
    space: 'O(n)',
    spaceNote: 'The same n-deep stack as Subsets. Fewer nodes than 2ⁿ whenever the input repeats.',
    complexity: loopComplexity,
    stackPanel: 'call',
    code: loopCode,
    build: loopFrames,
  },
  {
    id: 'set',
    name: 'Build all, dedupe',
    tagline: 'The obvious fix — and the tree shows what it costs.',
    intuition: `
      <p>Run Subsets as if there were no duplicates, and keep a set of the subsets already
      recorded. When a path arrives at a subset the set has seen, drop it.</p>
      <p>It is correct (sorting makes equal subsets look identical), and it is the answer most
      people reach for first. The trace shows the price: every dropped subset is a branch that
      was fully built and then thrown away.</p>`,
    algorithm: [
      'Sort <code>nums</code>, so equal subsets are built in the same order and compare equal.',
      'Define <code>backtrack(index, curr)</code>. On arrival, if <code>curr</code> is not in <code>seen</code>: add it to <code>seen</code> and to the result. Otherwise drop it.',
      'For each <code>i</code> from <code>index</code> to the end: append <code>nums[i]</code>, call <code>backtrack(i + 1, curr)</code>, pop it.',
      'Start with <code>backtrack(0, [])</code> and return the result.',
    ],
    watchFor:
      'Watch the ×2 marks on the tree and the "dropped" count in the State panel. Each one is a whole branch the first tab refused to enter.',
    idea:
      'Same two questions, with Q1 changed to "every path is an answer, but keep each one once". A set makes that easy, and sorting makes equal subsets compare equal. '
      + 'What the set cannot do is stop the duplicate branch from being explored — it can only discard the result at the end — which is why the first tab skips instead.',
    time: 'O(n · 2ⁿ)',
    space: 'O(n · 2ⁿ)',
    spaceNote: 'The set holds every subset ever recorded, on top of the stack.',
    complexity: setComplexity,
    stackPanel: 'call',
    code: setCode,
    build: setFrames,
  },
];

export const approachById = (id) => approaches.find((a) => a.id === id) || approaches[0];

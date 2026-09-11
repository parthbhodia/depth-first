/**
 * algorithms.js — LeetCode 78, instrumented three ways.
 *
 * The point of difference from the DP problems: here the tree is not a record
 * of repeated work, it is the *answer*. Every node is a subset. So two frame
 * fields do the heavy lifting that `memo` does on LC 70:
 *
 *   collected  — res, growing. Watching it fill is half the explanation.
 *   callStack  — each frame carries its OWN index and i, because the whole
 *                idea people miss is that i is frozen per frame, not global.
 *
 *   loop    — the canonical form. One node per call, answers at every node.
 *   binary  — include/exclude. A perfect binary tree, answers only at leaves,
 *             which is where the 2^n count becomes literally visible.
 *   bitmask — no recursion at all; the bits ARE the include/exclude decisions.
 */

/* ------------------------------------------------------------------ */
/* Source, per language, with a line anchor per semantic step          */
/* ------------------------------------------------------------------ */

const loopCode = {
  python: {
    source: `class Solution:
    def subsets(self, nums: list[int]) -> list[list[int]]:
        res = []
        self.backtrack(0, nums, [], res)
        return res

    def backtrack(self, index, nums, curr, res):
        res.append(list(curr))

        for i in range(index, len(nums)):
            curr.append(nums[i])
            self.backtrack(i + 1, nums, curr, res)
            curr.pop()`,
    anchors: { start: 4, call: 7, record: 8, loop: 10, choose: 11, recurse: 12, unchoose: 13, done: 5 },
  },
  javascript: {
    source: `var subsets = function(nums) {
    const res = [];

    const backtrack = (index, curr) => {
        res.push([...curr]);

        for (let i = index; i < nums.length; i++) {
            curr.push(nums[i]);
            backtrack(i + 1, curr);
            curr.pop();
        }
    };

    backtrack(0, []);
    return res;
};`,
    anchors: { start: 14, call: 4, record: 5, loop: 7, choose: 8, recurse: 9, unchoose: 10, done: 15 },
  },
  java: {
    source: `class Solution {
    public List<List<Integer>> subsets(int[] nums) {
        List<List<Integer>> res = new ArrayList<>();
        backtrack(0, nums, new ArrayList<>(), res);
        return res;
    }

    private void backtrack(int index, int[] nums,
                           List<Integer> curr, List<List<Integer>> res) {
        res.add(new ArrayList<>(curr));

        for (int i = index; i < nums.length; i++) {
            curr.add(nums[i]);
            backtrack(i + 1, nums, curr, res);
            curr.remove(curr.size() - 1);
        }
    }
}`,
    anchors: { start: 4, call: 8, record: 10, loop: 12, choose: 13, recurse: 14, unchoose: 15, done: 5 },
  },
  cpp: {
    source: `class Solution {
public:
    vector<vector<int>> subsets(vector<int>& nums) {
        vector<vector<int>> res;
        vector<int> curr;
        backtrack(0, nums, curr, res);
        return res;
    }

    void backtrack(int index, vector<int>& nums,
                   vector<int>& curr, vector<vector<int>>& res) {
        res.push_back(curr);

        for (int i = index; i < nums.size(); i++) {
            curr.push_back(nums[i]);
            backtrack(i + 1, nums, curr, res);
            curr.pop_back();
        }
    }
};`,
    anchors: { start: 6, call: 10, record: 12, loop: 14, choose: 15, recurse: 16, unchoose: 17, done: 7 },
  },
};

const binaryCode = {
  python: {
    source: `class Solution:
    def subsets(self, nums: list[int]) -> list[list[int]]:
        res = []
        self.dfs(0, nums, [], res)
        return res

    def dfs(self, i, nums, curr, res):
        if i == len(nums):
            res.append(list(curr))
            return

        curr.append(nums[i])
        self.dfs(i + 1, nums, curr, res)

        curr.pop()
        self.dfs(i + 1, nums, curr, res)`,
    anchors: { start: 4, call: 7, base: 8, record: 9, include: 12, recurseIn: 13, exclude: 15, recurseEx: 16, done: 5 },
  },
  javascript: {
    source: `var subsets = function(nums) {
    const res = [];

    const dfs = (i, curr) => {
        if (i === nums.length) {
            res.push([...curr]);
            return;
        }

        curr.push(nums[i]);
        dfs(i + 1, curr);

        curr.pop();
        dfs(i + 1, curr);
    };

    dfs(0, []);
    return res;
};`,
    anchors: { start: 17, call: 4, base: 5, record: 6, include: 10, recurseIn: 11, exclude: 13, recurseEx: 14, done: 18 },
  },
  java: {
    source: `class Solution {
    public List<List<Integer>> subsets(int[] nums) {
        List<List<Integer>> res = new ArrayList<>();
        dfs(0, nums, new ArrayList<>(), res);
        return res;
    }

    private void dfs(int i, int[] nums,
                     List<Integer> curr, List<List<Integer>> res) {
        if (i == nums.length) {
            res.add(new ArrayList<>(curr));
            return;
        }

        curr.add(nums[i]);
        dfs(i + 1, nums, curr, res);

        curr.remove(curr.size() - 1);
        dfs(i + 1, nums, curr, res);
    }
}`,
    anchors: { start: 4, call: 8, base: 10, record: 11, include: 15, recurseIn: 16, exclude: 18, recurseEx: 19, done: 5 },
  },
  cpp: {
    source: `class Solution {
public:
    vector<vector<int>> subsets(vector<int>& nums) {
        vector<vector<int>> res;
        vector<int> curr;
        dfs(0, nums, curr, res);
        return res;
    }

    void dfs(int i, vector<int>& nums,
             vector<int>& curr, vector<vector<int>>& res) {
        if (i == nums.size()) {
            res.push_back(curr);
            return;
        }

        curr.push_back(nums[i]);
        dfs(i + 1, nums, curr, res);

        curr.pop_back();
        dfs(i + 1, nums, curr, res);
    }
};`,
    anchors: { start: 6, call: 10, base: 12, record: 13, include: 17, recurseIn: 18, exclude: 20, recurseEx: 21, done: 7 },
  },
};

const bitmaskCode = {
  python: {
    source: `class Solution:
    def subsets(self, nums: list[int]) -> list[list[int]]:
        n = len(nums)
        res = []

        for mask in range(1 << n):
            curr = []
            for i in range(n):
                if mask & (1 << i):
                    curr.append(nums[i])
            res.append(curr)

        return res`,
    anchors: { init: 4, mask: 6, fresh: 7, bit: 8, test: 9, take: 10, record: 11, done: 13 },
  },
  javascript: {
    source: `var subsets = function(nums) {
    const n = nums.length;
    const res = [];

    for (let mask = 0; mask < (1 << n); mask++) {
        const curr = [];
        for (let i = 0; i < n; i++) {
            if (mask & (1 << i)) {
                curr.push(nums[i]);
            }
        }
        res.push(curr);
    }

    return res;
};`,
    anchors: { init: 3, mask: 5, fresh: 6, bit: 7, test: 8, take: 9, record: 12, done: 15 },
  },
  java: {
    source: `class Solution {
    public List<List<Integer>> subsets(int[] nums) {
        int n = nums.length;
        List<List<Integer>> res = new ArrayList<>();

        for (int mask = 0; mask < (1 << n); mask++) {
            List<Integer> curr = new ArrayList<>();
            for (int i = 0; i < n; i++) {
                if ((mask & (1 << i)) != 0) {
                    curr.add(nums[i]);
                }
            }
            res.add(curr);
        }

        return res;
    }
}`,
    anchors: { init: 4, mask: 6, fresh: 7, bit: 8, test: 9, take: 10, record: 13, done: 16 },
  },
  cpp: {
    source: `class Solution {
public:
    vector<vector<int>> subsets(vector<int>& nums) {
        int n = nums.size();
        vector<vector<int>> res;

        for (int mask = 0; mask < (1 << n); mask++) {
            vector<int> curr;
            for (int i = 0; i < n; i++) {
                if (mask & (1 << i)) {
                    curr.push_back(nums[i]);
                }
            }
            res.push_back(curr);
        }

        return res;
    }
};`,
    anchors: { init: 5, mask: 7, fresh: 8, bit: 9, test: 10, take: 11, record: 14, done: 17 },
  },
};

/* ------------------------------------------------------------------ */
/* Frame builders                                                      */
/* ------------------------------------------------------------------ */

const blank = {
  callStack: null, path: [], active: null, returns: {},
  memoHits: [], memo: null, memoProbe: null, revealed: 0,
  table: null, tableFocus: null, tableDeps: null,
  collected: null,
  vars: [], result: null, flash: null, dupNote: null,
};

const fmt = (a) => (a.length ? `[${a.join(',')}]` : '[ ]');
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

/*
 * Captions are written to be read. Where one shows a list, the frame also
 * carries a `spoken` version, because "[1,2,3]" is fine on screen and noise
 * out loud. The narration prefers `spoken` when it is there.
 */
const words = (a) => (a.length ? a.join(', ').replace(/, ([^,]*)$/, ' and $1') : 'empty');
const subset = (a) => (a.length ? `the subset ${words(a)}` : 'the empty subset');

/* 1. The canonical form: loop from index, record on arrival. */

function loopFrames(nums) {
  const frames = [];
  const nodes = [];
  const stack = [];
  const returns = {};
  const res = [];
  const curr = [];
  let nextId = 0;
  let flashAdd = false;

  const snap = (anchor, caption, extra = {}) => {
    frames.push({
      ...blank,
      anchor,
      caption,
      // Each frame carries its own index and i. That per-frame ownership is
      // the thing the picture alone cannot show.
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
      revealed: nextId,
      collected: {
        label: 'res',
        items: res.map(fmt),
        justAdded: flashAdd ? res.length - 1 : null,
      },
      vars: [{ name: 'curr', value: fmt(curr) }],
      ...extra,
    });
    flashAdd = false;
  };

  function go(index, parentId, depth) {
    const id = nextId++;
    const label = fmt(curr);
    // Key must be unique per node: two different calls can share a path in
    // other problems, and a shared key would draw a bogus "repeated" marker.
    nodes.push({ id, parentId, key: `${depth}:${curr.join(',')}`, label, depth });

    const fr = { id, label, index, i: '—' };
    stack.push(fr);

    snap('call', depth === 0
      ? 'Here we go. A subset is any group of some of our numbers — even none of them. Our list curr starts empty, and there is no i yet: the for loop will create it.'
      : `A new frame starts, with index = ${index}. It may only pick from position ${index} onward. Every frame under it is paused in its own loop, each remembering its own i.`,
    { active: id, flash: 'call' });

    const mark = res.length;
    res.push([...curr]);
    flashAdd = true;
    const record = (list) => `Save ${list}. We save the moment we arrive, so every node in this tree is an answer — not just the ones at the bottom.`;
    snap('record', depth === 0
      ? 'First, save what we have — even though it is empty. The empty subset counts too, and it costs nothing extra.'
      : record(fmt(curr)),
    { active: id, flash: 'best', spoken: depth === 0 ? null : record(subset(curr)) });

    for (let i = index; i < nums.length; i++) {
      fr.i = i;
      snap('loop', i === index
        ? `The loop starts at i = ${index}, the same as index. Only the numbers from position ${index} onward are still up for grabs — everything before that is settled.`
        : `i moves on to ${i}. curr was put back the way it was, so this next pick starts clean.`,
      { active: id });

      curr.push(nums[i]);
      snap('choose', `Pick nums[${i}], which is ${nums[i]}, and add it to curr. There is only one curr, shared by every frame — so all of them see this change.`,
        { active: id, flash: 'call' });

      go(i + 1, id, depth + 1);

      snap('recurse', `Back from that call. This frame carries on from the next line with i still ${i} — the stack remembered that for us.`,
        { active: id });

      curr.pop();
      const undo = (list) => `Un-pick it. curr.pop() takes ${nums[i]} back out, so curr is ${list} again — exactly as it was before the pick. Every later sibling depends on that undo being perfect.`;
      snap('unchoose', undo(fmt(curr)), { active: id, flash: 'return', spoken: undo(words(curr)) });
    }

    fr.i = 'done';
    returns[id] = res.length - mark;
    snap('loop', index >= nums.length
      ? 'There is nothing left to look at, so the loop never starts and i is never even created. This call simply returns.'
      : `No numbers left to pick. This frame is finished and returns — it added ${plural(res.length - mark, 'subset')} along the way.`,
    { active: id, flash: 'return' });

    stack.pop();
  }

  go(0, null, 0);

  frames.push({
    ...blank,
    anchor: 'done',
    caption: `All done. res holds ${plural(res.length, 'subset')} — that is 2^${nums.length}. The tree has ${nodes.length} nodes, but the stack never held more than ${nums.length + 1} frames at once: lots of time, very little memory.`,
    callStack: [],
    returns: { ...returns },
    revealed: nodes.length,
    collected: { label: 'res', items: res.map(fmt), justAdded: null },
    vars: [{ name: 'curr', value: fmt(curr) }],
    result: res.length,
    flash: 'done',
  });

  return { frames, answer: res.length, nodes, subsets: res };
}

/* 2. Include / exclude: the same 2^n, but as a perfect binary tree. */

function binaryFrames(nums) {
  const frames = [];
  const nodes = [];
  const stack = [];
  const returns = {};
  const res = [];
  const curr = [];
  let nextId = 0;
  let flashAdd = false;

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
      vars: [{ name: 'curr', value: fmt(curr) }],
      ...extra,
    });
    flashAdd = false;
  };

  function dfs(i, parentId, depth) {
    const id = nextId++;
    nodes.push({ id, parentId, key: `${depth}:${curr.join(',')}`, label: fmt(curr), depth });
    stack.push({ id, label: fmt(curr), i });

    let arrive;
    if (depth === 0) arrive = 'One frame per number, and just two choices in each: put it in, or leave it out.';
    else if (i < nums.length) arrive = `A new frame for i = ${i}. It answers one question only: is ${nums[i]} in, or out?`;
    else arrive = 'A new frame — and every number has already been decided.';
    snap('call', arrive, { active: id, flash: 'call' });

    const mark = res.length;

    if (i === nums.length) {
      snap('base', 'Nothing left to decide, so what is in curr right now is one complete subset.', { active: id });
      res.push([...curr]);
      flashAdd = true;
      returns[id] = 1;
      const record = (list) => `Save ${list}. In this version answers appear only at the leaves — one leaf, one subset — and there are exactly 2^n leaves.`;
      snap('record', record(fmt(curr)), { active: id, flash: 'best', spoken: record(subset(curr)) });
      stack.pop();
      return;
    }

    curr.push(nums[i]);
    snap('include', `Left branch: put ${nums[i]} in.`, { active: id, flash: 'call' });
    dfs(i + 1, id, depth + 1);

    curr.pop();
    snap('exclude', `Now the right branch: take ${nums[i]} back out and try without it. Notice the child looks just like this node — leaving a number out does not change curr. That is what makes this a yes-or-no choice instead of a loop.`,
      { active: id, flash: 'return' });
    dfs(i + 1, id, depth + 1);

    returns[id] = res.length - mark;
    snap('recurseEx', `Both choices tried. This part of the tree made ${plural(res.length - mark, 'subset')}.`,
      { active: id, flash: 'return' });
    stack.pop();
  }

  dfs(0, null, 0);

  frames.push({
    ...blank,
    anchor: 'done',
    caption: `${plural(res.length, 'subset')}, one for each leaf of a tree ${nums.length} levels deep. No need to work out 2^n — just count the bottom row.`,
    callStack: [],
    returns: { ...returns },
    revealed: nodes.length,
    collected: { label: 'res', items: res.map(fmt), justAdded: null },
    vars: [{ name: 'curr', value: fmt(curr) }],
    result: res.length,
    flash: 'done',
  });

  return { frames, answer: res.length, nodes, subsets: res };
}

/* 3. Bitmask: the include/exclude decisions, written as an integer. */

function bitmaskFrames(nums) {
  const frames = [];
  const res = [];
  const n = nums.length;
  const total = 1 << n;
  let flashAdd = false;
  let bits = [];
  let focus = null;

  const cells = () => bits.map((b, i) => ({ i, v: b, set: true }));

  const snap = (anchor, caption, extra = {}) => {
    frames.push({
      ...blank,
      anchor,
      caption,
      table: cells(),
      tableFocus: focus,
      collected: {
        label: 'res',
        items: res.map(fmt),
        justAdded: flashAdd ? res.length - 1 : null,
      },
      ...extra,
    });
    flashAdd = false;
  };

  bits = new Array(n).fill(0);
  snap('init', `No recursion and no stack. We simply count from 0 to ${total - 1}. Each number has ${plural(n, 'bit')}, and each bit is a yes-or-no for one of our numbers — the same question the tree asked, written as a number.`, {});

  for (let mask = 0; mask < total; mask++) {
    bits = [];
    for (let i = 0; i < n; i++) bits.push((mask >> i) & 1);
    focus = null;
    const binary = bits.slice().reverse().join('');
    snap('mask', `mask = ${mask}, which is ${binary} in binary. Read the bits right to left: bit i is the yes-or-no for nums[i].`, {
      vars: [{ name: 'mask', value: `${mask} (${binary})` }],
    });

    const curr = [];
    for (let i = 0; i < n; i++) {
      focus = i;
      const on = ((mask >> i) & 1) === 1;
      if (on) {
        curr.push(nums[i]);
        const take = (list) => `Bit ${i} is on, so ${nums[i]} goes in. curr is now ${list}.`;
        snap('take', take(fmt(curr)), {
          flash: 'best',
          spoken: take(words(curr)),
          vars: [{ name: 'mask', value: `${mask} (${binary})` }, { name: 'curr', value: fmt(curr) }],
        });
      } else {
        snap('test', `Bit ${i} is off, so ${nums[i]} stays out.`, {
          vars: [{ name: 'mask', value: `${mask} (${binary})` }, { name: 'curr', value: fmt(curr) }],
        });
      }
    }

    focus = null;
    res.push([...curr]);
    flashAdd = true;
    const record = (list) => `mask ${mask} spells out ${list}. One number, one subset — nothing to branch on, nothing to undo.`;
    snap('record', record(fmt(curr)), {
      flash: 'best',
      spoken: record(subset(curr)),
      vars: [{ name: 'mask', value: `${mask} (${binary})` }, { name: 'curr', value: fmt(curr) }],
    });
  }

  frames.push({
    ...blank,
    anchor: 'done',
    caption: `${plural(res.length, 'subset')} just from counting to ${total - 1}. Same answers, no call stack — but you cannot skip anything early, which is why the recursive version wins the moment a problem adds a rule.`,
    table: cells(),
    collected: { label: 'res', items: res.map(fmt), justAdded: null },
    result: res.length,
    flash: 'done',
  });

  return { frames, answer: res.length, nodes: [], subsets: res };
}

/* ------------------------------------------------------------------ */

export const approaches = [
  {
    id: 'loop',
    name: 'Backtracking',
    tagline: 'Choose, explore, un-choose — the form that generalises.',
    watchFor:
      'Watch curr in the State panel, and watch i in each stack frame. curr returns to exactly what it was before every choice; i picks up exactly where it left off.',
    idea:
      'Keep one shared list. Add a number, explore everything that can follow it, then take the number back out. After that pop, curr is exactly what it was before — so the next choice starts clean. '
      + 'The index is what stops us from making [1,3] and then [3,1] again: each call may only pick numbers to the right of the one just taken.',
    time: 'O(n · 2ⁿ)',
    space: 'O(n)',
    spaceNote: 'The stack is at most n + 1 deep and curr holds at most n values — the 2ⁿ is time, not memory.',
    stackPanel: 'call',
    code: loopCode,
    build: loopFrames,
  },
  {
    id: 'binary',
    name: 'Include / exclude',
    tagline: 'Two choices per element. The 2ⁿ becomes something you can count.',
    watchFor:
      'Watch the bottom row. Every leaf is one subset and there are exactly 2ⁿ of them — that is the whole complexity argument, visible.',
    idea:
      'Instead of looping over what is left, ask one question per number: in, or out? That draws a tree with one level per number, and the answers sit at the bottom. '
      + 'It is the easiest picture to understand — but the loop version is the one you grow into Combinations, Subsets II and Combination Sum.',
    time: 'O(n · 2ⁿ)',
    space: 'O(n)',
    spaceNote: 'Same n-deep stack. The tree has 2ⁿ⁺¹ − 1 nodes but only 2ⁿ of them produce anything.',
    stackPanel: 'call',
    code: binaryCode,
    build: binaryFrames,
  },
  {
    id: 'bitmask',
    name: 'Bitmask',
    tagline: 'Count from 0 to 2ⁿ − 1 and read the bits.',
    watchFor:
      'Watch the bit row against the subset that comes out. The mask is the include/exclude tree, flattened into an integer.',
    idea:
      'Every subset matches one binary number: bit i on means nums[i] is in. So count from 0 up to 2ⁿ − 1 and read off each number\'s bits. No recursion, no stack. '
      + 'It is a nice thing to mention after the recursive one — but only for plain subsets. The moment there is a rule that lets you skip branches early, you want the tree back.',
    time: 'O(n · 2ⁿ)',
    space: 'O(1)',
    spaceNote: 'Beyond the output there is nothing to store — no stack at all.',
    stackPanel: 'none',
    code: bitmaskCode,
    build: bitmaskFrames,
  },
];

export const approachById = (id) => approaches.find((a) => a.id === id) || approaches[0];

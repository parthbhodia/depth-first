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
      ? 'First call: index = 0 and curr is empty. There is no i yet — the for statement is what creates it.'
      : `Frame pushed with index = ${index}. Everything below it is frozen mid-loop, each holding its own i.`,
    { active: id, flash: 'call' });

    const mark = res.length;
    res.push([...curr]);
    flashAdd = true;
    snap('record', depth === 0
      ? 'Record curr immediately, before choosing anything. That is why the empty subset costs nothing extra.'
      : `Record ${fmt(curr)}. Recording happens on arrival, so every node of this tree is an answer — not just the leaves.`,
    { active: id, flash: 'best' });

    for (let i = index; i < nums.length; i++) {
      fr.i = i;
      snap('loop', i === index
        ? `Loop starts at i = index = ${index}. Only nums[${index}] onward are on the table; anything to the left is behind us.`
        : `i advances to ${i}. curr was restored first, so this iteration starts from a clean path.`,
      { active: id });

      curr.push(nums[i]);
      snap('choose', `Choose nums[${i}] = ${nums[i]}. curr is one shared list, so this single push is visible to every frame on the stack.`,
        { active: id, flash: 'call' });

      go(i + 1, id, depth + 1);

      snap('recurse', `Back from the call. This frame resumes on the very next line with i still ${i} — the stack remembered that for us.`,
        { active: id });

      curr.pop();
      snap('unchoose', `Un-choose. curr.pop() restores curr to ${fmt(curr)}, exactly what it was before the choice. Every later sibling depends on this being perfect.`,
        { active: id, flash: 'return' });
    }

    fr.i = 'done';
    returns[id] = res.length - mark;
    snap('loop', index >= nums.length
      ? 'The range is empty, so i is never created at all. Nothing to choose — the call returns immediately.'
      : `No values left. This frame is finished and returns, having contributed ${plural(res.length - mark, 'subset')}.`,
    { active: id, flash: 'return' });

    stack.pop();
  }

  go(0, null, 0);

  frames.push({
    ...blank,
    anchor: 'done',
    caption: `Stack empty, ${plural(res.length, 'subset')} in res — that is 2^${nums.length}. The tree has ${nodes.length} nodes but the stack never held more than ${nums.length + 1} frames: exponential time, linear space.`,
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

    snap('call', depth === 0
      ? 'One call per element, and exactly two choices inside each: take it, or do not.'
      : `Frame for i = ${i}. It decides one thing only: is nums[${i}] in or out?`,
    { active: id, flash: 'call' });

    const mark = res.length;

    if (i === nums.length) {
      snap('base', 'Every element has been decided, so this path is a complete subset.', { active: id });
      res.push([...curr]);
      flashAdd = true;
      returns[id] = 1;
      snap('record', `Record ${fmt(curr)}. Here answers only come from leaves — one leaf, one subset, which is why there are exactly 2^n of them.`,
        { active: id, flash: 'best' });
      stack.pop();
      return;
    }

    curr.push(nums[i]);
    snap('include', `Left branch: take nums[${i}] = ${nums[i]}.`, { active: id, flash: 'call' });
    dfs(i + 1, id, depth + 1);

    curr.pop();
    snap('exclude', `Now the right branch: put ${nums[i]} back and explore without it. Note the child's path is the same as this node's — excluding does not change curr, which is exactly what makes this a binary choice rather than a loop.`,
      { active: id, flash: 'return' });
    dfs(i + 1, id, depth + 1);

    returns[id] = res.length - mark;
    snap('recurseEx', `Both branches done. This subtree produced ${plural(res.length - mark, 'subset')}.`,
      { active: id, flash: 'return' });
    stack.pop();
  }

  dfs(0, null, 0);

  frames.push({
    ...blank,
    anchor: 'done',
    caption: `${plural(res.length, 'subset')}, one per leaf of a perfect binary tree of depth ${nums.length}. The 2^n is not a derivation here — you can count it off the bottom row.`,
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
  snap('init', `No recursion and no stack. Each of the ${total} integers from 0 to ${total - 1} has ${plural(n, 'bit')}, and each bit answers "is nums[i] in?" — the same question the binary tree asked, written as a number.`, {});

  for (let mask = 0; mask < total; mask++) {
    bits = [];
    for (let i = 0; i < n; i++) bits.push((mask >> i) & 1);
    focus = null;
    const binary = bits.slice().reverse().join('');
    snap('mask', `mask = ${mask}, which is ${binary} in binary. Read right to left: bit i decides nums[i].`, {
      vars: [{ name: 'mask', value: `${mask} (${binary})` }],
    });

    const curr = [];
    for (let i = 0; i < n; i++) {
      focus = i;
      const on = ((mask >> i) & 1) === 1;
      if (on) {
        curr.push(nums[i]);
        snap('take', `Bit ${i} is set, so take nums[${i}] = ${nums[i]}. curr is now ${fmt(curr)}.`, {
          flash: 'best',
          vars: [{ name: 'mask', value: `${mask} (${binary})` }, { name: 'curr', value: fmt(curr) }],
        });
      } else {
        snap('test', `Bit ${i} is clear, so nums[${i}] stays out.`, {
          vars: [{ name: 'mask', value: `${mask} (${binary})` }, { name: 'curr', value: fmt(curr) }],
        });
      }
    }

    focus = null;
    res.push([...curr]);
    flashAdd = true;
    snap('record', `mask ${mask} spells out ${fmt(curr)}. One integer, one subset, no branching to keep track of.`, {
      flash: 'best',
      vars: [{ name: 'mask', value: `${mask} (${binary})` }, { name: 'curr', value: fmt(curr) }],
    });
  }

  frames.push({
    ...blank,
    anchor: 'done',
    caption: `${plural(res.length, 'subset')} from counting to ${total - 1}. Same answers, no call stack — but the order is the counting order, and there is nowhere to prune, which is why the recursive form still wins the moment a problem adds a constraint.`,
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
      'One shared list walks the whole tree. Append a value, recurse, then pop it back off — after that pop, curr is byte-for-byte what it was before the branch, so the next sibling starts clean. '
      + 'The index parameter is what stops [1,3] and [3,1] both being generated: each call may only look rightwards of the element the caller just took.',
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
      'Instead of looping over what is left, decide one element at a time: in, or out. That is a strictly binary tree of depth n, and answers appear only at the leaves. '
      + 'It is the more intuitive picture of "each element is in or out", but it does not generalise — the loop form is what you extend for combinations, Subsets II and Combination Sum.',
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
      'Every subset corresponds to one n-bit number: bit i set means nums[i] is in. So loop the integers from 0 to 2ⁿ − 1 and read each one off. '
      + 'No recursion, no stack, and it is a genuinely good answer to give after the recursive one — but only for pure subsets. The moment there is a constraint to prune on, the tree comes back.',
    time: 'O(n · 2ⁿ)',
    space: 'O(1)',
    spaceNote: 'Beyond the output there is nothing to store — no stack at all.',
    stackPanel: 'none',
    code: bitmaskCode,
    build: bitmaskFrames,
  },
];

export const approachById = (id) => approaches.find((a) => a.id === id) || approaches[0];

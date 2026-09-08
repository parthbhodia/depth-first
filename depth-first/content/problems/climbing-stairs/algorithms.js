/**
 * algorithms.js — LeetCode 70, instrumented three ways.
 *
 * These three approaches exist to be watched IN ORDER. They are the same
 * recurrence rendered three times, and the animation is the argument:
 *
 *   naive  — the call tree explodes; the same subproblem is solved over and over
 *   memo   — a lookup prunes every repeat; the tree collapses to a spine
 *   table  — drop the tree entirely and fill the answers bottom-up
 *
 * The bridge between them is the parameter that changes between calls. In
 * climb(k) that is just `k`, so the memo is keyed by k and the table is
 * one-dimensional, indexed by k. That is the whole method for finding a DP
 * state, and it is what these frames are built to show.
 */

/* ------------------------------------------------------------------ */
/* Source, per language, with a line anchor per semantic step          */
/* ------------------------------------------------------------------ */

const naiveCode = {
  python: {
    source: `class Solution:
    def climbStairs(self, n: int) -> int:
        if n <= 2:
            return n

        one_step = self.climbStairs(n - 1)
        two_step = self.climbStairs(n - 2)

        return one_step + two_step`,
    anchors: { call: 2, base: 3, retBase: 4, recurse1: 6, recurse2: 7, ret: 9 },
  },
  javascript: {
    source: `var climbStairs = function(n) {
    if (n <= 2) {
        return n;
    }

    const oneStep = climbStairs(n - 1);
    const twoStep = climbStairs(n - 2);

    return oneStep + twoStep;
};`,
    anchors: { call: 1, base: 2, retBase: 3, recurse1: 6, recurse2: 7, ret: 9 },
  },
  java: {
    source: `class Solution {
    public int climbStairs(int n) {
        if (n <= 2) {
            return n;
        }

        int oneStep = climbStairs(n - 1);
        int twoStep = climbStairs(n - 2);

        return oneStep + twoStep;
    }
}`,
    anchors: { call: 2, base: 3, retBase: 4, recurse1: 7, recurse2: 8, ret: 10 },
  },
  cpp: {
    source: `class Solution {
public:
    int climbStairs(int n) {
        if (n <= 2) {
            return n;
        }

        int oneStep = climbStairs(n - 1);
        int twoStep = climbStairs(n - 2);

        return oneStep + twoStep;
    }
};`,
    anchors: { call: 3, base: 4, retBase: 5, recurse1: 8, recurse2: 9, ret: 11 },
  },
};

const memoCode = {
  python: {
    source: `class Solution:
    def climbStairs(self, n: int) -> int:
        memo = {}

        def climb(k):
            if k <= 2:
                return k
            if k in memo:
                return memo[k]

            one_step = climb(k - 1)
            two_step = climb(k - 2)

            memo[k] = one_step + two_step
            return memo[k]

        return climb(n)`,
    anchors: {
      init: 3, call: 5, base: 6, retBase: 7, probe: 8, hit: 9,
      recurse1: 11, recurse2: 12, store: 14, ret: 15, done: 17,
    },
  },
  javascript: {
    source: `var climbStairs = function(n) {
    const memo = new Map();

    const climb = (k) => {
        if (k <= 2) {
            return k;
        }
        if (memo.has(k)) {
            return memo.get(k);
        }

        const oneStep = climb(k - 1);
        const twoStep = climb(k - 2);

        memo.set(k, oneStep + twoStep);
        return memo.get(k);
    };

    return climb(n);
};`,
    anchors: {
      init: 2, call: 4, base: 5, retBase: 6, probe: 8, hit: 9,
      recurse1: 12, recurse2: 13, store: 15, ret: 16, done: 19,
    },
  },
  java: {
    source: `class Solution {
    private Map<Integer, Integer> memo = new HashMap<>();

    public int climbStairs(int n) {
        if (n <= 2) {
            return n;
        }
        if (memo.containsKey(n)) {
            return memo.get(n);
        }

        int oneStep = climbStairs(n - 1);
        int twoStep = climbStairs(n - 2);

        memo.put(n, oneStep + twoStep);
        return memo.get(n);
    }
}`,
    anchors: {
      init: 2, call: 4, base: 5, retBase: 6, probe: 8, hit: 9,
      recurse1: 12, recurse2: 13, store: 15, ret: 16, done: 4,
    },
  },
  cpp: {
    source: `class Solution {
public:
    unordered_map<int, int> memo;

    int climbStairs(int n) {
        if (n <= 2) {
            return n;
        }
        if (memo.count(n)) {
            return memo[n];
        }

        int oneStep = climbStairs(n - 1);
        int twoStep = climbStairs(n - 2);

        memo[n] = oneStep + twoStep;
        return memo[n];
    }
};`,
    anchors: {
      init: 3, call: 5, base: 6, retBase: 7, probe: 9, hit: 10,
      recurse1: 13, recurse2: 14, store: 16, ret: 17, done: 5,
    },
  },
};

const tableCode = {
  python: {
    source: `class Solution:
    def climbStairs(self, n: int) -> int:
        if n <= 2:
            return n

        dp = [0] * (n + 1)
        dp[1] = 1
        dp[2] = 2

        for i in range(3, n + 1):
            dp[i] = dp[i - 1] + dp[i - 2]

        return dp[n]`,
    anchors: { guard: 3, retGuard: 4, alloc: 6, seed1: 7, seed2: 8, loop: 10, fill: 11, ret: 13 },
  },
  javascript: {
    source: `var climbStairs = function(n) {
    if (n <= 2) {
        return n;
    }

    const dp = new Array(n + 1).fill(0);
    dp[1] = 1;
    dp[2] = 2;

    for (let i = 3; i <= n; i++) {
        dp[i] = dp[i - 1] + dp[i - 2];
    }

    return dp[n];
};`,
    anchors: { guard: 2, retGuard: 3, alloc: 6, seed1: 7, seed2: 8, loop: 10, fill: 11, ret: 14 },
  },
  java: {
    source: `class Solution {
    public int climbStairs(int n) {
        if (n <= 2) {
            return n;
        }

        int[] dp = new int[n + 1];
        dp[1] = 1;
        dp[2] = 2;

        for (int i = 3; i <= n; i++) {
            dp[i] = dp[i - 1] + dp[i - 2];
        }

        return dp[n];
    }
}`,
    anchors: { guard: 3, retGuard: 4, alloc: 7, seed1: 8, seed2: 9, loop: 11, fill: 12, ret: 15 },
  },
  cpp: {
    source: `class Solution {
public:
    int climbStairs(int n) {
        if (n <= 2) {
            return n;
        }

        vector<int> dp(n + 1, 0);
        dp[1] = 1;
        dp[2] = 2;

        for (int i = 3; i <= n; i++) {
            dp[i] = dp[i - 1] + dp[i - 2];
        }

        return dp[n];
    }
};`,
    anchors: { guard: 4, retGuard: 5, alloc: 8, seed1: 9, seed2: 10, loop: 12, fill: 13, ret: 16 },
  },
};

/* ------------------------------------------------------------------ */
/* Frame builders                                                      */
/* ------------------------------------------------------------------ */

const blank = {
  callStack: null, path: [], active: null, returns: {},
  memoHits: [], memo: null, memoProbe: null, revealed: 0,
  table: null, tableFocus: null, tableDeps: null,
  vars: [], result: null, flash: null, dupNote: null,
};

/* 1. Naive recursion — watch the same subproblem get solved again and again. */

function naiveFrames(n) {
  const frames = [];
  const nodes = [];
  const stack = [];
  const returns = {};
  const seen = {};
  let nextId = 0;

  const snap = (anchor, caption, extra = {}) => frames.push({
    ...blank,
    anchor,
    caption,
    callStack: stack.map((f) => ({ label: f.label, nodeId: f.id })),
    path: stack.map((f) => f.id),
    returns: { ...returns },
    revealed: nextId,
    ...extra,
  });

  function climb(k, parentId, depth) {
    const id = nextId++;
    nodes.push({ id, parentId, key: k, label: `climb(${k})`, depth });
    stack.push({ id, label: `climb(${k})` });

    seen[k] = (seen[k] || 0) + 1;
    const nth = seen[k];
    snap(
      'call',
      nth === 1
        ? `Call climb(${k}).`
        : `climb(${k}) again — that is call number ${nth} for the same subproblem. Everything below it is about to be recomputed from scratch.`,
      { active: id, flash: nth > 1 ? 'dup' : 'call', dupNote: nth > 1 ? `climb(${k}) ×${nth}` : null }
    );

    if (k <= 2) {
      snap('base', `k is ${k}, which is at most 2.`, { active: id });
      returns[id] = k;
      snap('retBase', `There are exactly ${k} way${k === 1 ? '' : 's'} to climb ${k} step${k === 1 ? '' : 's'}. Return ${k}.`,
        { active: id, flash: 'return' });
      stack.pop();
      return k;
    }

    snap('recurse1', `To land on step ${k} you arrived from ${k - 1} or from ${k - 2}. Take ${k - 1} first.`, { active: id });
    const one = climb(k - 1, id, depth + 1);
    snap('recurse1', `climb(${k - 1}) came back as ${one}.`, {
      active: id, vars: [{ name: `climb(${k - 1})`, value: one }],
    });

    snap('recurse2', `Now the other way in: climb(${k - 2}).`, {
      active: id, vars: [{ name: `climb(${k - 1})`, value: one }],
    });
    const two = climb(k - 2, id, depth + 1);

    const val = one + two;
    returns[id] = val;
    snap('ret', `${one} + ${two} = ${val}. climb(${k}) returns ${val}.`, {
      active: id,
      flash: 'return',
      vars: [{ name: `climb(${k - 1})`, value: one }, { name: `climb(${k - 2})`, value: two }],
    });

    stack.pop();
    return val;
  }

  const answer = climb(n, null, 0);

  const distinct = new Set(nodes.map((x) => x.key)).size;
  frames.push({
    ...blank,
    anchor: 'ret',
    caption: `climb(${n}) = ${answer}. It took ${nodes.length} calls to solve ${distinct} distinct subproblems — every repeat in that tree is wasted work, and that waste is the entire reason the next tab exists.`,
    callStack: [],
    returns: { ...returns },
    revealed: nodes.length,
    result: answer,
    flash: 'done',
  });

  return { frames, answer, nodes };
}

/* 2. Memoised — the same tree, with every repeat pruned on sight. */

function memoFrames(n) {
  const frames = [];
  const nodes = [];
  const stack = [];
  const returns = {};
  const memo = {};
  const memoHits = [];
  let nextId = 0;
  let hits = 0;

  const snap = (anchor, caption, extra = {}) => frames.push({
    ...blank,
    anchor,
    caption,
    callStack: stack.map((f) => ({ label: f.label, nodeId: f.id })),
    path: stack.map((f) => f.id),
    returns: { ...returns },
    memo: { ...memo },
    memoHits: [...memoHits],
    revealed: nextId,
    ...extra,
  });

  snap('init', `Start with an empty memo. Its keys will be exactly the thing that changes between calls — k.`, {});

  function climb(k, parentId, depth) {
    const id = nextId++;
    nodes.push({ id, parentId, key: k, label: `climb(${k})`, depth });
    stack.push({ id, label: `climb(${k})` });

    snap('call', `Call climb(${k}).`, { active: id, flash: 'call' });

    if (k <= 2) {
      returns[id] = k;
      snap('retBase', `Base case: ${k} step${k === 1 ? '' : 's'}, ${k} way${k === 1 ? '' : 's'}. Return ${k}.`,
        { active: id, flash: 'return' });
      stack.pop();
      return k;
    }

    const known = memo[k] !== undefined;
    snap('probe', known
      ? `Is climb(${k}) in the memo? Yes — it is ${memo[k]}.`
      : `Is climb(${k}) in the memo? Not yet.`,
    { active: id, memoProbe: { key: k, hit: known } });

    if (known) {
      hits += 1;
      returns[id] = memo[k];
      memoHits.push(id);
      snap('hit', `Return ${memo[k]} straight from the table. The entire subtree under climb(${k}) never gets built — that is the whole saving, and it just happened for the ${ordinal(hits)} time.`,
        { active: id, flash: 'hit', memoProbe: { key: k, hit: true } });
      stack.pop();
      return memo[k];
    }

    snap('recurse1', `Nothing stored, so do the work: climb(${k - 1}) first.`, { active: id });
    const one = climb(k - 1, id, depth + 1);

    snap('recurse2', `climb(${k - 1}) = ${one}. Now climb(${k - 2}).`, {
      active: id, vars: [{ name: `climb(${k - 1})`, value: one }],
    });
    const two = climb(k - 2, id, depth + 1);

    const val = one + two;
    memo[k] = val;
    returns[id] = val;
    snap('store', `${one} + ${two} = ${val}. Write memo[${k}] = ${val} so nobody ever computes it again.`, {
      active: id,
      flash: 'best',
      memoProbe: { key: k, hit: false, wrote: true },
      vars: [{ name: `climb(${k - 1})`, value: one }, { name: `climb(${k - 2})`, value: two }],
    });
    snap('ret', `climb(${k}) returns ${val}.`, { active: id, flash: 'return' });

    stack.pop();
    return val;
  }

  const answer = climb(n, null, 0);

  frames.push({
    ...blank,
    anchor: 'done',
    caption: `climb(${n}) = ${answer} in ${nodes.length} calls, ${hits} of which returned instantly from the memo. Compare that with the naive tab — same recurrence, same answer, a fraction of the tree.`,
    callStack: [],
    returns: { ...returns },
    memo: { ...memo },
    memoHits: [...memoHits],
    revealed: nodes.length,
    result: answer,
    flash: 'done',
  });

  return { frames, answer, nodes };
}

const ordinal = (i) => (['first', 'second', 'third', 'fourth', 'fifth'][i - 1] || `${i}th`);

/* 3. Tabulated — no recursion at all; fill the answers in order. */

function tableFrames(n) {
  const frames = [];
  const dp = [];
  const filled = new Set();

  const cells = () => dp.map((v, i) => ({ i, v, set: filled.has(i) }));

  const snap = (anchor, caption, extra = {}) => frames.push({
    ...blank,
    anchor,
    caption,
    table: cells(),
    ...extra,
  });

  if (n <= 2) {
    snap('guard', `n is ${n}, small enough to answer outright.`, {});
    frames.push({
      ...blank,
      anchor: 'retGuard',
      caption: `Return ${n}. With ${n} step${n === 1 ? '' : 's'} there ${n === 1 ? 'is' : 'are'} ${n} way${n === 1 ? '' : 's'} up.`,
      result: n,
      flash: 'done',
    });
    return { frames, answer: n, nodes: [] };
  }

  snap('guard', `n is ${n}, so there is real work to do.`, {});

  for (let i = 0; i <= n; i++) dp.push(0);
  snap('alloc', `Make room for one answer per step, 0 through ${n}. The index IS the subproblem — that is what "k is the state" means in practice.`, {});

  dp[1] = 1;
  filled.add(1);
  snap('seed1', `One step, one way. dp[1] = 1.`, { tableFocus: 1, flash: 'best' });

  dp[2] = 2;
  filled.add(2);
  snap('seed2', `Two steps: 1+1, or one 2. dp[2] = 2. These two seeds replace the base case.`, { tableFocus: 2, flash: 'best' });

  for (let i = 3; i <= n; i++) {
    snap('loop', `Move to step ${i}. Everything it depends on is already sitting to its left.`, {
      tableFocus: i, tableDeps: [i - 1, i - 2],
    });

    dp[i] = dp[i - 1] + dp[i - 2];
    filled.add(i);
    snap('fill', `dp[${i}] = dp[${i - 1}] + dp[${i - 2}] = ${dp[i - 1]} + ${dp[i - 2]} = ${dp[i]}. Same sum as the recursion, but read from the table instead of recomputed.`, {
      tableFocus: i,
      tableDeps: [i - 1, i - 2],
      flash: 'best',
      vars: [{ name: `dp[${i - 1}]`, value: dp[i - 1] }, { name: `dp[${i - 2}]`, value: dp[i - 2] }],
    });
  }

  frames.push({
    ...blank,
    anchor: 'ret',
    caption: `Return dp[${n}] = ${dp[n]}. No call stack, no repeated work, ${n - 1} additions total.`,
    table: cells(),
    tableFocus: n,
    result: dp[n],
    flash: 'done',
  });

  return { frames, answer: dp[n], nodes: [] };
}

/* ------------------------------------------------------------------ */

export const approaches = [
  {
    id: 'naive',
    watchFor:
      'Count how many times climb(3) appears. Every repeat is a subtree being rebuilt from nothing.',
    name: 'Naive recursion',
    tagline: 'Correct, and unusably slow. Watch why.',
    idea:
      'The recurrence is the problem statement: to reach step k you came from k-1 or k-2, so climb(k) = climb(k-1) + climb(k-2). ' +
      'Written literally it is three lines and it is exponential, because nothing remembers anything. Play it and count how many times climb(3) gets solved.',
    time: 'O(2ⁿ)',
    space: 'O(n)',
    spaceNote: 'The call stack is only n deep — it is the branching, not the depth, that kills you.',
    stackPanel: 'call',
    code: naiveCode,
    build: naiveFrames,
  },
  {
    id: 'memo',
    watchFor:
      'Watch the green nodes. Each one is an entire subtree that never gets built.',
    name: 'Memoised',
    tagline: 'One line of storage collapses the tree.',
    idea:
      'Same function, plus a dictionary. Before doing any work, ask whether this exact subproblem is already solved; after doing the work, write it down. ' +
      'The key is k because k is the only thing that differs between calls — find that and you have found your DP state.',
    time: 'O(n)',
    space: 'O(n)',
    spaceNote: 'The memo holds one entry per distinct k, and the call stack is n deep.',
    stackPanel: 'call',
    code: memoCode,
    build: memoFrames,
  },
  {
    id: 'table',
    watchFor:
      'Watch the two blue cells feeding the amber one. That is the recursion, read instead of recomputed.',
    name: 'Bottom-up table',
    tagline: 'Throw the recursion away and fill left to right.',
    idea:
      'The memo already told you the state is a single integer k, so allocate an array indexed by k and fill it in increasing order. ' +
      'Every value you need is already to your left, so no recursion is required at all — the call stack disappears entirely.',
    time: 'O(n)',
    space: 'O(n)',
    spaceNote: 'And since only the last two cells are ever read, this drops to O(1) with two variables.',
    stackPanel: 'none',
    code: tableCode,
    build: tableFrames,
  },
];

export const approachById = (id) => approaches.find((a) => a.id === id) || approaches[0];

/**
 * algorithms.js — LeetCode 39, instrumented three ways.
 *
 * Subsets with three changes, each visible in the trace: the recursive call
 * passes i (not i + 1) so a candidate can be reused, an answer is complete
 * only when the remaining target hits 0 (Q1 is a real check now), and a path
 * can be wrong (target below 0), which is the first pruning.
 *
 *   loop    — Subsets’ loop minus one character, on the remaining target.
 *             Dead ends are real calls and stay on the tree. First tab.
 *   sorted  — the interview upgrade: sort, and break the moment a candidate
 *             would overshoot. Never enters a dead end.
 *   dfs     — include or skip, the picture most videos draw. Faithful, and
 *             the biggest tree of the three, which is the point.
 */

/* ------------------------------------------------------------------ */
/* Source, per language, with a line anchor per semantic step          */
/* ------------------------------------------------------------------ */

const dfsCode = {
  python: {
    source: `class Solution:
    def combinationSum(self, candidates: list[int], target: int) -> list[list[int]]:
        res = []
        self.dfs(0, [], 0, candidates, target, res)
        return res

    def dfs(self, i, cur, total, candidates, target, res):
        # Q1 — complete answer? The total hit the target.
        if total == target:
            res.append(list(cur))
            return
        # Dead end: past the target, or out of candidates.
        if total > target or i == len(candidates):
            return

        # Q2 — what choices do I have? Include candidates[i] (and stay), or skip it.
        cur.append(candidates[i])
        self.dfs(i, cur, total + candidates[i], candidates, target, res)

        cur.pop()
        self.dfs(i + 1, cur, total, candidates, target, res)`,
    anchors: { start: 4, call: 7, check: 9, record: 10, prune: 13, include: 17, recurseIn: 18, unchoose: 20, skip: 21, done: 5 },
  },
  javascript: {
    source: `var combinationSum = function(candidates, target) {
    const res = [];

    const dfs = (i, cur, total) => {
        // Q1 — complete answer? The total hit the target.
        if (total === target) {
            res.push([...cur]);
            return;
        }
        // Dead end: past the target, or out of candidates.
        if (total > target || i === candidates.length) return;

        // Q2 — what choices do I have? Include candidates[i] (and stay), or skip it.
        cur.push(candidates[i]);
        dfs(i, cur, total + candidates[i]);

        cur.pop();
        dfs(i + 1, cur, total);
    };

    dfs(0, [], 0);
    return res;
};`,
    anchors: { start: 21, call: 4, check: 6, record: 7, prune: 11, include: 14, recurseIn: 15, unchoose: 17, skip: 18, done: 22 },
  },
  java: {
    source: `class Solution {
    public List<List<Integer>> combinationSum(int[] candidates, int target) {
        List<List<Integer>> res = new ArrayList<>();
        dfs(0, new ArrayList<>(), 0, candidates, target, res);
        return res;
    }

    private void dfs(int i, List<Integer> cur, int total,
                     int[] candidates, int target, List<List<Integer>> res) {
        // Q1 — complete answer? The total hit the target.
        if (total == target) {
            res.add(new ArrayList<>(cur));
            return;
        }
        // Dead end: past the target, or out of candidates.
        if (total > target || i == candidates.length) return;

        // Q2 — what choices do I have? Include candidates[i] (and stay), or skip it.
        cur.add(candidates[i]);
        dfs(i, cur, total + candidates[i], candidates, target, res);

        cur.remove(cur.size() - 1);
        dfs(i + 1, cur, total, candidates, target, res);
    }
}`,
    anchors: { start: 4, call: 8, check: 11, record: 12, prune: 16, include: 19, recurseIn: 20, unchoose: 22, skip: 23, done: 5 },
  },
  cpp: {
    source: `class Solution {
public:
    vector<vector<int>> combinationSum(vector<int>& candidates, int target) {
        vector<vector<int>> res;
        vector<int> cur;
        dfs(0, cur, 0, candidates, target, res);
        return res;
    }

    void dfs(int i, vector<int>& cur, int total,
             vector<int>& candidates, int target, vector<vector<int>>& res) {
        // Q1 — complete answer? The total hit the target.
        if (total == target) {
            res.push_back(cur);
            return;
        }
        // Dead end: past the target, or out of candidates.
        if (total > target || i == (int)candidates.size()) return;

        // Q2 — what choices do I have? Include candidates[i] (and stay), or skip it.
        cur.push_back(candidates[i]);
        dfs(i, cur, total + candidates[i], candidates, target, res);

        cur.pop_back();
        dfs(i + 1, cur, total, candidates, target, res);
    }
};`,
    anchors: { start: 6, call: 10, check: 13, record: 14, prune: 18, include: 21, recurseIn: 22, unchoose: 24, skip: 25, done: 7 },
  },
};

const loopCode = {
  python: {
    source: `class Solution:
    def combinationSum(self, candidates: list[int], target: int) -> list[list[int]]:
        res = []
        self.backtrack(0, candidates, target, [], res)
        return res

    def backtrack(self, start, nums, target, curr, res):
        # Q1 — complete answer? target is exactly 0: record it.
        if target == 0:
            res.append(list(curr))
            return
        # Dead end: target went negative. Subsets could never be wrong; this can.
        if target < 0:
            return

        # Q2 — what choices do I have? Everything from start on — and start is i,
        # not i + 1, so the same candidate may be taken again.
        for i in range(start, len(nums)):
            curr.append(nums[i])
            self.backtrack(i, nums, target - nums[i], curr, res)
            curr.pop()`,
    anchors: { start: 4, call: 7, check: 9, record: 10, exit: 11, prune: 13, cut: 14, loop: 18, choose: 19, recurse: 20, unchoose: 21, done: 5 },
  },
  javascript: {
    source: `var combinationSum = function(candidates, target) {
    const res = [];

    const backtrack = (start, target, curr) => {
        // Q1 — complete answer? target is exactly 0: record it.
        if (target === 0) {
            res.push([...curr]);
            return;
        }
        // Dead end: target went negative. Subsets could never be wrong; this can.
        if (target < 0) return;

        // Q2 — what choices do I have? Everything from start on — and start is i,
        // not i + 1, so the same candidate may be taken again.
        for (let i = start; i < candidates.length; i++) {
            curr.push(candidates[i]);
            backtrack(i, target - candidates[i], curr);
            curr.pop();
        }
    };

    backtrack(0, target, []);
    return res;
};`,
    anchors: { start: 22, call: 4, check: 6, record: 7, exit: 8, prune: 11, cut: 11, loop: 15, choose: 16, recurse: 17, unchoose: 18, done: 23 },
  },
  java: {
    source: `class Solution {
    public List<List<Integer>> combinationSum(int[] candidates, int target) {
        List<List<Integer>> res = new ArrayList<>();
        backtrack(0, candidates, target, new ArrayList<>(), res);
        return res;
    }

    private void backtrack(int start, int[] nums, int target,
                           List<Integer> curr, List<List<Integer>> res) {
        // Q1 — complete answer? target is exactly 0: record it.
        if (target == 0) {
            res.add(new ArrayList<>(curr));
            return;
        }
        // Dead end: target went negative. Subsets could never be wrong; this can.
        if (target < 0) return;

        // Q2 — what choices do I have? Everything from start on — and start is i,
        // not i + 1, so the same candidate may be taken again.
        for (int i = start; i < nums.length; i++) {
            curr.add(nums[i]);
            backtrack(i, nums, target - nums[i], curr, res);
            curr.remove(curr.size() - 1);
        }
    }
}`,
    anchors: { start: 4, call: 8, check: 11, record: 12, exit: 13, prune: 16, cut: 16, loop: 20, choose: 21, recurse: 22, unchoose: 23, done: 5 },
  },
  cpp: {
    source: `class Solution {
public:
    vector<vector<int>> combinationSum(vector<int>& candidates, int target) {
        vector<vector<int>> res;
        vector<int> curr;
        backtrack(0, candidates, target, curr, res);
        return res;
    }

    void backtrack(int start, vector<int>& nums, int target,
                   vector<int>& curr, vector<vector<int>>& res) {
        // Q1 — complete answer? target is exactly 0: record it.
        if (target == 0) {
            res.push_back(curr);
            return;
        }
        // Dead end: target went negative. Subsets could never be wrong; this can.
        if (target < 0) return;

        // Q2 — what choices do I have? Everything from start on — and start is i,
        // not i + 1, so the same candidate may be taken again.
        for (int i = start; i < nums.size(); i++) {
            curr.push_back(nums[i]);
            backtrack(i, nums, target - nums[i], curr, res);
            curr.pop_back();
        }
    }
};`,
    anchors: { start: 6, call: 10, check: 13, record: 14, exit: 15, prune: 18, cut: 18, loop: 22, choose: 23, recurse: 24, unchoose: 25, done: 7 },
  },
};

const sortedCode = {
  python: {
    source: `class Solution:
    def combinationSum(self, candidates: list[int], target: int) -> list[list[int]]:
        candidates.sort()
        res = []
        self.backtrack(0, [], 0, candidates, target, res)
        return res

    def backtrack(self, start, cur, total, candidates, target, res):
        # Q1 — complete answer? The total hit the target.
        if total == target:
            res.append(list(cur))
            return

        # Q2 — what choices do I have? Any candidate from start on — reuse allowed.
        for j in range(start, len(candidates)):
            if total + candidates[j] > target:
                break  # sorted, so every later candidate overshoots too
            cur.append(candidates[j])
            self.backtrack(j, cur, total + candidates[j], candidates, target, res)
            cur.pop()`,
    anchors: { start: 5, call: 8, check: 10, record: 11, loop: 15, prune: 16, choose: 18, recurse: 19, unchoose: 20, done: 6 },
  },
  javascript: {
    source: `var combinationSum = function(candidates, target) {
    candidates.sort((a, b) => a - b);
    const res = [];

    const backtrack = (start, cur, total) => {
        // Q1 — complete answer? The total hit the target.
        if (total === target) {
            res.push([...cur]);
            return;
        }

        // Q2 — what choices do I have? Any candidate from start on — reuse allowed.
        for (let j = start; j < candidates.length; j++) {
            if (total + candidates[j] > target) break; // sorted: later ones overshoot too
            cur.push(candidates[j]);
            backtrack(j, cur, total + candidates[j]);
            cur.pop();
        }
    };

    backtrack(0, [], 0);
    return res;
};`,
    anchors: { start: 21, call: 5, check: 7, record: 8, loop: 13, prune: 14, choose: 15, recurse: 16, unchoose: 17, done: 22 },
  },
  java: {
    source: `class Solution {
    public List<List<Integer>> combinationSum(int[] candidates, int target) {
        Arrays.sort(candidates);
        List<List<Integer>> res = new ArrayList<>();
        backtrack(0, new ArrayList<>(), 0, candidates, target, res);
        return res;
    }

    private void backtrack(int start, List<Integer> cur, int total,
                           int[] candidates, int target, List<List<Integer>> res) {
        // Q1 — complete answer? The total hit the target.
        if (total == target) {
            res.add(new ArrayList<>(cur));
            return;
        }

        // Q2 — what choices do I have? Any candidate from start on — reuse allowed.
        for (int j = start; j < candidates.length; j++) {
            if (total + candidates[j] > target) break; // sorted: later ones overshoot too
            cur.add(candidates[j]);
            backtrack(j, cur, total + candidates[j], candidates, target, res);
            cur.remove(cur.size() - 1);
        }
    }
}`,
    anchors: { start: 5, call: 9, check: 12, record: 13, loop: 18, prune: 19, choose: 20, recurse: 21, unchoose: 22, done: 6 },
  },
  cpp: {
    source: `class Solution {
public:
    vector<vector<int>> combinationSum(vector<int>& candidates, int target) {
        sort(candidates.begin(), candidates.end());
        vector<vector<int>> res;
        vector<int> cur;
        backtrack(0, cur, 0, candidates, target, res);
        return res;
    }

    void backtrack(int start, vector<int>& cur, int total,
                   vector<int>& candidates, int target, vector<vector<int>>& res) {
        // Q1 — complete answer? The total hit the target.
        if (total == target) {
            res.push_back(cur);
            return;
        }

        // Q2 — what choices do I have? Any candidate from start on — reuse allowed.
        for (int j = start; j < (int)candidates.size(); j++) {
            if (total + candidates[j] > target) break; // sorted: later ones overshoot too
            cur.push_back(candidates[j]);
            backtrack(j, cur, total + candidates[j], candidates, target, res);
            cur.pop_back();
        }
    }
};`,
    anchors: { start: 7, call: 11, check: 14, record: 15, loop: 20, prune: 21, choose: 22, recurse: 23, unchoose: 24, done: 8 },
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
const words = (a) => (a.length ? a.join(', ').replace(/, ([^,]*)$/, ' and $1') : 'nothing');
const combo = (a) => (a.length ? `the combination ${words(a)}` : 'the empty combination');

/* 3. Include or skip. Two choices per frame; the tree is binary, pruned. */

function dfsFrames({ candidates: cand, target }) {
  const frames = [];
  const nodes = [];
  const stack = [];
  const returns = {};
  const res = [];
  const cur = [];
  let nextId = 0;
  let flashAdd = false;

  const snap = (anchor, caption, total, extra = {}) => {
    frames.push({
      ...blank,
      anchor,
      caption,
      callStack: stack.map((f) => ({
        label: f.label,
        nodeId: f.id,
        locals: [
          { name: 'i', value: f.i },
          { name: 'total', value: f.total },
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
        { name: 'cur', value: fmt(cur) },
        { name: 'total', value: total },
        { name: 'target', value: target },
      ],
      ...extra,
    });
    flashAdd = false;
  };

  function dfs(i, total, parentId, depth) {
    const id = nextId++;
    const label = fmt(cur);
    // Keys are unique: the same cur can appear on several paths here and
    // that is not a repeat of work, so no repeat marker should be drawn.
    nodes.push({ id, parentId, key: String(id), label, depth });
    stack.push({ id, label, i, total });

    snap('call', depth === 0
      ? `Start: nothing chosen, total 0. The target is ${target}.`
      : `New frame: i = ${i}, total ${total}, cur ${fmt(cur)}.`,
    total, { active: id, flash: 'call', key: depth === 0, spoken: depth === 0 ? null : `New frame: i equals ${i}, total ${total}, cur is ${words(cur)}.` });

    const mark = res.length;

    if (total === target) {
      snap('check', `Q1 — complete answer? total ${total} equals the target. Yes.`, total, { active: id });
      res.push([...cur]);
      flashAdd = true;
      returns[id] = 1;
      snap('record', `Record ${fmt(cur)} and return.`, total,
        { active: id, flash: 'best', key: true, spoken: `Record ${combo(cur)} and return.` });
      stack.pop();
      return;
    }

    if (total > target || i === cand.length) {
      snap('prune', total > target
        ? `total ${total} is past ${target}. Dead end — return without recording.`
        : `No candidates left to try (i = ${i}). Dead end — return.`,
      total, { active: id, flash: 'return', key: total > target });
      returns[id] = 0;
      stack.pop();
      return;
    }

    snap('check', `Q1 — complete answer? total ${total} is under ${target}. Keep going.`, total, { active: id });

    const c = cand[i];
    cur.push(c);
    snap('include', `Q2, first choice: include ${c}. Stay at i = ${i}, because ${c} may be used again. total becomes ${total + c}.`,
      total + c, { active: id, flash: 'call' });
    dfs(i, total + c, id, depth + 1);

    cur.pop();
    snap('unchoose', `Pop ${c}. cur is back to ${fmt(cur)}, total back to ${total}.`, total,
      { active: id, flash: 'return', spoken: `Pop ${c}. cur is back to ${words(cur)}, total back to ${total}.` });

    snap('skip', `Q2, second choice: skip ${c}. Move on to i = ${i + 1} with the same cur.`, total, { active: id });
    dfs(i + 1, total, id, depth + 1);

    returns[id] = res.length - mark;
    snap('skip', `Both choices tried from here. This frame produced ${plural(res.length - mark, 'combination')}.`, total,
      { active: id, flash: 'return' });
    stack.pop();
  }

  dfs(0, 0, null, 0);

  frames.push({
    ...blank,
    anchor: 'done',
    caption: res.length
      ? `Done: ${plural(res.length, 'combination')} sum to ${target} — ${res.map(fmt).join(', ')}.`
      : `Done: no combination of these candidates sums to ${target}.`,
    spoken: res.length
      ? `Done: ${plural(res.length, 'combination')} sum to ${target}: ${res.map(words).join('; ')}.`
      : null,
    callStack: [],
    returns: { ...returns },
    revealed: nodes.length,
    collected: { label: 'res', items: res.map(fmt), justAdded: null },
    vars: [{ name: 'cur', value: '[ ]' }, { name: 'total', value: 0 }, { name: 'target', value: target }],
    result: res.length,
    flash: 'done',
    key: true,
  });

  return { frames, answer: res.length, nodes, combos: res };
}

/* 1. Subsets' loop, minus one character: recurse on i, not i + 1. The
   remaining target travels down the stack; Q1 is a real check (it hit 0)
   and a frame can be wrong (it went negative). Dead ends are real calls
   and stay on the tree, dashed, so the cost of not sorting is visible. */

const neg = (n) => String(n).replace('-', '−');

function loopFrames({ candidates: cand, target }) {
  const frames = [];
  const nodes = [];
  const stack = [];
  const returns = {};
  const res = [];
  const cur = [];
  let nextId = 0;
  let flashAdd = false;
  let pruned = 0;
  let pushes = 0;

  const snap = (anchor, caption, extra = {}) => {
    frames.push({
      ...blank,
      anchor,
      caption,
      callStack: stack.map((f) => ({
        label: f.label,
        nodeId: f.id,
        locals: [
          { name: 'start', value: f.start },
          { name: 'target', value: neg(f.remaining) },
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
        { name: 'curr', value: fmt(cur) },
        { name: 'target', value: neg(stack.length ? stack[stack.length - 1].remaining : target) },
      ],
      ...extra,
    });
    flashAdd = false;
  };

  function bt(start, remaining, parentId, depth, parent) {
    const id = nextId++;
    const label = fmt(cur);
    nodes.push({ id, parentId, key: String(id), label, depth, sub: `target ${neg(remaining)}`, cut: remaining < 0 });
    const fr = { id, label, start, remaining, i: '—' };
    stack.push(fr);

    if (depth === 0) {
      snap('call', 'A frame starts by asking two questions, not one. Is target exactly 0, meaning we landed on it? Then, is target below 0, meaning we overshot? Only after both does it try any choices.',
        { active: id, flash: 'call', key: true });
    } else {
      pushes += 1;
      const c = cand[parent.i];
      const stayed = start === parent.start;
      let caption;
      let mark;
      if (pushes === 1) {
        mark = 'first';
        caption = `Here is the whole difference from Subsets. The child's start is i, NOT i + 1. The floor did not move — this new frame may take the ${c} again. Meanwhile target came down by ${c}, from ${parent.remaining} to ${neg(remaining)}.`;
      } else if (stayed) {
        mark = 'reuse';
        caption = `Take ${c} again. start stays ${start}, target drops to ${neg(remaining)}. Reuse costs nothing structurally — it is just a floor that refused to rise.`;
      } else {
        mark = 'rose';
        caption = `Take ${c}. Now start becomes ${start}, because i is ${start} — the floor rose this time. From here ${words(cand.slice(0, start))} ${start === 1 ? 'is' : 'are'} out of reach, which is what stops ${fmt([cand[start - 1], cand[start]])} and ${fmt([cand[start], cand[start - 1]])} both existing.`;
      }
      snap('recurse', caption, { active: id, flash: 'call', key: true, mark });
    }

    const mark = res.length;

    if (remaining === 0) {
      snap('check', 'target reaches exactly 0 — the first exit fires. We landed on it.', { active: id, flash: 'best' });
      res.push([...cur]);
      flashAdd = true;
      snap('record', `Record ${fmt(cur)}, then return immediately. The return matters: with target at 0 every further choice can only overshoot, so continuing the loop would be pure waste.`,
        { active: id, flash: 'best', key: true, spoken: `Record ${combo(cur)}, then return immediately. The return matters: with target at 0 every further choice can only overshoot, so continuing the loop would be pure waste.` });
      returns[id] = 1;
      stack.pop();
      return;
    }

    if (remaining < 0) {
      pruned += 1;
      snap('prune', `target is ${neg(remaining)} — the second exit fires and this branch is pruned. Killed for being wrong, not for running out of elements. That is new: Subsets had no way to be wrong.`,
        { active: id, flash: 'return', key: true });
      returns[id] = 0;
      stack.pop();
      return;
    }

    snap('loop', depth === 0
      ? 'Neither exit fired, so the loop begins at i = start = 0.'
      : `target is ${remaining}: not zero, not negative. Loop from start = ${start}${start > 0 ? `, so ${words(cand.slice(0, start))} ${start === 1 ? 'is' : 'are'} off the table` : `, so ${cand[0]} is still on the table`}.`,
    { active: id });

    for (let i = start; i < cand.length; i++) {
      fr.i = i;
      if (i > start) snap('loop', `i advances to ${i} while start stays ${start} — the same floor-and-cursor split as Subsets.`, { active: id });

      cur.push(cand[i]);
      snap('choose', `Take candidates[${i}] = ${cand[i]}. curr is ${fmt(cur)}.`,
        { active: id, flash: 'call', spoken: `Take candidates at ${i}, which is ${cand[i]}. curr is ${words(cur)}.` });

      bt(i, remaining - cand[i], id, depth + 1, fr);

      cur.pop();
      snap('unchoose', `Popped, and the ${cand[i]} is un-chosen. Back in ${fmt(cur)} with i still ${i}.`,
        { active: id, flash: 'return', key: true, spoken: `Popped, and the ${cand[i]} is un-chosen. Back in ${words(cur)} with i still ${i}.` });
    }

    fr.i = 'done';
    returns[id] = res.length - mark;
    snap('loop', `${fmt(cur)} has tried every candidate from position ${start} and returns.`,
      { active: id, flash: 'return', spoken: `${combo(cur)} has tried every candidate from position ${start} and returns.` });
    stack.pop();
  }

  bt(0, target, null, 0, null);

  frames.push({
    ...blank,
    anchor: 'done',
    caption: res.length
      ? `${plural(res.length, 'answer')}: ${res.map(fmt).join(' and ')}. ${nodes.length} nodes explored, ${pruned} of them pruned on arrival. With a bigger target the pruned share grows fast — which is exactly why sorting the candidates and breaking out of the loop early (the next tab) is worth mentioning in an interview.`
      : `No combination of these candidates reaches ${target}. ${nodes.length} nodes explored, ${pruned} of them pruned on arrival.`,
    spoken: res.length
      ? `${plural(res.length, 'answer')}: ${res.map(words).join('; and ')}. ${nodes.length} nodes explored, ${pruned} of them pruned on arrival. With a bigger target the pruned share grows fast, which is exactly why sorting the candidates and breaking out of the loop early is worth mentioning in an interview.`
      : null,
    callStack: [],
    returns: { ...returns },
    revealed: nodes.length,
    collected: { label: 'res', items: res.map(fmt), justAdded: null },
    vars: [{ name: 'curr', value: '[ ]' }, { name: 'target', value: target }],
    result: res.length,
    flash: 'done',
    key: true,
  });

  return { frames, answer: res.length, nodes, combos: res };
}

/* 2. Sorted, so a loop can stop the moment a candidate would overshoot. */

function sortedFrames({ candidates: cand, target }) {
  const frames = [];
  const nodes = [];
  const stack = [];
  const returns = {};
  const res = [];
  const cur = [];
  let nextId = 0;
  let flashAdd = false;

  const snap = (anchor, caption, total, extra = {}) => {
    frames.push({
      ...blank,
      anchor,
      caption,
      callStack: stack.map((f) => ({
        label: f.label,
        nodeId: f.id,
        locals: [
          { name: 'start', value: f.start },
          { name: 'j', value: f.j },
          { name: 'total', value: f.total },
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
        { name: 'cur', value: fmt(cur) },
        { name: 'total', value: total },
        { name: 'target', value: target },
      ],
      ...extra,
    });
    flashAdd = false;
  };

  function bt(start, total, parentId, depth) {
    const id = nextId++;
    const label = fmt(cur);
    nodes.push({ id, parentId, key: String(id), label, depth });
    const fr = { id, label, start, j: '—', total };
    stack.push(fr);

    snap('call', depth === 0
      ? `Start with nothing chosen, total 0. The candidates are sorted: ${words(cand)}.`
      : `New frame: start = ${start}, total ${total}, cur ${fmt(cur)}.`,
    total, { active: id, flash: 'call', key: depth === 0, spoken: depth === 0 ? null : `New frame: start equals ${start}, total ${total}, cur is ${words(cur)}.` });

    const mark = res.length;

    if (total === target) {
      snap('check', `Q1 — complete answer? total ${total} equals the target. Yes.`, total, { active: id });
      res.push([...cur]);
      flashAdd = true;
      returns[id] = 1;
      snap('record', `Record ${fmt(cur)} and return.`, total,
        { active: id, flash: 'best', key: true, spoken: `Record ${combo(cur)} and return.` });
      stack.pop();
      return;
    }

    snap('check', `Q1 — complete answer? total ${total} is under ${target}. Keep going.`, total, { active: id });

    for (let j = start; j < cand.length; j++) {
      fr.j = j;
      const c = cand[j];
      if (total + c > target) {
        snap('prune', `${total} + ${c} would pass ${target}. The candidates are sorted, so every later one overshoots too — stop this loop.`,
          total, { active: id, flash: 'return', key: true });
        break;
      }
      snap('loop', j === start
        ? `Q2 — what choices do I have? Any candidate from position ${start} on. First: ${c}.`
        : `Next choice: ${c}.`,
      total, { active: id });

      cur.push(c);
      snap('choose', `Choose ${c}. total becomes ${total + c}. Recurse with j = ${j}, not j + 1 — ${c} may be used again.`,
        total + c, { active: id, flash: 'call' });

      bt(j, total + c, id, depth + 1);

      snap('recurse', `Back from that call, still on j = ${j}.`, total, { active: id });

      cur.pop();
      snap('unchoose', `Pop ${c}. cur is back to ${fmt(cur)}, total back to ${total}.`, total,
        { active: id, flash: 'return', key: true, spoken: `Pop ${c}. cur is back to ${words(cur)}, total back to ${total}.` });
    }

    fr.j = 'done';
    returns[id] = res.length - mark;
    snap('loop', `Nothing more to try from here. This frame produced ${plural(res.length - mark, 'combination')}.`, total,
      { active: id, flash: 'return' });
    stack.pop();
  }

  bt(0, 0, null, 0);

  frames.push({
    ...blank,
    anchor: 'done',
    caption: res.length
      ? `Done: ${plural(res.length, 'combination')} sum to ${target} — ${res.map(fmt).join(', ')}. The tree has ${nodes.length} nodes; no branch was ever explored past the target.`
      : `Done: no combination of these candidates sums to ${target}.`,
    spoken: res.length
      ? `Done: ${plural(res.length, 'combination')} sum to ${target}: ${res.map(words).join('; ')}. The tree has ${nodes.length} nodes, and no branch was ever explored past the target.`
      : null,
    callStack: [],
    returns: { ...returns },
    revealed: nodes.length,
    collected: { label: 'res', items: res.map(fmt), justAdded: null },
    vars: [{ name: 'cur', value: '[ ]' }, { name: 'total', value: 0 }, { name: 'target', value: target }],
    result: res.length,
    flash: 'done',
    key: true,
  });

  return { frames, answer: res.length, nodes, combos: res };
}

/* ------------------------------------------------------------------ */

export const approaches = [
  {
    id: 'loop',
    name: 'Backtracking',
    tagline: 'Subsets’ loop, minus one character: recurse on i, not i + 1.',
    intuition: `
      <p>We want every combination of candidates that adds up to the target, and a candidate
      may be used any number of times. Build one combination at a time in a shared list
      <code>curr</code>, looping over the candidates from <code>start</code> on — exactly as
      Subsets did.</p>
      <p>Two things change. The recursive call passes <code>i</code>, not <code>i + 1</code>:
      the floor does not move, so the same candidate may be taken again. And a frame asks two
      questions before choosing anything: is <code>target</code> exactly 0 — record and return;
      is it below 0 — we overshot, return without recording.</p>`,
    algorithm: [
      'Define <code>backtrack(start, target, curr)</code>, where <code>target</code> is what is <em>left</em> to reach and <code>start</code> is the first position still allowed.',
      'If <code>target == 0</code>, add a copy of <code>curr</code> to the result and return.',
      'If <code>target < 0</code>, return — this branch overshot and is a dead end.',
      'For each <code>i</code> from <code>start</code> to the end: <b>choose</b> — append <code>candidates[i]</code>; <b>explore</b> — call <code>backtrack(i, target − candidates[i], curr)</code> (the same <code>i</code>, so it may be reused); <b>un-choose</b> — pop it.',
      'Start with <code>backtrack(0, target, [])</code> and return the result.',
    ],
    watchFor:
      'Watch start in the stack frames on a push: when it does not move, that is the reuse. And watch for frames that return with nothing recorded — target went negative, and the branch was killed for being wrong.',
    idea:
      'Two questions, and Subsets’ loop. Q1 — complete answer? Only when the remaining target is exactly 0; below 0 the branch is a dead end, which Subsets never had. Q2 — what choices do I have? Everything from start on — and the recursive call passes i, not i + 1, so a candidate may be chosen again. That single character is the whole difference.',
    time: 'O(2^(t/m))',
    space: 'O(t/m)',
    spaceNote: 'The deepest path uses the smallest candidate m over and over: t/m frames. The tree can reach 2^(t/m) nodes.',
    stackPanel: 'call',
    code: loopCode,
    build: loopFrames,
  },
  {
    id: 'sorted',
    name: 'Sort, then break early',
    tagline: 'The interview upgrade: sorted, so a loop can stop the moment a candidate overshoots.',
    intuition: `
      <p>Build one combination at a time in a shared list <code>cur</code>, looping over the
      candidates that are still allowed — from position <code>start</code> onward. Choosing <code>candidates[j]</code> and recursing
      with <code>j</code> (not <code>j + 1</code>) is what allows reuse; starting the loop at
      <code>j</code> rather than <code>0</code> is what stops <code>[2,3]</code> and
      <code>[3,2]</code> from both appearing.</p>
      <p>Sorting the candidates first lets the loop stop early: once one candidate would push
      the total past the target, every later one would too.</p>`,
    algorithm: [
      'Sort <code>candidates</code>.',
      'Define <code>backtrack(start, cur, total)</code>, where <code>start</code> is the first position still allowed.',
      'If <code>total == target</code>, add a copy of <code>cur</code> to the result and return.',
      'For each <code>j</code> from <code>start</code> to the end: if <code>total + candidates[j] > target</code>, <b>break</b> — every later candidate overshoots too.',
      '<b>Choose</b> — append <code>candidates[j]</code>; <b>explore</b> — call <code>backtrack(j, cur, total + candidates[j])</code> (same <code>j</code>, so it can be reused); <b>un-choose</b> — pop it.',
      'Start with <code>backtrack(0, [], 0)</code> and return the result.',
    ],
    watchFor:
      'Watch the loop stop early: the moment a candidate would overshoot, the frame gives up on every larger candidate at once. That break is the whole reason to sort.',
    idea:
      'Subsets\u2019 loop form with two edits. Recurse with j instead of j + 1, so a candidate can be chosen again; and check the total, because an answer is complete only when it hits the target. '
      + 'Sorting adds the third: once total + candidates[j] passes the target, break — nothing to the right can help. This is the form to write in an interview, and Subsets II and Combinations are edits to it.',
    time: 'O(2^(t/m))',
    space: 'O(t/m)',
    spaceNote: 'Same depth bound. The sorted break cannot change the worst case, but it removes every branch that could never succeed.',
    stackPanel: 'call',
    code: sortedCode,
    build: sortedFrames,
  },
  {
    id: 'dfs',
    name: 'Include or skip',
    tagline: 'The picture most videos draw: take it and stay, or move on — dead ends included.',
    intuition: `
      <p>We want every combination of candidates that adds up to the target. A candidate
      may be used any number of times, so at every index there are two choices: <b>include</b>
      the current candidate and stay at the same index (because it can be reused), or
      <b>skip</b> it and move to the next index.</p>
      <p>Whenever the running total equals the target, record the combination. If the total
      passes the target, or we run out of candidates, that path is a dead end — stop
      exploring it.</p>`,
    algorithm: [
      'Define a recursive function <code>dfs(i, cur, total)</code>, where <code>i</code> is the current index, <code>cur</code> is the combination being built and <code>total</code> is its sum.',
      'If <code>total == target</code>, add a copy of <code>cur</code> to the result and return.',
      'If <code>i</code> is out of bounds or <code>total</code> exceeds the target, return — stop exploring.',
      '<b>Include</b> <code>candidates[i]</code>: append it to <code>cur</code>, call <code>dfs(i, cur, total + candidates[i])</code> (same index), then remove it (backtrack).',
      '<b>Skip</b> <code>candidates[i]</code>: call <code>dfs(i + 1, cur, total)</code>.',
      'Start with <code>dfs(0, [], 0)</code> and return the result.',
    ],
    watchFor:
      'Watch i in the stack frames: on the include branch it does not change. That is the reuse. And watch for dead ends — frames that return with nothing recorded, because total went past the target.',
    idea:
      'Two questions again. Q1 — complete answer? Only when the running total equals the target: unlike Subsets, most paths are not answers, and a path whose total passes the target is a dead end. '
      + 'Q2 — what choices do I have? Include the current candidate and stay at the same index, so it can be reused; or skip it and move to the next. The tree is binary, and pruning is what keeps it small.',
    time: 'O(2^(t/m))',
    space: 'O(t/m)',
    spaceNote: 'The deepest path uses the smallest candidate m over and over: t/m frames. The tree can have up to 2^(t/m) nodes before pruning.',
    stackPanel: 'call',
    code: dfsCode,
    build: dfsFrames,
  },
];

export const approachById = (id) => approaches.find((a) => a.id === id) || approaches[0];

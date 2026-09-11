/**
 * warmup.js — the problem AlgoMonster opens with, instrumented.
 *
 *   Given n, list every string of length n made of the letters A and B.
 *
 * Not a LeetCode problem and not in the registry: it exists to be embedded in
 * the Subsets lesson, where it is the first tree a reader ever grows. It is a
 * full problem object all the same — its own build, code in every language,
 * a reference — so the instrument, the figures and the check script treat it
 * exactly like the real thing.
 */

const code = {
  python: {
    source: `def all_strings(n):
    result = []

    def bt_dfs(path):
        # Q1 — complete answer?
        if len(path) == n:
            result.append("".join(path))
            return

        # Q2 — what choices do I have?
        for char in ["A", "B"]:
            path.append(char)
            bt_dfs(path)
            path.pop()

    bt_dfs([])
    return result`,
    anchors: { start: 16, call: 4, base: 6, record: 7, loop: 11, choose: 12, recurse: 13, unchoose: 14, done: 17 },
  },
  javascript: {
    source: `function allStrings(n) {
    const result = [];

    const btDfs = (path) => {
        // Q1 — complete answer?
        if (path.length === n) {
            result.push(path.join(""));
            return;
        }

        // Q2 — what choices do I have?
        for (const ch of ["A", "B"]) {
            path.push(ch);
            btDfs(path);
            path.pop();
        }
    };

    btDfs([]);
    return result;
}`,
    anchors: { start: 19, call: 4, base: 6, record: 7, loop: 12, choose: 13, recurse: 14, unchoose: 15, done: 20 },
  },
  java: {
    source: `class Warmup {
    List<String> result = new ArrayList<>();
    int n;

    List<String> allStrings(int n) {
        this.n = n;
        btDfs(new StringBuilder());
        return result;
    }

    void btDfs(StringBuilder path) {
        // Q1 — complete answer?
        if (path.length() == n) {
            result.add(path.toString());
            return;
        }

        // Q2 — what choices do I have?
        for (char ch : new char[]{'A', 'B'}) {
            path.append(ch);
            btDfs(path);
            path.deleteCharAt(path.length() - 1);
        }
    }
}`,
    anchors: { start: 7, call: 11, base: 13, record: 14, loop: 19, choose: 20, recurse: 21, unchoose: 22, done: 8 },
  },
  cpp: {
    source: `class Warmup {
public:
    vector<string> result;
    int n;

    vector<string> allStrings(int n) {
        this->n = n;
        string path;
        btDfs(path);
        return result;
    }

    void btDfs(string& path) {
        // Q1 — complete answer?
        if ((int)path.size() == n) {
            result.push_back(path);
            return;
        }

        // Q2 — what choices do I have?
        for (char ch : {'A', 'B'}) {
            path.push_back(ch);
            btDfs(path);
            path.pop_back();
        }
    }
};`,
    anchors: { start: 9, call: 13, base: 15, record: 16, loop: 21, choose: 22, recurse: 23, unchoose: 24, done: 10 },
  },
};

const blank = {
  callStack: null, path: [], active: null, returns: {},
  memoHits: [], memo: null, memoProbe: null, revealed: 0,
  table: null, tableFocus: null, tableDeps: null,
  collected: null,
  vars: [], result: null, flash: null, dupNote: null,
};

const show = (p) => `"${p.join('')}"`;
const plural = (k, w) => `${k} ${w}${k === 1 ? '' : 's'}`;

function frames(n) {
  const out = [];
  const nodes = [];
  const stack = [];
  const returns = {};
  const result = [];
  const path = [];
  let nextId = 0;
  let flashAdd = false;

  // The empty string is "" on screen and "the empty path" out loud.
  const snap = (anchor, caption, extra = {}) => {
    out.push({
      ...blank,
      anchor,
      caption,
      spoken: caption.includes('""') ? caption.replace(/""/g, 'the empty path') : undefined,
      callStack: stack.map((f) => ({
        label: f.label,
        nodeId: f.id,
        locals: [{ name: 'char', value: f.ch }],
      })),
      path: stack.map((f) => f.id),
      returns: { ...returns },
      revealed: nextId,
      collected: {
        label: 'result',
        items: result.map((s) => `"${s}"`),
        justAdded: flashAdd ? result.length - 1 : null,
      },
      vars: [{ name: 'path', value: show(path) }],
      ...extra,
    });
    flashAdd = false;
  };

  function dfs(parentId, depth) {
    const id = nextId++;
    const label = path.length ? path.join('') : 'Empty';
    nodes.push({ id, parentId, key: `${depth}:${path.join('')}`, label, depth });
    const fr = { id, label, ch: '—' };
    stack.push(fr);

    snap('call', depth === 0
      ? 'Start with an empty path. One frame on the stack, nothing decided yet.'
      : `A new frame for path ${show(path)}.`,
    { active: id, flash: 'call' });

    const mark = result.length;

    if (path.length === n) {
      snap('base', `Q1 — complete answer? The path has length ${n}. Yes.`, { active: id });
      result.push(path.join(''));
      flashAdd = true;
      returns[id] = 1;
      snap('record', `Record ${show(path)}, then return — there is nothing left to choose here.`,
        { active: id, flash: 'best' });
      stack.pop();
      return;
    }

    snap('base', `Q1 — complete answer? The path has length ${path.length}, not ${n}. Keep going.`, { active: id });

    for (const ch of ['A', 'B']) {
      fr.ch = ch;
      snap('loop', ch === 'A'
        ? 'Q2 — what choices do I have? Two: add A, or add B. Take A first.'
        : 'Now the other choice: add B.',
      { active: id });

      path.push(ch);
      snap('choose', `Choose ${ch}. The path is now ${show(path)}.`, { active: id, flash: 'call' });

      dfs(id, depth + 1);

      snap('recurse', `Back from that call, still holding ${ch}. The path is ${show(path)} — and it cannot stay that way.`,
        { active: id });

      path.pop();
      snap('unchoose', `Pop. The path is back to ${show(path)}, exactly as it was before choosing ${ch}. Now this same frame can try something different.`,
        { active: id, flash: 'return' });
    }

    fr.ch = 'done';
    returns[id] = result.length - mark;
    snap('loop', `No choices left from ${show(path)}. This frame is finished — it produced ${plural(result.length - mark, 'string')}.`,
      { active: id, flash: 'return' });
    stack.pop();
  }

  dfs(null, 0);

  out.push({
    ...blank,
    anchor: 'done',
    caption: `Done: ${plural(result.length, 'string')}, one per leaf — that is 2^${n}. Every pop put us back exactly one step.`,
    callStack: [],
    returns: { ...returns },
    revealed: nodes.length,
    collected: { label: 'result', items: result.map((s) => `"${s}"`), justAdded: null },
    vars: [{ name: 'path', value: '""' }],
    result: result.length,
    flash: 'done',
  });

  return { frames: out, answer: result.length, nodes, strings: result };
}

const approaches = [
  {
    id: 'dfs',
    name: 'Two questions',
    tagline: 'Check if done, loop through the choices, pop after each one.',
    watchFor:
      'Watch path in the State panel next to the stack. Every pop puts it back exactly one step, and that is what lets the same frame try the other letter.',
    idea:
      'Q1 — complete answer? When the path has length n: record it and return. Q2 — what choices do I have? Add A, or add B. '
      + 'Loop over the choices, go deeper after each, and pop when you come back. The tree you see is built by the walk itself.',
    time: 'O(n · 2ⁿ)',
    space: 'O(n)',
    spaceNote: 'The stack is n deep; the 2ⁿ is the number of leaves, not memory.',
    stackPanel: 'call',
    code,
    build: frames,
  },
];

const all = (n) => {
  const out = [];
  for (let mask = 0; mask < (1 << n); mask++) {
    let s = '';
    for (let i = n - 1; i >= 0; i--) s += (mask >> i) & 1 ? 'B' : 'A';
    out.push(s);
  }
  return out;
};

export default {
  slug: 'ab-strings',
  number: null,
  kicker: 'Warm-up',
  title: 'All strings of A and B',
  stage: 'call-tree',
  inputLabel: 'n',
  parseInput: (text) => Math.max(1, Math.min(3, parseInt(text, 10) || 2)),
  reference: (n) => 1 << n,
  verify(n, built) {
    const got = built.strings;
    if (!got) return 'build() returned no strings to verify';
    if (got.slice().sort().join(',') !== all(n).sort().join(',')) return 'strings do not match every A/B string';
    return null;
  },
  checkInputs: ['1', '2', '3'],
  defaultInput: '2',
  presets: [
    { name: 'n = 1', arr: '1' },
    { name: 'n = 2', arr: '2' },
    { name: 'n = 3 (wide!)', arr: '3' },
  ],
  badgeLabels: { dfs: 'Strings below' },
  callLayout: { nodeW: 64, xGap: 74 },
  approaches,
  approachById: (id) => approaches.find((a) => a.id === id) || approaches[0],
};

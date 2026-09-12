import { approaches, approachById } from './algorithms.js';

/**
 * Inputs are capped so the tree stays a picture: a handful of candidates,
 * a small target. Candidates are sorted on the way in — the loop form
 * needs it for its early stop, and the include/skip form does not care.
 */
const MAX_CANDIDATES = 5;
const MAX_TARGET = 12;

const parse = (text) => {
  const [left = '', right = ''] = String(text).split('|');
  const nums = (s) => s.split(/[^\d]+/).filter((x) => x.length).map((x) => parseInt(x, 10)).filter((v) => Number.isFinite(v) && v > 0);
  let candidates = [...new Set(nums(left))].sort((a, b) => a - b).slice(0, MAX_CANDIDATES);
  let target = nums(right)[0];
  if (!candidates.length) candidates = [2, 3, 6, 7];
  if (!target) target = 7;
  return { candidates, target: Math.min(target, MAX_TARGET) };
};

/** Ground truth, written the plain way so the two traced forms can be checked against it. */
const allCombos = ({ candidates, target }) => {
  const out = [];
  const go = (start, cur, total) => {
    if (total === target) { out.push([...cur]); return; }
    if (total > target) return;
    for (let j = start; j < candidates.length; j++) {
      cur.push(candidates[j]);
      go(j, cur, total + candidates[j]);
      cur.pop();
    }
  };
  go(0, [], 0);
  return out;
};
const canonical = (list) => list.map((c) => c.slice().sort((a, b) => a - b).join(',')).sort().join(' | ');

export default {
  slug: 'combination-sum',
  number: 39,
  title: 'Combination Sum',
  difficulty: 'Medium',
  topics: ['Backtracking', 'Array'],
  pattern: 'Backtracking — reuse, and the first real pruning',

  stage: 'call-tree',
  inputLabel: 'candidates | target',
  parseInput: parse,

  reference(input) {
    return allCombos(input).length;
  },
  verify(input, built) {
    const got = built.combos;
    if (!got) return 'build() returned no combos to verify';
    if (canonical(got) !== canonical(allCombos(input))) return 'combinations do not match the reference';
    const seen = new Set(got.map((c) => c.slice().sort((a, b) => a - b).join(',')));
    if (seen.size !== got.length) return 'produced the same combination twice';
    return null;
  },
  checkInputs: ['2,3,6,7 | 7', '2,3,5 | 8', '2 | 1', '3,5 | 8', '2,3 | 6', '7,3,2 | 7'],

  /** Labels like [2,2,3] need the wider nodes Subsets uses. */
  callLayout: { nodeW: 84, xGap: 96 },

  video: {
    // Chosen by the site owner; title and author verified via YouTube oEmbed.
    youtubeId: 'obBSF4AG3qU',
    title: 'Combination Sum (Leetcode 39) - Medium (Hindi) | Facebook Interview Question',
    channel: 'The Hustling Engineer',
  },

  links: {
    leetcode: 'https://leetcode.com/problems/combination-sum/',
    neetcode: 'https://neetcode.io/problems/combination-target-sum',
  },

  prerequisites: [
    { title: 'Recursion', note: 'how a call stack grows and unwinds, and what a base case is', slug: 'maximum-depth-of-binary-tree' },
    { title: 'Backtracking', note: 'choose, explore, un-choose — and the two questions that write the code', slug: 'subsets' },
    { title: 'Lists', note: 'appending, popping, and copying a list' },
  ],

  blurb:
    'Subsets with a target: a candidate may be reused, an answer is only complete when the total hits the target, and for the first time a branch can be a dead end.',

  lede:
    'Three things change from Subsets, and the trace shows each one: recursing with the <em>same</em> index is what allows reuse, the running <code>total</code> is what decides when an answer is complete, and a total past the target is the first branch you are allowed to abandon. Watch the frames that return with nothing recorded — that is pruning.',

  statement: [
    'Given an array of <strong>distinct</strong> integers <code>candidates</code> and a target integer <code>target</code>, return <em>a list of all unique combinations of</em> <code>candidates</code> <em>where the chosen numbers sum to</em> <code>target</code>. You may return the combinations in any order.',
    'The <strong>same</strong> number may be chosen from <code>candidates</code> an <strong>unlimited number of times</strong>. Two combinations are unique if the frequency of at least one of the chosen numbers is different.',
  ],

  examples: [
    { input: 'candidates = [2,3,6,7], target = 7', output: '[[2,2,3],[7]]' },
    { input: 'candidates = [2,3,5], target = 8', output: '[[2,2,2,2],[2,3,3],[3,5]]' },
    { input: 'candidates = [2], target = 1', output: '[]' },
  ],

  constraints: [
    '1 <= candidates.length <= 30',
    '2 <= candidates[i] <= 40',
    'All elements of candidates are distinct.',
    '1 <= target <= 40',
  ],

  defaultInput: '2,3,6,7 | 7',
  presets: [
    { name: '[2,3,6,7] → 7', arr: '2,3,6,7 | 7' },
    { name: '[2,3,5] → 8', arr: '2,3,5 | 8' },
    { name: '[2] → 1 (none)', arr: '2 | 1' },
    { name: '[3,5] → 8', arr: '3,5 | 8' },
  ],

  badgeLabels: { dfs: 'Combinations below', loop: 'Combinations below' },

  tour: [
    { focus: 'tabs', approach: 'loop',
      text: 'Two tabs, one answer. The first is the form to write in an interview; the second is the picture most videos draw, dead ends and all.' },
    { focus: 'code', approach: 'loop',
      text: 'The two comments again. Q1: is the answer complete? Only when total equals the target. Q2: any candidate from start on — and the recursive call passes j, not j + 1, so a candidate may be chosen again.' },
    { focus: 'stage', approach: 'loop', play: true,
      text: 'Play it. Ten nodes for the whole search, and not one of them is past the target: the sorted break stops each loop the moment a candidate would overshoot.' },
    { focus: 'stack', approach: 'loop', at: { anchor: 'choose' },
      text: 'The reuse. Read the new frame\u2019s start: the same j its parent is on. That single unchanged number is what lets 2 be chosen three times in a row.' },
    { focus: 'stack', approach: 'loop', at: { anchor: 'prune' },
      text: 'The prune. 6 + 2 would pass 7, and because the candidates are sorted, so would 3, 6 and 7 after it — the frame gives up on all of them at once.' },
    { focus: 'stage', approach: 'dfs', play: true,
      text: 'Now the include/skip picture for the same input: fifty-five nodes, twenty-seven of them dead ends, for the same two answers. This is what pruning is worth.' },
    { focus: null, approach: 'loop', at: 'last',
      text: 'Write the first tab in an interview. It becomes Combination Sum II by passing j + 1 and skipping equal neighbours, and Combinations by adding one line of pruning.' },
  ],

  approaches,
  approachById,

  essay: [
    {
      kicker: 'The shape',
      figure: { approach: 'loop', at: 'last', caption: 'Ten nodes for the whole search. Two of them record; none is past the target.' },
      heading: 'Loop from start, recurse on j, and stop early',
      html: `
        <p>
          This is Subsets\u2019 loop with two edits, and the trace shows both. The recursive call
          passes <code>j</code>, not <code>j + 1</code>: a candidate may be chosen again, which
          is why the child frame\u2019s <code>start</code> equals its parent\u2019s <code>j</code>.
          And Q1 is a real check for the first time: a path is an answer only when
          <code>total == target</code>, so the running total travels down the stack as a
          parameter, exactly as every Subsets frame owned its own <code>i</code>.
        </p>
        <p>
          Sorting first buys the third thing: the moment <code>total + candidates[j]</code>
          would pass the target, <code>break</code>. Every later candidate is larger, so none
          of them can help either. That one line is the difference between this tree and the
          fifty-five-node one on the second tab.
        </p>
        <p>
          The copy still matters — <code>res.append(list(cur))</code>, never
          <code>cur</code> — and so does the pop after every call. Loop from
          <code>start</code>, not from <code>0</code>, and <code>[2,3]</code> and
          <code>[3,2]</code> are never both generated.
        </p>
      `,
    },
    {
      kicker: 'What changed from Subsets',
      figure: { approach: 'loop', at: { anchor: 'choose' }, caption: 'The reuse: the frame about to be pushed will start at the same j its parent is on.' },
      heading: 'Three edits, each visible',
      html: `
        <p>
          <strong>Reuse</strong> is one character. Subsets recursed with <code>i + 1</code>
          because each element could be taken at most once; here the call passes
          <code>j</code>. Open the stack panel on a choose step and read the locals: the new
          frame\u2019s <code>start</code> equals the parent\u2019s <code>j</code>. Change it back to
          <code>j + 1</code> and you have Combination Sum II\u2019s shape, minus its duplicate handling.
        </p>
        <p>
          <strong>Completion</strong> moved from "always" to "when the total hits the target".
          Most frames are not answers now — only the two that record are.
        </p>
        <p>
          <strong>Dead ends</strong> are new. Once <code>total</code> would pass the target no
          extension can bring it back. The loop form refuses to enter such a branch; the
          include/skip form enters it and returns at once. Without either, the search would
          add the smallest candidate forever.
        </p>
      `,
    },
    {
      kicker: 'The other picture',
      figure: { approach: 'dfs', at: 'last', caption: 'Include or skip on the same input: fifty-five nodes, and only two leaves record anything.' },
      heading: 'Include it and stay, or skip it and move on',
      html: `
        <p>
          The second tab is the form most videos draw. Each frame looks at one candidate and
          asks one question with two answers: include it — push it, add it to
          <code>total</code>, recurse with the <em>same</em> index — or skip it, recursing
          with <code>i + 1</code> and the same <code>cur</code>. Dead ends are frames that
          return without recording: <code>total</code> past the target, or no candidates left.
        </p>
        <p>
          It is correct, and it is a fine way to understand the problem. It is also
          fifty-five nodes for two answers, because every dead end is a call. That contrast
          is the reason to sort and break in the first tab, and the thing to say out loud when
          an interviewer asks "can you prune?".
        </p>
      `,
    },
  ],

  comparison: {
    kicker: 'Two renderings',
    heading: 'Same combinations, two shapes',
    columns: ['Version', 'Tree shape', 'Where answers appear', 'Pruning', 'When you would write it'],
    rows: [
      ['Backtracking (sorted loop from start)', 'n-ary; never enters a dead end', 'Frames where total == target', 'Break once a candidate overshoots',
        'Always, in an interview. It is the form that becomes Combination Sum II and Combinations by editing a line.'],
      ['Include or skip', 'Binary; dead ends explored one at a time', 'Leaves where total == target', 'Return when total > target',
        'To understand it, and when each candidate genuinely is a yes/no decision. The form most videos draw.'],
    ],
    footnote: `
      Both are exponential in the worst case — the deepest path repeats the smallest candidate
      t/m times, so the tree can reach 2^(t/m) nodes. Say that bound out loud, then say that the
      sorted break removes every branch that could never succeed.
    `,
  },

  traps: {
    kicker: 'Failure modes',
    heading: 'Four ways this runs and still returns nonsense',
    items: [
      {
        title: 'Recursing with <code>i + 1</code> on the include branch',
        body: 'That forbids reuse, so <code>[2,2,3]</code> is never found. The include branch must stay at <code>i</code>; only the skip branch moves on. One character separates this problem from Subsets.',
      },
      {
        title: 'No stop for <code>total > target</code>',
        body: 'The include branch keeps adding the smallest candidate forever — the recursion never returns. The dead-end check is not an optimisation here, it is what makes the function terminate.',
      },
      {
        title: 'Looping from <code>0</code> instead of <code>start</code>',
        body: 'In the loop form this generates <code>[2,3]</code> and <code>[3,2]</code> as separate answers. The start index is the entire duplicate-prevention mechanism, exactly as in Subsets.',
      },
      {
        title: 'Breaking without sorting',
        body: 'The early <code>break</code> assumes every later candidate is larger. On unsorted input it skips valid answers. Sort first, or use <code>continue</code> and give up the prune.',
      },
    ],
  },

  next: {
    kicker: 'What it unlocks',
    heading: 'The same skeleton, one edit each',
    intro: 'Combination Sum is Subsets plus a target. Each of these changes exactly one thing about it:',
    items: [
      { num: 40, title: 'Combination Sum II', note: 'Each candidate once, and duplicates in the input. Recurse with j + 1 again, and skip a candidate equal to the one before it at the same level.' },
      { num: 216, title: 'Combination Sum III', note: 'Exactly k numbers from 1 to 9. Q1 gains a second condition: the length must be k too.' },
      { num: 77, title: 'Combinations', note: 'Subsets with a fixed size k. Adds the one-line prune that stops branches too short to ever reach k.' },
      { num: 377, title: 'Combination Sum IV', note: 'Count instead of list, and order matters. That flips it from backtracking to dynamic programming — the tree would be far too big to walk.' },
      { num: 90, title: 'Subsets II', note: 'Back to Subsets, with duplicates in the input. The same sort-then-skip trick as Combination Sum II.' },
    ],
  },

  interview: {
    kicker: 'In the room',
    heading: 'The order to say things in',
    html: `
      <p>
        Say the shape first: "backtracking — I will build one combination at a time, and at
        each step either include the current candidate and stay on it, or skip it." Then say
        the two conditions before any code: an answer is complete when the total equals the
        target, and a branch dies when it passes the target. Naming the dead end up front
        shows you know the recursion needs it to terminate.
      </p>
      <p>
        Write the loop form if you can. Mention the sort and the break as you write them —
        "sorted, so once one candidate overshoots I can stop the loop" — and give the
        complexity honestly: exponential, about 2 to the t over m, with the prune removing
        branches that could never succeed rather than changing the bound.
      </p>
      <p>
        The follow-ups are all one edit. "Each candidate once" is j + 1. "Duplicates in the
        input" is the sort-then-skip of Combination Sum II. "Just count them" is a different
        problem — dynamic programming — and saying so is the answer.
      </p>
    `,
  },
};

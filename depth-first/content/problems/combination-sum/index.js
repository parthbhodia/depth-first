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
  pattern: 'Backtracking — one character from Subsets',

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
  /** Two-line nodes: the combination, and what is left of the target. */
  callLayout: { nodeW: 84, xGap: 96, nodeH: 36 },

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
    'Subsets with a target, one character apart: recurse on i instead of i + 1 and a candidate may be reused; an answer is complete only when the target is met, and for the first time a branch can be wrong.',

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

  defaultInput: '2,3 | 6',
  presets: [
    { name: '[2,3] → 6 (smallest proof)', arr: '2,3 | 6' },
    { name: '[2,3,6,7] → 7', arr: '2,3,6,7 | 7' },
    { name: '[2,3,5] → 8', arr: '2,3,5 | 8' },
    { name: '[2] → 1 (none)', arr: '2 | 1' },
  ],

  badgeLabels: { loop: 'Combinations below', sorted: 'Combinations below', dfs: 'Combinations below' },

  tour: [
    { focus: 'tabs', approach: 'loop',
      text: 'Three tabs, one answer. The first is Subsets’ loop minus one character; the second adds a sort so the loop can stop early; the third is the picture most videos draw, dead ends and all.' },
    { focus: 'code', approach: 'loop',
      text: 'Two exits, then the loop. Q1: target exactly 0 — record and return. Then: target below 0 — return, this branch overshot. And the recursive call passes i, not i + 1. That is the one character.' },
    { focus: 'stage', approach: 'loop', play: true,
      text: 'Play it. Nine nodes: two record, two are pruned on arrival, and every node carries what is left of the target.' },
    { focus: 'stack', approach: 'loop', at: { anchor: 'recurse', match: (f) => f.mark === 'first' },
      text: 'The one character. Read the new frame’s start: the same as its parent’s i. The floor did not move, so this frame may take the 2 again.' },
    { focus: 'stack', approach: 'loop', at: { anchor: 'prune' },
      text: 'Killed for being wrong. target is −1, so this frame returns without recording — a dead end, which Subsets never had.' },
    { focus: 'stage', approach: 'sorted', play: true,
      text: 'Sort, then break early: the same answers from seven nodes, because a frame gives up on every larger candidate the moment one overshoots.' },
    { focus: 'stage', approach: 'dfs', play: true,
      text: 'The include/skip picture on the same input: one question per candidate, dead ends explored one at a time. Count the nodes.' },
    { focus: null, approach: 'loop', at: 'last',
      text: 'Write the first tab in an interview, then say the upgrade out loud: sort, and break. It becomes Combination Sum II by passing i + 1 and skipping equal neighbours.' },
  ],

  /**
   * Read before the instrument: the [2,3] → 6 walkthrough, the shortest input
   * that shows reuse, a dead end and the floor at once. Every picture is the
   * real trace, and the buttons land the embedded instrument on its frames.
   */
  lesson: {
    kicker: 'Combination Sum, from Subsets',
    heading: 'The same loop, minus one character.',
    invite: 'One tiny input, three things to see: reuse, a dead end, and the floor. About three minutes.',
    finish: { approach: 'loop', play: true, label: 'Play the trace' },
    steps: [
      {
        title: 'Why [2,3] and a target of 6',
        html: `
          <p><code>candidates = [2, 3]</code>, <code>target = 6</code>. Small on purpose: it is
          the shortest input that shows all three things at once — an element reused, a branch
          killed for overshooting, and the floor that stops <code>[3,2]</code> ever being
          built.</p>
          <p>Nine nodes. Two of them record; two are pruned on arrival, drawn dashed. Each node
          carries what is left of the target.</p>`,
        figure: { approach: 'loop', at: 'last', input: '2,3 | 6',
          caption: 'The whole search for [2,3] → 6. Answers: [2,2,2] and [3,3]. Dashed nodes overshot and returned with nothing.' },
      },
      {
        title: 'The one character',
        html: `
          <p>Subsets recurses on <code>i + 1</code>. This recurses on <code>i</code>. That single
          change is what turns "use each element at most once" into "reuse it as often as you
          like" — watch <code>start</code> refuse to move on a push.</p>
          <p>The other change is at the top: a frame asks two questions, not one, before it
          tries any choices.</p>`,
        approach: 'loop',
        lang: 'python',
        parts: [
          { label: 'Two exits, not one', note: 'Q1 — target exactly 0: record and return. Then: target below 0, this branch overshot — return.', anchors: ['check', 'record', 'exit', 'prune', 'cut'] },
          { label: 'The one character', note: 'backtrack(i, …), not i + 1 — the floor does not move, so the candidate may be taken again', anchors: ['recurse'] },
          { label: 'Choose, un-choose', note: 'unchanged from Subsets', anchors: ['loop', 'choose', 'unchoose'] },
        ],
      },
      {
        title: 'Watch start refuse to move',
        html: `
          <p>The whole run, with the call stack beside the tree. Every frame carries its own
          <code>start</code>, <code>target</code> and <code>i</code>. Jump to the moments that
          matter, or step through with the arrows.</p>`,
        instrument: { approach: 'loop', input: '2,3 | 6' },
        jumps: [
          { target: 'embedded', approach: 'loop', at: { anchor: 'recurse', match: (f) => f.mark === 'first' }, label: 'Jump to the one character', key: true },
          { target: 'embedded', approach: 'loop', at: { anchor: 'record' }, label: 'Reuse: 6 → 4 → 2 → 0, recorded' },
          { target: 'embedded', approach: 'loop', at: { anchor: 'prune' }, label: 'Killed for being wrong' },
          { target: 'embedded', approach: 'loop', at: { anchor: 'recurse', match: (f) => f.mark === 'rose' }, label: 'The floor rises: no [3,2]' },
          { target: 'embedded', approach: 'loop', play: true, label: 'Play it all' },
        ],
      },
      {
        title: 'Two exits, not one',
        html: `
          <p>Subsets recorded on arrival and could never be wrong. Here a frame can land exactly
          on the target, or overshoot it, and the two need different answers — so the two
          questions come first, before the loop.</p>`,
        questions: [
          { q: 'When is the answer complete?',
            a: 'When <code>target</code> is exactly 0: we landed on it. Record <code>curr</code> and return at once — with nothing left to reach, every further choice can only overshoot, so continuing the loop would be pure waste.' },
          { q: 'When is a branch wrong?',
            a: 'When <code>target</code> is below 0: we overshot. Return without recording. The branch was killed for being wrong, not for running out of elements — that is new, and it is the first pruning you have seen.' },
        ],
      },
      {
        title: 'Then prune smarter',
        html: `
          <p>Nine nodes explored, two of them pruned on arrival. With a bigger target the pruned
          share grows fast — which is exactly why sorting the candidates and breaking out of
          the loop early is worth mentioning in an interview.</p>
          <p>That is the second tab: the same two answers from seven nodes, because a frame
          gives up on every larger candidate the moment one overshoots. The third tab is the
          include/skip picture, for when someone draws it that way.</p>`,
        figure: { approach: 'sorted', at: 'last', input: '2,3 | 6',
          caption: 'Sorted, then break: seven nodes for the same two answers. No dead end is ever entered.' },
        jumps: [
          { approach: 'sorted', play: true, label: 'Play the sorted form' },
          { approach: 'loop', play: true, label: 'Play the one-character form' },
        ],
      },
    ],
  },

  approaches,
  approachById,

  essay: [
    {
      kicker: 'The shape',
      figure: { approach: 'loop', at: 'last', caption: 'Subsets’ loop with the recursive call on i. Nine nodes for [2,3] → 6; the dashed two overshot.' },
      heading: 'The same loop, minus one character',
      html: `
        <p>
          Subsets recurses on <code>i + 1</code>. This recurses on <code>i</code>. That single
          change is what turns "use each element at most once" into "reuse it as often as you
          like": the child's <code>start</code> is its parent's <code>i</code>, the floor does
          not move, and the same candidate is on the table again. Open the stack panel on a
          push and read the two frames — that unchanged number is the reuse.
        </p>
        <p>
          The floor still does its old job. When the loop advances to <code>i = 1</code> and
          takes the 3, the child's <code>start</code> becomes 1 and the 2 is out of reach, which
          is what stops <code>[2,3]</code> and <code>[3,2]</code> both existing — the same
          duplicate-prevention Subsets used, untouched.
        </p>
        <p>
          Q1 is a real check for the first time. In Subsets every path was an answer; here a
          frame asks two questions before choosing anything. Is <code>target</code> exactly 0 —
          record and return, because every further choice could only overshoot. Is it below 0 —
          return without recording. Those frames are the dashed nodes: killed for being wrong,
          not for running out of elements. Subsets had no way to be wrong.
        </p>
      `,
    },
    {
      kicker: 'What changed from Subsets',
      figure: { approach: 'loop', at: { anchor: 'recurse', match: (f) => f.mark === 'first' }, caption: 'The first push: the new frame’s start equals its parent’s i. The floor did not move.' },
      heading: 'Three edits, each visible',
      html: `
        <p>
          <strong>Reuse</strong> is one character. Subsets passed <code>i + 1</code> because each
          element could be taken at most once; here the call passes <code>i</code>. Change it
          back and you have Combination Sum II's shape, minus its duplicate handling.
        </p>
        <p>
          <strong>Completion</strong> moved from "always" to "when the remaining target hits
          0". That is why <code>target</code> travels down the stack as a parameter, shrinking
          by each choice: every frame owns its own, exactly as every Subsets frame owned its own
          <code>i</code>.
        </p>
        <p>
          <strong>Dead ends</strong> are new. Once <code>target</code> is below 0 no extension can
          bring it back, so the frame returns at once. Without that line the loop would add the
          smallest candidate forever — the check is not an optimisation, it is what makes the
          recursion terminate.
        </p>
      `,
    },
    {
      kicker: 'The interview upgrade',
      figure: { approach: 'sorted', at: 'last', caption: 'Sorted, then break: seven nodes for the same two answers. No dead end is ever entered.' },
      heading: 'Sort, then break early',
      html: `
        <p>
          With a bigger target the pruned share grows fast, and every dead end is a call. The
          second tab sorts the candidates first, and inside the loop asks one more question:
          would this candidate overshoot? If so, <code>break</code> — every later candidate is
          larger, so none of them can help either. The frame gives up on all of them at once
          and never enters the dead end.
        </p>
        <p>
          Same two answers, seven nodes instead of nine on this input, and the gap widens with
          the target. Say it out loud after you have written the first form: "sorted, so once one
          candidate overshoots I can stop the loop." That sentence is what interviewers mean by
          "can you prune?".
        </p>
      `,
    },
    {
      kicker: 'The other picture',
      figure: { approach: 'dfs', at: 'last', caption: 'Include or skip on the same input: one question per candidate, and every dead end is a leaf.' },
      heading: 'Include it and stay, or skip it and move on',
      html: `
        <p>
          The third tab is the form most videos draw. Each frame looks at one candidate and asks
          one question with two answers: include it — push it, subtract it from the target,
          recurse with the <em>same</em> index — or skip it, recursing with <code>i + 1</code> and
          the same <code>curr</code>. Dead ends are frames that return without recording: target
          below 0, or no candidates left.
        </p>
        <p>
          It is correct, and it is a fine way to understand the problem. It is also the biggest
          tree of the three for the same answers, because every dead end is reached one decision
          at a time. That contrast is the reason to write the loop, and then to sort.
        </p>
      `,
    },
  ],

  comparison: {
    kicker: 'Three renderings',
    heading: 'Same combinations, three shapes',
    columns: ['Version', 'Tree on [2,3] → 6', 'Where answers appear', 'Pruning', 'When you would write it'],
    rows: [
      ['Backtracking (loop on i)', '9 nodes, 2 dead ends', 'Frames where target == 0', 'Return when target < 0',
        'First, always. It is Subsets’ loop minus one character, and the form Combination Sum II and Combinations are edits to.'],
      ['Sort, then break early', '7 nodes, no dead ends', 'Frames where target == 0', 'Break once a candidate overshoots',
        'Right after the first, in the same interview: "sorted, so I can stop the loop early." The upgrade to mention, not the place to start.'],
      ['Include or skip', 'Binary; dead ends one decision at a time', 'Leaves where target == 0', 'Return when target < 0',
        'To understand it, and when each candidate genuinely is a yes/no decision. The form most videos draw.'],
    ],
    footnote: `
      All three are exponential in the worst case — the deepest path repeats the smallest candidate
      t/m times, so the tree can reach 2^(t/m) nodes. Say that bound out loud, then say that the
      sorted break removes every branch that could never succeed.
    `,
  },

  traps: {
    kicker: 'Failure modes',
    heading: 'Four ways this runs and still returns nonsense',
    items: [
      {
        title: 'Passing <code>i + 1</code> to the recursive call',
        body: 'That is Subsets, and it forbids reuse: <code>[2,2,2]</code> is never found. The call must pass <code>i</code>; only the loop’s next iteration moves on. One character separates the two problems.',
      },
      {
        title: 'No exit for <code>target < 0</code>',
        body: 'The loop keeps adding the smallest candidate forever — the recursion never returns. The dead-end check is not an optimisation here, it is what makes the function terminate.',
      },
      {
        title: 'Looping from <code>0</code> instead of <code>start</code>',
        body: 'This generates <code>[2,3]</code> and <code>[3,2]</code> as separate answers. The start index is the entire duplicate-prevention mechanism, exactly as in Subsets.',
      },
      {
        title: 'Breaking without sorting',
        body: 'The second tab’s early <code>break</code> assumes every later candidate is larger. On unsorted input it skips valid answers. Sort first, or keep the first tab’s plain return and give up the prune.',
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

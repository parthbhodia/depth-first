import { approaches, approachById } from './algorithms.js';

/** n! grows fast: four numbers is 24 leaves and already a wide picture. */
const MAX_N = 4;

const parse = (text) => {
  const nums = [...new Set(String(text)
    .split(/[^\d-]+/)
    .filter((s) => s.length)
    .map((s) => parseInt(s, 10))
    .filter((v) => Number.isFinite(v)))].slice(0, MAX_N);
  return nums.length ? nums : [1, 2, 3];
};

const factorial = (n) => (n <= 1 ? 1 : n * factorial(n - 1));
const canonical = (list) => list.map((p) => p.join(',')).sort().join(' | ');
const allPerms = (nums) => {
  if (nums.length <= 1) return [nums.slice()];
  const out = [];
  nums.forEach((x, i) => {
    for (const rest of allPerms([...nums.slice(0, i), ...nums.slice(i + 1)])) out.push([x, ...rest]);
  });
  return out;
};

export default {
  slug: 'permutations',
  number: 46,
  title: 'Permutations',
  difficulty: 'Medium',
  topics: ['Backtracking', 'Array'],
  pattern: 'Backtracking — when order matters',

  stage: 'call-tree',
  inputLabel: 'nums',
  parseInput: parse,

  reference(nums) {
    return factorial(nums.length);
  },
  verify(nums, built) {
    const got = built.perms;
    if (!got) return 'build() returned no permutations to verify';
    const seen = new Set(got.map((p) => p.join(',')));
    if (seen.size !== got.length) return 'produced the same permutation twice';
    if (canonical(got) !== canonical(allPerms(nums))) return 'permutations do not match the reference';
    return null;
  },
  checkInputs: ['1,2,3', '0,1', '1', '1,2,3,4', '5,9'],

  callLayout: { nodeW: 84, xGap: 96 },

  video: {
    // Same channel as the Subsets and Combination Sum pages; title and author from a YouTube search.
    youtubeId: 'vInz1Sn4z1Y',
    title: 'Permutations (Leetcode 46) - Medium (Hindi) | Google Interview Question',
    channel: 'The Hustling Engineer',
  },

  links: {
    leetcode: 'https://leetcode.com/problems/permutations/',
    neetcode: 'https://neetcode.io/problems/permutations',
  },

  prerequisites: [
    { title: 'Subsets', note: 'choose, explore, un-choose, and the two questions that write the code', slug: 'subsets' },
    { title: 'Recursion', note: 'how a call stack grows and unwinds, and what a base case is', slug: 'maximum-depth-of-binary-tree' },
    { title: 'Lists', note: 'appending, popping, swapping, and copying a list' },
  ],

  blurb:
    'Subsets where order matters. The loop restarts at 0 in every frame, a used array stops repeats, and answers move to the leaves.',

  lede:
    'Two edits turn Subsets into Permutations, and the trace shows both. The loop starts at <code>0</code> in every frame — because in an ordering, a number that came earlier in the array may still come later — so a <code>used</code> array has to stop a number being placed twice. And an ordering is only complete when every number is in it, so the record moves from "on arrival" to the leaves. The second tab does the same job with no extra list at all: the array itself is the state, and the un-choose is a swap back.',

  statement: [
    'Given an array <code>nums</code> of <strong>distinct</strong> integers, return <em>all the possible permutations</em>. You can return the answer in <strong>any order</strong>.',
  ],

  examples: [
    { input: 'nums = [1,2,3]', output: '[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]' },
    { input: 'nums = [0,1]', output: '[[0,1],[1,0]]' },
    { input: 'nums = [1]', output: '[[1]]' },
  ],

  constraints: [
    '1 <= nums.length <= 6',
    '-10 <= nums[i] <= 10',
    'All the integers of nums are unique.',
  ],

  defaultInput: '1,2,3',
  presets: [
    { name: '[1,2]', arr: '1,2' },
    { name: '[1,2,3]', arr: '1,2,3' },
    { name: '[1,2,3,4] (wide!)', arr: '1,2,3,4' },
    { name: 'single [7]', arr: '7' },
  ],

  badgeLabels: { used: 'Permutations below', swap: 'Permutations below' },

  tour: [
    { focus: 'tabs', approach: 'used',
      text: 'Two tabs, one answer. The first is Subsets with two edits; the second gets rid of the extra list entirely by swapping numbers into place.' },
    { focus: 'code', approach: 'used',
      text: 'The two comments. Q1: is the answer complete? Only when every number is placed — so the record is at the leaves now. Q2: any number not used yet — the loop starts at 0, not at index.' },
    { focus: 'stage', approach: 'used', play: true,
      text: 'Play it. Three branches at the top, two under each, one under each of those: 3 × 2 × 1 leaves, and every leaf is an answer.' },
    { focus: 'stack', approach: 'used', at: { anchor: 'skip' },
      text: 'The skip. This frame is looking at a number that is already in curr. Without the used array it would place 1 twice and produce [1,1,1].' },
    { focus: 'stage', approach: 'swap', play: true,
      text: 'Now the swap form. Same tree, but watch nums in the State panel: it is the only state there is, and every swap is undone on the way back up.' },
    { focus: null, approach: 'used', at: 'last',
      text: 'Write the first tab in an interview; it is the one that becomes Permutations II by adding the same sort-and-skip line as Subsets II.' },
  ],

  approaches,
  approachById,

  essay: [
    {
      kicker: 'The shape',
      figure: { approach: 'used', at: 'last', caption: 'Three, then two, then one: 3! leaves, each one a permutation.' },
      heading: 'Any unused number may come next',
      html: `
        <p>
          The two comments in the code are the whole design. <em>Q1 — complete answer?</em>
          Only when <code>curr</code> holds every number: an ordering with a number missing is
          not an ordering. So the record sits at the leaves, behind a check, exactly as it did
          in the A/B warm-up on the Subsets page. <em>Q2 — what choices do I have?</em> Any
          number not yet used — which is why the loop starts at <code>0</code> in every frame.
        </p>
        <p>
          That restart is what makes a <code>used</code> array necessary. In Subsets the loop
          started after the last choice, so a number could not be picked twice by
          construction. Here <code>nums[0]</code> is a candidate in every frame, and the only
          thing stopping <code>[1,1,1]</code> is a flag. The un-choose therefore undoes two
          things: the pop, and the flag.
        </p>
        <p>
          Count the leaves and you have the complexity: <code>n</code> choices, then
          <code>n − 1</code>, then <code>n − 2</code> … so <code>n!</code> answers, each
          copied at cost <code>n</code>.
        </p>
      `,
    },
    {
      kicker: 'The other picture',
      figure: { approach: 'swap', at: { anchor: 'swap' }, caption: 'Position 0 is filled by swapping a later number into it; the frame below will fill position 1 from what remains.' },
      heading: 'The array is the state',
      html: `
        <p>
          The swap form keeps no <code>curr</code> and no <code>used</code>. Everything before
          position <code>first</code> is decided; everything from <code>first</code> on is the
          pool of unused numbers. To choose, swap a pool number into position
          <code>first</code> and recurse on <code>first + 1</code>. To un-choose, swap it back.
        </p>
        <p>
          Watch <code>nums</code> in the State panel while stepping: it changes in every frame,
          and after every swap back it is exactly what the frame received. That is the same
          rule Subsets stated for <code>curr</code> — a call must leave the shared state as it
          found it — with a swap instead of a pop. The output comes out in a different order,
          which LeetCode accepts.
        </p>
      `,
    },
  ],

  comparison: {
    kicker: 'Two renderings',
    heading: 'Same n! answers, two shapes',
    columns: ['Version', 'State', 'Un-choose', 'Space', 'When you would write it'],
    rows: [
      ['Backtracking (loop from 0 + used)', 'curr and a used array', 'pop, and clear the flag', 'O(n) stack + n flags',
        'Always, in an interview. It is the form that becomes Permutations II by adding one sort-and-skip line.'],
      ['Swap in place', 'the array itself', 'swap back', 'O(n) stack',
        'When you want no extra memory, or the interviewer asks for it. Harder to extend to duplicates.'],
    ],
    footnote: `
      Both are O(n · n!): n! permutations, each copied at cost n. Say the factorial first, then say
      the copy — quoting O(n!) alone is the same small miss as forgetting the copy on Subsets.
    `,
  },

  traps: {
    kicker: 'Failure modes',
    heading: 'Four ways this runs and still returns nonsense',
    items: [
      {
        title: 'Starting the loop at <code>index</code> like Subsets',
        body: 'Then a number can never come after one that is later in the array, and you get <code>[1,2,3]</code> alone instead of six orderings. The loop must start at <code>0</code>; the <code>used</code> array does the job <code>index</code> used to do.',
      },
      {
        title: 'Forgetting to clear <code>used[i]</code> on the way back',
        body: 'The pop happens but the flag stays set, so the number is unavailable to every later branch and most permutations never appear. The un-choose is two statements here, not one.',
      },
      {
        title: 'Recording on arrival',
        body: 'That is Subsets\' Q1, not this one. Recording before the check fills the result with partial orderings like <code>[1]</code> and <code>[1,2]</code>.',
      },
      {
        title: 'Appending <code>curr</code> (or <code>nums</code>) instead of a copy',
        body: 'Every frame shares one list. Store it without copying and every result is the same list — empty at the end of the first tab, the original order at the end of the second.',
      },
    ],
  },

  next: {
    kicker: 'What it unlocks',
    heading: 'The same skeleton, one edit each',
    intro: 'Permutations is Subsets with the loop restarted and the record moved. Each of these changes exactly one more thing:',
    items: [
      { num: 47, title: 'Permutations II', note: 'Duplicates in the input. Sort, and skip a number equal to its neighbour when that neighbour is unused — the Subsets II comparison, with the used array in the guard.' },
      { num: 78, title: 'Subsets', note: 'Where this came from. If the loop-from-0 felt odd, the tree there shows why Subsets could start later.' },
      { num: 39, title: 'Combination Sum', note: 'Order does not matter but reuse is allowed: the loop stays at start and the recursive index stays put.' },
      { num: 31, title: 'Next Permutation', note: 'Not backtracking at all: the one permutation after this one, in place and in O(n). Worth knowing the contrast.' },
    ],
  },

  interview: {
    kicker: 'In the room',
    heading: 'The order to say things in',
    html: `
      <p>
        Say what changed from Subsets before you write anything: "order matters, so every
        unused number is a choice at every step — I will loop from zero with a used array —
        and an answer is complete only when all n numbers are placed." That names both edits
        and shows you know why they are there.
      </p>
      <p>
        Write the used form; it is the one that extends. Give the complexity as
        <code>O(n · n!)</code> and say where each factor comes from. If asked for less memory,
        describe the swap form: the array is the state, and the un-choose is a swap back.
        If the follow-up is duplicates, you are being asked for Permutations II, and the
        answer is the Subsets II comparison with one extra condition.
      </p>
    `,
  },
};

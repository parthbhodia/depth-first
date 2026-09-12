import { approaches, approachById } from './algorithms.js';

/** Same cap as Subsets: past four elements the picture stops being a picture. */
const MAX_N = 4;

const parse = (text) => {
  const nums = String(text)
    .split(/[^\d-]+/)
    .filter((s) => s.length)
    .map((s) => parseInt(s, 10))
    .filter((v) => Number.isFinite(v))
    .slice(0, MAX_N);
  return (nums.length ? nums : [1, 2, 2]).sort((a, b) => a - b);
};

/** Ground truth: the powerset, deduplicated. */
const canonical = (list) => [...new Set(list.map((s) => s.slice().sort((a, b) => a - b).join(',')))].sort().join(' | ');
const powerset = (nums) => {
  const out = [];
  for (let mask = 0; mask < (1 << nums.length); mask++) {
    const s = [];
    for (let i = 0; i < nums.length; i++) if ((mask >> i) & 1) s.push(nums[i]);
    out.push(s);
  }
  return out;
};
const unique = (nums) => new Set(powerset(nums).map((s) => s.join(','))).size;

export default {
  slug: 'subsets-ii',
  number: 90,
  title: 'Subsets II',
  difficulty: 'Medium',
  topics: ['Backtracking', 'Array', 'Sorting'],
  pattern: 'Backtracking — pruning duplicates by construction',

  stage: 'call-tree',
  inputLabel: 'nums',
  parseInput: parse,

  reference(nums) {
    return unique(nums);
  },
  verify(nums, built) {
    const got = built.subsets;
    if (!got) return 'build() returned no subsets to verify';
    const seen = new Set(got.map((s) => s.join(',')));
    if (seen.size !== got.length) return 'produced a duplicate subset';
    if (canonical(got) !== canonical(powerset(nums))) return 'subsets do not match the deduplicated powerset';
    return null;
  },
  checkInputs: ['1,2,2', '4,4,4,1', '0', '1,2,3', '2,2,2,2', '1,1,2,2'],

  callLayout: { nodeW: 84, xGap: 96 },

  video: {
    // Same channel as the Subsets and Combination Sum pages; title and author from a YouTube search.
    youtubeId: 'Izkce7hta5U',
    title: 'Subsets 2 (Leetcode 90) - Medium (Hindi) | Facebook Interview Question',
    channel: 'The Hustling Engineer',
  },

  links: {
    leetcode: 'https://leetcode.com/problems/subsets-ii/',
    neetcode: 'https://neetcode.io/problems/subsets-ii',
  },

  prerequisites: [
    { title: 'Subsets', note: 'choose, explore, un-choose, and why the loop starts at index', slug: 'subsets' },
    { title: 'Sorting', note: 'sorting the input so equal values sit side by side' },
    { title: 'Lists', note: 'appending, popping, and copying a list' },
  ],

  blurb:
    'Subsets with duplicates in the input. One comparison, placed at exactly the right level of the tree, stops every duplicate before it is built.',

  lede:
    'The trap is that duplicates come from <em>siblings</em>, not from parents and children. Choosing a 2 after a 2 is <code>[2,2]</code> and it is fine; starting a second branch with a 2 next to a branch that already started with a 2 rebuilds everything. Sort, compare each choice with the one before it on the same level, and the tree simply never grows the repeat. The second tab builds the repeats and throws them away, so you can see what that costs.',

  statement: [
    'Given an integer array <code>nums</code> that may contain <strong>duplicates</strong>, return <em>all possible subsets (the power set)</em>.',
    'The solution set <strong>must not</strong> contain duplicate subsets. Return the solution in <strong>any order</strong>.',
  ],

  examples: [
    { input: 'nums = [1,2,2]', output: '[[],[1],[1,2],[1,2,2],[2],[2,2]]' },
    { input: 'nums = [0]', output: '[[],[0]]' },
  ],

  constraints: [
    '1 <= nums.length <= 10',
    '-10 <= nums[i] <= 10',
  ],

  defaultInput: '1,2,2',
  presets: [
    { name: '[1,2,2]', arr: '1,2,2' },
    { name: '[1,1,2,2]', arr: '1,1,2,2' },
    { name: '[4,4,4,1]', arr: '4,4,4,1' },
    { name: '[1,2,3] (no dups)', arr: '1,2,3' },
  ],

  badgeLabels: { loop: 'Subsets below', set: 'Subsets below' },

  tour: [
    { focus: 'tabs', approach: 'loop',
      text: 'Two tabs, one answer. The first never builds a duplicate; the second builds them all and throws the repeats away. Same result, different trees.' },
    { focus: 'code', approach: 'loop',
      text: 'Subsets, plus one line: if i > index and nums[i] == nums[i - 1], skip. Read the guard carefully — i > index, not i > 0. That is the difference between skipping a sibling and skipping a child.' },
    { focus: 'stage', approach: 'loop', play: true,
      text: 'Play it. Six subsets, six nodes. There is no node for the [2] that the second 2 would have started, because that branch is refused before it exists.' },
    { focus: 'stack', approach: 'loop', at: { anchor: 'skip' },
      text: 'The skip. This frame is on i = 2, the second 2. Its sibling branch on i = 1 already built everything that starts with a 2, so this one is not started.' },
    { focus: 'stage', approach: 'set', play: true,
      text: 'Now build everything and dedupe. Eight nodes for six subsets, and the ×2 marks are the repeats. Each of them was a whole branch of work before the set said no.' },
    { focus: null, approach: 'loop', at: 'last',
      text: 'Write the first tab. It is Subsets with one comparison, and the same comparison is the whole of Combination Sum II and Permutations II.' },
  ],

  approaches,
  approachById,

  essay: [
    {
      kicker: 'The shape',
      figure: { approach: 'loop', at: 'last', caption: 'Six subsets, six nodes. The branch the second 2 would have started is never created.' },
      heading: 'Skip the sibling, keep the child',
      html: `
        <p>
          Sort first, so that equal values are neighbours. Then, inside the loop, one
          comparison: if this value equals the previous one <em>and</em> the previous one was
          also a choice at this level — <code>i > index</code> — skip it. A sibling branch
          starting with the same value would generate exactly the subsets this branch would,
          so it is refused before it exists.
        </p>
        <p>
          The guard is the subtle part. <code>i > index</code> compares a choice with the
          previous choice <em>on the same level</em>. At <code>index = 1</code>, the first 2 is
          allowed (there is no earlier sibling); at <code>index = 2</code>, inside the branch
          that already chose that 2, the second 2 is <code>i == index</code> — its first choice
          — and so it is taken, which is how <code>[2,2]</code> gets built. Write
          <code>i > 0</code> instead and <code>[2,2]</code> disappears.
        </p>
        <p>
          Everything else is Subsets unchanged: record on arrival, loop from
          <code>index</code>, choose, recurse with <code>i + 1</code>, pop.
        </p>
      `,
    },
    {
      kicker: 'What the set costs',
      figure: { approach: 'set', at: 'last', caption: 'The same six subsets from eight nodes. Every ×2 is a branch built and then discarded.' },
      heading: 'Correct, and twice the work',
      html: `
        <p>
          The second tab is the fix most people reach for: generate every subset as if there
          were no duplicates, keep a set of what has been recorded, and drop repeats on arrival.
          With the input sorted, equal subsets are built in the same order and compare equal,
          so it is correct.
        </p>
        <p>
          Watch the "dropped" count in the State panel and the ×2 marks on the tree. A set can
          only reject a subset once it has been built; it cannot stop the branch that builds
          it. On <code>[1,2,2]</code> that is two wasted nodes out of eight; on
          <code>[2,2,2,2]</code> it is eleven out of sixteen. The comparison on the first tab
          costs nothing and prevents all of them.
        </p>
      `,
    },
  ],

  comparison: {
    kicker: 'Two renderings',
    heading: 'Same subsets, two trees',
    columns: ['Version', 'Tree on [1,2,2]', 'Duplicates', 'Extra space', 'When you would write it'],
    rows: [
      ['Backtracking (sort + skip)', '6 nodes', 'Never built', 'O(n) stack',
        'Always. The comparison is one line and it generalises to Combination Sum II and Permutations II.'],
      ['Build all, dedupe with a set', '8 nodes, 2 discarded', 'Built, then dropped', 'O(n · 2ⁿ) for the set',
        'As a first draft under pressure — then say what it wastes and replace it.'],
    ],
    footnote: `
      Both are O(n · 2ⁿ) in the worst case (no duplicates at all). The difference shows the moment
      the input repeats: the skip removes the duplicate branches, the set only removes their output.
    `,
  },

  traps: {
    kicker: 'Failure modes',
    heading: 'Four ways this runs and still returns nonsense',
    items: [
      {
        title: 'Forgetting to sort',
        body: 'The comparison <code>nums[i] == nums[i - 1]</code> only sees duplicates that are neighbours. On <code>[2,1,2]</code> the two 2s are apart, nothing is skipped, and <code>[2]</code> appears twice.',
      },
      {
        title: 'Guarding with <code>i > 0</code> instead of <code>i > index</code>',
        body: 'That skips the second 2 everywhere, including as the child of the first 2 — so <code>[2,2]</code> and <code>[1,2,2]</code> vanish. The skip must apply to siblings only.',
      },
      {
        title: 'Deduplicating with a set without sorting',
        body: 'On unsorted input the same subset can be built as <code>[2,1]</code> and <code>[1,2]</code>, which look different to the set. Sort first, or the set keeps both.',
      },
      {
        title: 'Appending <code>curr</code> instead of a copy',
        body: 'Every frame shares one list. Store <code>curr</code> itself and every entry in the result is the same empty list by the end. Same trap as Subsets, same fix.',
      },
    ],
  },

  next: {
    kicker: 'What it unlocks',
    heading: 'The same comparison, elsewhere',
    intro: 'The sort-then-skip-siblings trick is the entire difference between three pairs of problems:',
    items: [
      { num: 40, title: 'Combination Sum II', note: 'Combination Sum where each candidate may be used once and the input has duplicates. Recurse with i + 1, and skip equal siblings exactly as here.' },
      { num: 47, title: 'Permutations II', note: 'Permutations with duplicates. The same skip, plus a used array so the skip only fires when the equal neighbour was not taken on this path.' },
      { num: 78, title: 'Subsets', note: 'Where the loop-from-index form comes from. If the skip felt like magic, the tree there shows why the loop starts at index at all.' },
      { num: 39, title: 'Combination Sum', note: 'Reuse instead of duplicates: the other way the loop\'s recursive index changes.' },
    ],
  },

  interview: {
    kicker: 'In the room',
    heading: 'The order to say things in',
    html: `
      <p>
        Say where duplicates come from before you write anything: "two sibling branches that
        start with the same value build the same subsets — so I will sort, and skip a value
        equal to the previous choice on the same level." That sentence shows you understand
        the tree, not just the trick.
      </p>
      <p>
        Then write Subsets, add the one comparison, and point at the guard:
        "<code>i > index</code>, not <code>i > 0</code>, because the same value is still
        allowed as a child — that is how <code>[2,2]</code> is built." If you are asked why
        not a set, say what it wastes: the branch is explored and only its output is dropped.
      </p>
    `,
  },
};

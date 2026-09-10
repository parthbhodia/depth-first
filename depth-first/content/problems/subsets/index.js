import { approaches, approachById } from './algorithms.js';

/**
 * n is capped hard on purpose. The tree has 2^n nodes and the include/exclude
 * tree has 2^(n+1) - 1; past four elements the picture stops being a picture.
 */
const MAX_N = 4;

const parse = (text) => {
  const nums = String(text)
    .split(/[^\d-]+/)
    .filter((s) => s.length)
    .map((s) => parseInt(s, 10))
    .filter((v) => Number.isFinite(v))
    .slice(0, MAX_N);
  return nums.length ? nums : [1, 2, 3];
};

/** Ground truth: the powerset, canonicalised so any generation order matches. */
const canonical = (list) =>
  list
    .map((s) => s.join(','))
    .sort()
    .join(' | ');

const powerset = (nums) => {
  const out = [];
  for (let mask = 0; mask < (1 << nums.length); mask++) {
    const s = [];
    for (let i = 0; i < nums.length; i++) if ((mask >> i) & 1) s.push(nums[i]);
    out.push(s);
  }
  return out;
};

export default {
  slug: 'subsets',
  number: 78,
  title: 'Subsets',
  difficulty: 'Medium',
  topics: ['Backtracking', 'Recursion', 'Bit Manipulation', 'Array'],
  pattern: 'Backtracking — choose / explore / un-choose',

  stage: 'call-tree',
  inputLabel: 'nums',
  parseInput: parse,

  /**
   * The displayed answer is the COUNT, because 2^n is the thing worth reading
   * off the panel. The subsets themselves are checked by verify() below —
   * a count alone would pass on a solution that generated the wrong sets.
   */
  reference(nums) {
    return 1 << nums.length;
  },
  verify(nums, built) {
    const got = built.subsets;
    if (!got) return 'build() returned no subsets to verify';
    const seen = new Set(got.map((s) => s.join(',')));
    if (seen.size !== got.length) return 'produced a duplicate subset';
    if (canonical(got) !== canonical(powerset(nums))) return 'subsets do not match the powerset';
    return null;
  },
  checkInputs: ['1', '1,2', '1,2,3', '1,2,3,4', '5,9', '3,1,2'],

  /** Path labels are wider than climb(k), so the nodes need more room. */
  callLayout: { nodeW: 84, xGap: 96 },

  video: {
    // Verified via YouTube oEmbed: author_name "NeetCode".
    youtubeId: 'REOH22Xwdkk',
    title: 'Subsets - Backtracking - Leetcode 78',
    channel: 'NeetCode',
  },

  links: {
    leetcode: 'https://leetcode.com/problems/subsets/',
    neetcode: 'https://neetcode.io/problems/subsets',
  },

  blurb:
    'The cleanest place to watch choose / explore / un-choose, and the one problem where the recursion tree literally is the answer.',

  lede:
    'Most recursion explainers stop at an analogy. This one shows the actual call stack: every frame with its own <code>index</code> and <code>i</code>, one shared <code>curr</code> that grows and un-grows, and <code>res</code> filling as you watch. The gap people describe as <em>"I understand recursion but I can\'t use it"</em> lives exactly here.',

  statement: [
    'Given an integer array <code>nums</code> of <strong>unique</strong> elements, return <em>all possible subsets (the power set)</em>.',
    'The solution set <strong>must not</strong> contain duplicate subsets. Return the solution in any order.',
  ],

  examples: [
    { input: 'nums = [1,2,3]', output: '[[],[1],[1,2],[1,2,3],[1,3],[2],[2,3],[3]]' },
    { input: 'nums = [0]', output: '[[],[0]]' },
  ],

  constraints: [
    '1 <= nums.length <= 10',
    '-10 <= nums[i] <= 10',
    'All the numbers of nums are unique.',
  ],

  defaultInput: '1,2,3',
  presets: [
    { name: '[1,2]', arr: '1,2' },
    { name: '[1,2,3]', arr: '1,2,3' },
    { name: '[1,2,3,4] (wide!)', arr: '1,2,3,4' },
    { name: '[5,9]', arr: '5,9' },
    { name: 'single [7]', arr: '7' },
  ],

  badgeLabels: { loop: 'Subsets below', binary: 'Subsets below', bitmask: 'Value' },

  tour: [
    { focus: 'tabs', approach: 'loop',
      text: 'Three tabs, one answer. The first is the form you should write in an interview; the other two exist to explain why it works and what it costs.' },
    { focus: 'code', approach: 'loop',
      text: 'Three lines carry everything: append, recurse, pop. Choose, explore, un-choose. Every backtracking solution you will ever write has this shape.' },
    { focus: 'stage', approach: 'loop', play: true,
      text: 'Play it. Watch res in the strip under the tree — it gains an entry at every single node, not just at the bottom.' },
    { focus: 'stack', approach: 'loop', at: { anchor: 'record' },
      text: 'Now the stack. Each frame owns an index and an i. Read the i column top to bottom and you get the current path — curr is really just a copy of that column.' },
    { focus: 'stack', approach: 'loop', at: 'last',
      text: 'The stack never held more than n + 1 frames, even though the tree has 2 to the n nodes. That gap is the difference between time cost and space cost.' },
    { focus: 'stage', approach: 'binary', play: true,
      text: 'Same answers, framed as a yes/no per element. Answers now appear only at the leaves — and the bottom row is 2 to the n wide, so the complexity is something you can count rather than derive.' },
    { focus: 'stage', approach: 'bitmask', play: true,
      text: 'Drop the recursion entirely. Every subset is an n-bit number, so counting to 2 to the n minus 1 and reading the bits gives the same set with no stack at all.' },
    { focus: null, approach: 'loop', at: 'last',
      text: 'Go back to the first tab for anything real, though. The bitmask cannot prune, and pruning is the whole point the moment a problem adds a constraint.' },
  ],

  approaches,
  approachById,

  essay: [
    {
      kicker: 'The shape',
      figure: { approach: 'loop', at: 'last', caption: 'Every node is an answer. Eight nodes, eight subsets — the tree is not a diagram of the work, it is the output.' },
      heading: 'Choose, explore, un-choose',
      html: `
        <p>
          Three lines do the work. <code>curr.append(nums[i])</code> is the choice,
          the recursive call is the exploration, and <code>curr.pop()</code> takes the
          choice back. That last line is the one people leave out, and it is the one
          that makes the whole thing legal: <strong>a call must leave <code>curr</code>
          exactly as it found it.</strong>
        </p>
        <p>
          Why does that matter so much? Because <code>curr</code> is not copied per
          frame. Every frame on the stack holds a reference to the same list. Watch the
          State panel while you step: a push in a frame four levels deep is immediately
          visible to the root frame, because there is only one list. That is efficient —
          no allocation per branch — but it means the un-choose is not optional
          bookkeeping, it is the mechanism.
        </p>
        <p>
          The corollary is <code>res.append(list(curr))</code>. The copy is mandatory for
          the same reason: store <code>curr</code> itself and you store eight references
          to one list that ends up empty. Forgetting the copy and forgetting the pop are
          the two ways this solution fails while still compiling and running.
        </p>
      `,
    },
    {
      kicker: 'What the stack is actually holding',
      figure: { approach: 'loop', at: { anchor: 'record' }, caption: 'Each frame owns its index and its i. Read the i column downward and you have the path — which is what curr is a copy of.' },
      heading: 'Two locals, and one of them never moves',
      html: `
        <p>
          Open the call stack panel and step. Every frame carries exactly two locals.
          <code>index</code> is set once by the caller and never reassigned for the life
          of that frame. <code>i</code> is created by the <code>for</code> statement,
          advances, and — this is the part worth seeing rather than being told —
          <strong>freezes</strong> while the recursive call runs.
        </p>
        <p>
          Every frame below the top is parked on the same line, mid-loop, holding an
          <code>i</code> it will resume with. When a call returns, the frame beneath it
          picks up on the next line with that <code>i</code> intact. You never write that
          bookkeeping; the stack is the bookkeeping. This is also why the depth of the
          stack equals the length of the current path rather than the number of elements:
          at <code>[1,3]</code> there are three frames, not four.
        </p>
        <p>
          <code>index</code> is doing something subtler. Passing <code>i + 1</code> down
          means a call may only ever look rightwards of the element the caller just took,
          so elements are always picked in index order and <code>[3,1]</code> is never
          generated as a rearrangement of <code>[1,3]</code>. Change that one argument to
          a loop from zero plus a <code>used</code> set and you have Permutations. One
          parameter separates the two problems.
        </p>
      `,
    },
    {
      kicker: 'Where the 2ⁿ comes from',
      figure: { approach: 'binary', at: 'last', caption: 'The same eight answers as a perfect binary tree. One leaf per subset — count the bottom row and the complexity is done.' },
      heading: 'Two ways to draw the same count',
      html: `
        <p>
          Switch to the include/exclude tab. Same answers, but the picture changes
          completely: instead of a loop over what remains, each call decides one element —
          in, or out — and the tree becomes strictly binary with depth <code>n</code>.
          Answers appear only at the leaves, and there are exactly <code>2ⁿ</code> of them.
          You do not derive the complexity, you count the bottom row.
        </p>
        <p>
          Watch what happens on the exclude branch: the child node carries the
          <em>same</em> path as its parent, because not taking an element does not change
          <code>curr</code>. That looks strange on screen and it is exactly right — it is
          the visual difference between "which element do I take next" and "is this
          element in".
        </p>
        <p>
          The bitmask tab is that same tree with the recursion thrown away. Bit
          <code>i</code> of the mask is the in-or-out decision for <code>nums[i]</code>,
          so counting from <code>0</code> to <code>2ⁿ − 1</code> enumerates every
          combination of decisions. It is a genuinely nice thing to mention in an
          interview after you have written the recursion — but say why you would not
          reach for it by default: there is nowhere to prune. Add any constraint worth
          pruning on and the tree comes straight back.
        </p>
        <p>
          Worth knowing if you learned this elsewhere: the standard NeetCode walkthrough
          below teaches the <em>include/exclude</em> shape, so it lines up with the second
          tab rather than the first. Both are correct and both are common. The loop form
          is the one to have in muscle memory, because Subsets II, Combination Sum and
          Combinations are all edits to it.
        </p>
      `,
    },
  ],

  comparison: {
    kicker: 'Three renderings',
    heading: 'Same 2ⁿ answers, three shapes',
    columns: ['Version', 'Tree shape', 'Where answers appear', 'Space', 'When you would write it'],
    rows: [
      ['Backtracking (loop + index)', '2ⁿ nodes, variable branching', 'Every node', 'O(n) stack',
        'Always, in an interview. It is the form that extends to Subsets II, Combination Sum and Permutations.'],
      ['Include / exclude', '2ⁿ⁺¹ − 1 nodes, strictly binary', 'Leaves only', 'O(n) stack',
        'As an explanation, mostly. Reach for it when the per-element decision genuinely is binary and there is nothing to loop over.'],
      ['Bitmask', 'No tree', 'One per integer', 'O(1)',
        'Pure subsets of a small array, or when you need subsets as integers anyway (DP over bitmasks). Never when you need to prune.'],
    ],
    footnote: `
      All three are O(n · 2ⁿ) time: there are 2ⁿ subsets and copying each one costs O(n).
      Quoting O(2ⁿ) and forgetting the copy is a small but common miss — and interviewers do ask.
    `,
  },

  traps: {
    kicker: 'Failure modes',
    heading: 'Four ways this runs and still returns nonsense',
    items: [
      {
        title: 'Appending <code>curr</code> instead of a copy of it',
        body: 'Every frame shares one list. <code>res.append(curr)</code> stores 2ⁿ references to that one list, which is empty by the time you return — so you get the right number of subsets and every one of them is <code>[]</code>. Always <code>list(curr)</code>, <code>[...curr]</code>, or <code>new ArrayList<>(curr)</code>.',
      },
      {
        title: 'Forgetting the <code>pop()</code>',
        body: 'Without the un-choose, <code>curr</code> only ever grows, and every subset after the first is polluted by the branch before it. Nothing crashes. The output is just quietly wrong, which is worse.',
      },
      {
        title: 'Looping from <code>0</code> instead of from <code>index</code>',
        body: 'This turns Subsets into a broken Permutations: you get <code>[1,2]</code> and <code>[2,1]</code> as separate answers, plus <code>[1,1]</code> unless you also track what is used. The <code>index</code> parameter is the entire duplicate-prevention mechanism.',
      },
      {
        title: 'Putting the <code>res.append</code> inside the loop',
        body: 'A natural-looking slip that silently drops the empty subset and double-counts others. The record belongs at the top of the function, before any choice is made — that placement is what makes every node an answer.',
      },
    ],
  },

  next: {
    kicker: 'What it unlocks',
    heading: 'The backtracking family, in order',
    intro:
      'Subsets is the smallest complete instance of choose / explore / un-choose. Each of these changes exactly one thing about it:',
    items: [
      { num: 90, title: 'Subsets II', note: 'Sort, then refuse to start two sibling branches with the same value. One extra line, and the clearest lesson in pruning by construction rather than de-duplicating afterwards.' },
      { num: 46, title: 'Permutations', note: 'Drop the index, loop from 0, track what is used. Order now matters, so answers live only at the leaves.' },
      { num: 39, title: 'Combination Sum', note: 'Same loop, but recurse on i rather than i + 1 so a value can repeat, and prune when the running sum overshoots. The first real pruning condition.' },
      { num: 77, title: 'Combinations', note: 'Subsets with a fixed size k. Adds the one-line pruning that stops branches too short to ever reach k.' },
      { num: 22, title: 'Generate Parentheses', note: 'The choices are no longer array elements but characters, and the constraint lives in the state rather than the input.' },
      { num: 79, title: 'Word Search', note: 'Backtracking on a grid, where the un-choose is un-marking a visited cell. Same spine, very different picture.' },
    ],
  },

  interview: {
    kicker: 'In the room',
    heading: 'The order to say things in',
    html: `
      <p>
        Say the shape before you write anything: "this is backtracking — I will keep one
        running path, and at each step choose an element, recurse, then undo the choice."
        Then note that every node is an answer, not just the leaves, because a subset of
        any length is valid. That single sentence decides where the <code>append</code>
        goes, and getting it right up front reads very differently from discovering it
        by debugging.
      </p>
      <p>
        Write it, then say the complexity with the copy included: <code>O(n · 2ⁿ)</code>
        time, <code>O(n)</code> space beyond the output. Volunteering that the space is
        linear while the time is exponential shows you know the stack depth is the path
        length, which is the detail most candidates skip.
      </p>
      <p>
        Mention the bitmask version briefly — and immediately say why you did not write
        it: no pruning. That framing turns a party trick into evidence that you pick
        techniques on their properties. If the follow-up is duplicates in the input, you
        are being asked for Subsets II, and the answer is one sorted array plus one
        <code>continue</code>.
      </p>
    `,
  },
};

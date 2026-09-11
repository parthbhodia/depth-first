import { approaches, approachById } from './algorithms.js';
import warmup from './warmup.js';

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
      text: 'Three tabs, one answer. The first is the form to write in an interview; the second draws the same answers with a yes/no per number; the third shows what is left when you drop the recursion.' },
    { focus: 'code', approach: 'loop',
      text: 'Read the two comments first. Q1: is the answer complete? Here, always — every path is a subset, so record on arrival. Q2: what choices do I have? Everything to the right of index. The rest of the function is a pop.' },
    { focus: 'stage', approach: 'loop', play: true,
      text: 'Play it. Watch res in the strip under the tree — it gains an entry at every single node, not just at the bottom. No length check anywhere.' },
    { focus: 'stack', approach: 'loop', at: { anchor: 'unchoose' },
      text: 'The pop. curr loses its last number, and the same frame moves on to the next choice with i intact. That single line is what lets one shared list explore every path.' },
    { focus: 'stack', approach: 'loop', at: { anchor: 'record' },
      text: 'Each frame owns an index and an i. Read the i column top to bottom and you get the current path — curr is really just a copy of that column.' },
    { focus: 'stage', approach: 'binary', play: true,
      text: 'Same answers, framed as a yes/no per number. Answers now appear only at the leaves — which is why this form needs the "every number decided?" check — and the bottom row is 2 to the n wide.' },
    { focus: 'stage', approach: 'bitmask', play: true,
      text: 'Drop the recursion entirely. Every subset is an n-bit number, so counting to 2 to the n minus 1 and reading the bits gives the same set with no stack at all.' },
    { focus: null, approach: 'loop', at: 'last',
      text: 'Write the first tab in an interview. It becomes Subsets II, Combination Sum and Permutations by changing a line — and it is the one that can prune.' },
  ],

  /**
   * Read before the instrument, one slide at a time. The warm-up is
   * AlgoMonster's: every string of A and B — a tree small enough to draw by
   * hand and real enough to trace. Then Subsets, as the same two questions
   * with different answers. Short sentences: each step is one thought.
   */
  lesson: {
    kicker: 'Backtracking, from zero',
    heading: 'It is not a new algorithm. It is DFS on a tree you build as you go.',
    credit: 'Sequence and warm-up after <a href="https://www.youtube.com/watch?v=Ak-fxEwAR14" target="_blank" rel="noopener">AlgoMonster\'s backtracking tutorial</a>; every picture is a real trace.',
    warmup,
    finish: { approach: 'loop', play: true, label: 'Play the Subsets trace' },
    steps: [
      {
        title: 'A problem loops cannot solve',
        html: `
          <p>Warm-up: given <code>n</code>, list every string of length <code>n</code> made of A
          and B. For <code>n = 2</code>, two loops. For <code>n = 10</code>, ten. You cannot write
          a new program for every <code>n</code>.</p>
          <p>The depth of the looping has to follow the input. That is what recursion is for.</p>`,
        snippet: {
          lang: 'python',
          source: `# n = 2: two loops, one per position
for first in ["A", "B"]:
    for second in ["A", "B"]:
        print(first + second)   # AA AB BA BB

# n = 10? Ten nested loops. And n is not
# known until the input arrives.`,
        },
      },
      {
        title: 'Draw the tree',
        html: `
          <p>Start empty. Two choices: add A, or add B. From <code>A</code>, the same two
          choices again. A tree appears — and the four answers are its leaves.</p>
          <p>So the question is not "how do I generate the strings?" It is "how do I visit
          every leaf of this tree?"</p>`,
        figure: { problem: 'warmup', approach: 'dfs', at: 'last',
          caption: 'Empty, then A or B, then A or B again. AA, AB, BA, BB are the leaves.' },
      },
      {
        title: 'It is just DFS',
        html: `
          <p>Visiting every node of a tree is depth-first search — the recursion you already
          know from Maximum Depth. The twist: this tree is not given. It does not exist until you
          build it, one choice at a time.</p>
          <p>Press <b>Grow</b>. Each node appears the moment the DFS reaches it.</p>`,
        grow: { problem: 'warmup', approach: 'dfs' },
      },
      {
        title: 'What pop() actually does',
        html: `
          <p>The path is AA — recorded. The next answer is AB, but the path still holds that
          second A. There is one path, shared by every frame. The only way to try the other
          branch is to take the last choice back.</p>
          <p>That is <code>pop()</code>. Not tidy-up: the mechanism. Step through it and watch
          <code>path</code> next to the stack.</p>`,
        instrument: { problem: 'warmup' },
        jumps: [
          { target: 'warmup', approach: 'dfs', at: { anchor: 'record' }, label: 'Step 11: record AA' },
          { target: 'warmup', approach: 'dfs', at: { anchor: 'unchoose' }, label: 'Step 13: pop, back to A' },
          { target: 'warmup', approach: 'dfs', at: 14, label: 'Step 15: choose B — AB' },
        ],
      },
      {
        title: 'Two questions before any code',
        html: `
          <p>Answer these two before writing anything. The first decides where the record goes.
          The second decides what the loop is over. That is the whole design.</p>`,
        questions: [
          { q: 'When do I have a complete answer?',
            a: 'When the path has length <code>n</code>. Stop, record it, return.' },
          { q: 'What choices can I make from here?',
            a: 'Add A, or add B — the same two from every node.' },
        ],
      },
      {
        title: 'Three parts of the code',
        html: `
          <p>Check if done. Loop through the choices. Pop after each one.</p>
          <p>The pop runs after every recursive call and puts you back exactly where you were
          before that choice. The two comments are Q1 and Q2; the code is their answers.</p>`,
        problem: 'warmup',
        approach: 'dfs',
        lang: 'python',
        parts: [
          { label: 'Check if done', note: 'Q1 — record, then return', anchors: ['base', 'record'] },
          { label: 'Loop through the choices', note: 'Q2 — choose, go deeper', anchors: ['loop', 'choose', 'recurse'] },
          { label: 'Pop after each one', note: 'the backtracking — back to before the choice', anchors: ['unchoose'] },
        ],
      },
      {
        title: 'Watch it run',
        html: `
          <p>The whole run for <code>n = 2</code>, with the call stack beside the tree. Press play,
          or step with the arrows. Every pop puts you back exactly one step.</p>`,
        instrument: { problem: 'warmup' },
        jumps: [
          { target: 'warmup', approach: 'dfs', play: true, label: 'Play the warm-up' },
        ],
      },
      {
        title: 'Now Subsets: the same two questions',
        html: `
          <p>Subsets is the warm-up with different answers — and simpler in one way. In the
          warm-up only full-length strings count, so Q1 needed a length check. In Subsets
          <em>every</em> path is a valid subset, so Q1 is "always": record on arrival, no check,
          no stop.</p>
          <p>Tab 1 below is that form. Its comments are the same Q1 and Q2.</p>`,
        questions: [
          { q: 'When do I have a complete answer?',
            a: 'Always. Every path is a subset, so record it on arrival. When <code>index</code> reaches the end, the loop simply has nothing left.' },
          { q: 'What choices can I make from here?',
            a: 'Everything to the right of the last number taken: <code>nums[index]</code>, <code>nums[index + 1]</code>, … so no subset is made twice.' },
        ],
      },
      {
        title: 'The same three parts, for Subsets',
        html: `
          <p>"Check if done" became "record on arrival" — there is nothing to check. The loop
          runs over what is left of the array instead of two letters. The pop is exactly the
          same.</p>
          <p>Every backtracking solution you will write has this shape. Only the two answers
          change.</p>`,
        approach: 'loop',
        lang: 'python',
        parts: [
          { label: 'Record on arrival', note: 'Q1 — every path is complete, nothing to check', anchors: ['record'] },
          { label: 'Loop through the choices', note: 'Q2 — everything to the right of index; choose, go deeper', anchors: ['loop', 'choose', 'recurse'] },
          { label: 'Pop after each one', note: 'the backtracking — back to before the choice', anchors: ['unchoose'] },
        ],
      },
      {
        title: 'Watch it run, then spot it everywhere',
        html: `
          <p>Play tab 1 and read the stack beside the tree: each frame owns its own
          <code>i</code>, <code>curr</code> is one list every frame can see, and <code>res</code>
          gains an entry at every node.</p>
          <p>The tell: "generate all…", "return every…", "all combinations…". Draw the tree,
          answer the two questions, write the three parts. Subsets II changes one line of Q2;
          Permutations records at the leaves; Combination Sum adds a reason to stop early.</p>`,
        jumps: [
          { approach: 'loop', play: true, label: 'Play the trace' },
          { approach: 'loop', at: { anchor: 'unchoose' }, label: 'Step 17: the pop' },
          { approach: 'loop', at: 19, label: 'Step 20: pop the 2, then choose 3' },
        ],
      },
    ],
  },

  approaches,
  approachById,

  essay: [
    {
      kicker: 'The shape',
      figure: { approach: 'loop', at: 'last', caption: 'Every node is an answer. Eight nodes, eight subsets — the tree is not a diagram of the work, it is the output.' },
      heading: 'Choose, explore, un-choose',
      html: `
        <p>
          The two comments in the code are the whole design. <em>Q1 — complete answer?</em>
          Always: every path is a valid subset, so the record sits at the top of the function
          and there is no check and no stop. <em>Q2 — what choices do I have?</em> Everything
          to the right of <code>index</code>.
          Three lines do the work — <code>curr.append(nums[i])</code> is the choice, the
          recursive call is the exploration, and <code>curr.pop()</code> takes the choice back.
          <strong>A call must leave <code>curr</code> exactly as it found it.</strong>
        </p>
        <p>
          Why does that matter so much? Because <code>curr</code> is not copied per frame.
          Every frame on the stack holds a reference to the same list. Watch the State panel
          while you step: a push in a frame four levels deep is immediately visible to the root
          frame, because there is only one list. That is efficient — no allocation per branch —
          but it means the un-choose is not optional bookkeeping, it is the mechanism.
        </p>
        <p>
          The corollary is <code>res.append(list(curr))</code>. The copy is mandatory for the
          same reason: store <code>curr</code> itself and you store eight references to one list
          that ends up empty. Forgetting the copy and forgetting the pop are the two ways this
          solution fails while still compiling and running.
        </p>
      `,
    },
    {
      kicker: 'What the stack is actually holding',
      figure: { approach: 'loop', at: { anchor: 'record' }, caption: 'Each frame owns its index and its i. Read the i column downward and you have the path — which is what curr is a copy of.' },
      heading: 'Two locals, and one of them never moves',
      html: `
        <p>
          Open the call stack panel and step. Every frame carries exactly two
          locals. <code>index</code> is set once by the caller and never reassigned for the life
          of that frame. <code>i</code> is created by the <code>for</code> statement, advances,
          and — this is the part worth seeing rather than being told — <strong>freezes</strong>
          while the recursive call runs.
        </p>
        <p>
          Every frame below the top is parked on the same line, mid-loop, holding an
          <code>i</code> it will resume with. When a call returns, the frame beneath it picks up
          on the next line with that <code>i</code> intact. You never write that bookkeeping;
          the stack is the bookkeeping. This is also why the depth of the stack equals the
          length of the current path rather than the number of elements: at <code>[1,3]</code>
          there are three frames, not four.
        </p>
        <p>
          <code>index</code> is doing something subtler. Passing <code>i + 1</code> down means a
          call may only ever look rightwards of the element the caller just took, so elements
          are always picked in index order and <code>[3,1]</code> is never generated as a
          rearrangement of <code>[1,3]</code>. Change that one argument to a loop from zero plus
          a <code>used</code> set and you have Permutations. One parameter separates the two
          problems.
        </p>
      `,
    },
    {
      kicker: 'The other picture',
      figure: { approach: 'binary', at: 'last', caption: 'Eight answers as a perfect binary tree. One leaf per subset — count the bottom row and the complexity is done.' },
      heading: 'One question per number: in, or out?',
      html: `
        <p>
          The second tab draws the same answers the way the warm-up did. Each call looks at one number and asks one question: is it in, or out? Two branches
          per level, one level per number, so the tree is strictly binary with depth
          <code>n</code>. Answers appear only at the leaves, and there are exactly
          <code>2ⁿ</code> of them. You do not derive the complexity — you count the bottom row.
        </p>
        <p>
          Because the answers live only at the leaves, this form needs the check the first tab
          does not: <em>Q1 — complete answer?</em> is <code>i == len(nums)</code>, every number
          decided. <em>Q2 — what choices do
          I have?</em> is two: take <code>nums[i]</code>, or skip it. Between the branches sits
          <code>curr.pop()</code>, and that line is not tidy-up — it is what lets a single
          shared list walk every path.
        </p>
        <p>
          Watch the skip branch: the child carries the <em>same</em> path as its parent, because
          leaving a number out changes nothing. That looks odd on screen and is exactly right —
          it is the difference between "which number do I take next" and "is this number in".
        </p>
      `,
    },
    {
      kicker: 'Where the bitmask fits',
      heading: 'The tree, flattened into an integer',
      html: `
        <p>
          The bitmask tab is the include/exclude tree with the recursion thrown away. Bit
          <code>i</code> of the mask is the in-or-out decision for <code>nums[i]</code>, so
          counting from <code>0</code> to <code>2ⁿ − 1</code> enumerates every combination of
          decisions. It is a genuinely nice thing to mention in an interview after you have
          written the recursion — but say why you would not reach for it by default: there is
          nowhere to prune. Add any constraint worth pruning on and the tree comes straight back.
        </p>
        <p>
          Worth knowing if you learned this elsewhere: the NeetCode walkthrough below teaches the
          include/exclude shape, so it lines up with the second tab. Both forms are correct and
          both are common. The loop form is the one to have in muscle memory, because Subsets II,
          Combination Sum and Combinations are all edits to it.
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
        'Always, in an interview. Every path is an answer, so there is no check; it is the form that extends to Subsets II, Combination Sum and Permutations.'],
      ['Include / exclude', '2ⁿ⁺¹ − 1 nodes, strictly binary', 'Leaves only', 'O(n) stack',
        'To understand it, and whenever the per-element decision genuinely is yes or no. Needs the "every number decided?" check because answers live only at the leaves.'],
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

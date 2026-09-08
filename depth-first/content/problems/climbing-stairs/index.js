import { approaches, approachById } from './algorithms.js';

/** n is small on purpose: the naive call tree is exponential and the point is to SEE that. */
const MIN_N = 1;
const MAX_N = 8;

export default {
  slug: 'climbing-stairs',
  number: 70,
  title: 'Climbing Stairs',
  difficulty: 'Easy',
  topics: ['Dynamic Programming', 'Recursion', 'Memoization', 'Math'],
  pattern: 'Dynamic programming — 1D',

  // How this problem is staged and what its input is.
  stage: 'call-tree',
  inputLabel: 'Steps (n)',
  parseInput(text) {
    const n = parseInt(String(text).replace(/[^\d-]/g, ''), 10);
    if (!Number.isFinite(n)) return 5;
    return Math.min(MAX_N, Math.max(MIN_N, n));
  },
  /** Ground truth for scripts/check.mjs. */
  reference(n) {
    let a = 1, b = 2;
    if (n <= 2) return n;
    for (let i = 3; i <= n; i++) { const c = a + b; a = b; b = c; }
    return b;
  },
  checkInputs: ['1', '2', '3', '4', '5', '6', '7', '8'],

  links: {
    leetcode: 'https://leetcode.com/problems/climbing-stairs/',
    neetcode: 'https://neetcode.io/problems/climbing-stairs',
  },

  blurb:
    'The cheapest possible introduction to dynamic programming — and the clearest place to watch a recursion tree collapse into a table.',

  lede:
    'The same recurrence, rendered three ways: an exponential call tree, the same tree pruned by a memo, and no tree at all. Watching the middle step is how the phrase <em>"the parameters that change between calls are your DP state"</em> stops being advice and starts being obvious.',

  statement: [
    'You are climbing a staircase. It takes <code>n</code> steps to reach the top.',
    'Each time you can climb either <strong>1</strong> or <strong>2</strong> steps. In how many distinct ways can you climb to the top?',
  ],

  examples: [
    { input: 'n = 2', output: '2' },
    { input: 'n = 3', output: '3' },
    { input: 'n = 5', output: '8' },
  ],

  constraints: ['1 <= n <= 45'],

  defaultInput: '5',
  presets: [
    { name: 'n = 3', arr: '3' },
    { name: 'n = 5', arr: '5' },
    { name: 'n = 6', arr: '6' },
    { name: 'n = 8 (wide!)', arr: '8' },
    { name: 'n = 2', arr: '2' },
    { name: 'n = 1', arr: '1' },
  ],

  badgeLabels: { naive: 'Return value', memo: 'Return value', table: 'Value' },

  approaches,
  approachById,

  essay: [
    {
      kicker: 'Finding the state',
      heading: 'Write the recursion first. The state falls out of it.',
      html: `
        <p>
          The most useful piece of DP advice on the internet is buried in a Reddit thread about
          getting good at dynamic programming, and it is this: <strong>write the recursive solution
          first, then look at which parameters change between calls.</strong> Those parameters are
          the dimensions of your table.
        </p>
        <p>
          Run the naive tab and read the call stack. Every frame is <code>climb(k)</code> — same
          function, one argument, and the only thing that differs from call to call is
          <code>k</code>. One varying parameter means one dimension, so the memo is keyed by
          <code>k</code> and the table is a flat array indexed by <code>k</code>. That is the entire
          derivation, and it works the same way when there are two varying parameters (you get a 2D
          table) or three.
        </p>
        <p>
          This is why "just do more problems" is such unsatisfying advice. The step people are
          missing is not practice, it is a mechanical procedure they were never given: recursion →
          identify what varies → that is the state → memo it → optionally flip it bottom-up.
        </p>
      `,
    },
    {
      kicker: 'Why the naive version is slow',
      heading: 'Nothing remembers anything',
      html: `
        <p>
          Play the naive trace on <b>n = 6</b> and watch the tree. <code>climb(4)</code> gets solved
          twice. <code>climb(3)</code> gets solved three times, from scratch, including everything
          underneath it. Each of those repeats has its own repeats. The tree does not grow with
          <code>n</code> — it doubles with <code>n</code>.
        </p>
        <p>
          The captions call out every repeat as it happens, and the duplicated nodes are outlined so
          you can see the same subtree appearing in different parts of the picture. At
          <code>n = 8</code> the tree is already too wide to fit on screen, which is the honest
          visual: 67 calls to answer 8 distinct questions.
        </p>
        <p>
          Nothing about the <em>logic</em> is wrong. The recursion is a faithful transcription of the
          problem statement and it returns the right answer. It is just doing the same work over and
          over because it has no memory, and that is a fixable property rather than a fundamental one.
        </p>
      `,
    },
    {
      kicker: 'The collapse',
      heading: 'One dictionary, and the tree becomes a spine',
      html: `
        <p>
          Switch to the memoised tab with the same <code>n</code>. The shape of the code barely
          changes — a lookup before the work, a write after it — but the tree does something
          dramatic. Every branch that would have been a repeat now terminates immediately at a green
          node, and the whole subtree that used to hang below it never comes into existence.
        </p>
        <p>
          The memo panel underneath fills in as this happens. Watch the order: entries appear from
          the <em>bottom</em> of the recursion upward, smallest <code>k</code> first, because a value
          can only be written once its two children have returned. That ordering is the bridge to the
          third tab — if the table always fills small-to-large anyway, you can skip the recursion and
          just fill it in that order deliberately.
        </p>
        <p>
          That is the whole relationship between top-down and bottom-up DP, and it is much easier to
          believe once you have seen the memo fill in exactly the order the loop would have used.
        </p>
      `,
    },
  ],

  comparison: {
    kicker: 'Three renderings',
    heading: 'Same recurrence, three costs',
    columns: ['Version', 'What it stores', 'Time', 'Space', 'When you would write it'],
    rows: [
      ['Naive recursion', 'Nothing', 'O(2ⁿ)', 'O(n) call stack',
        'Never as a final answer — but always as the first thing you say out loud, because the memo comes from it.'],
      ['Memoised (top-down)', 'One entry per distinct k', 'O(n)', 'O(n) memo + O(n) stack',
        'When the recursion is natural and you cannot easily see the fill order. Usually the fastest to write correctly.'],
      ['Table (bottom-up)', 'One array cell per k', 'O(n)', 'O(n), or O(1) with two variables',
        'When the fill order is obvious. No stack, no recursion limit, and it opens the door to the space optimisation.'],
    ],
    footnote: `
      All three return the same numbers, which are the Fibonacci sequence offset by one — <code>climb(n) = fib(n+1)</code>.
      Noticing that is a nice bit of colour in an interview, but do not lead with it: the interviewer is asking
      whether you can <em>derive</em> a recurrence and optimise it, not whether you recognise a sequence.
    `,
  },

  traps: {
    kicker: 'Failure modes',
    heading: 'Where this one actually goes wrong',
    items: [
      {
        title: 'Submitting the naive version because <code>n</code> looked small',
        body: 'The constraint is <code>n <= 45</code>, which sounds harmless and is not. The naive tree at n=45 is roughly 3.6 billion calls. This is the single most common way people fail this "easy" problem.',
      },
      {
        title: 'Getting the base cases off by one',
        body: 'Decide early whether <code>dp[0]</code> means anything. Here it is cleanest to seed <code>dp[1] = 1</code> and <code>dp[2] = 2</code> and never touch index 0. If you instead define <code>dp[0] = 1</code> ("one way to stand still") the loop can start at 2 — both work, but mixing the two conventions mid-solution is where the off-by-one comes from.',
      },
      {
        title: 'Allocating the array before the small-n guard',
        body: 'For <code>n = 1</code>, an array of size <code>n+1</code> has no index 2, so seeding <code>dp[2]</code> is an out-of-bounds write. Guard <code>n <= 2</code> first, exactly as the table tab does.',
      },
      {
        title: 'Memoising the base case by accident',
        body: 'Storing <code>k <= 2</code> results in the memo is harmless here, but the habit bites on problems where the base case depends on something outside the key. Keep the base case ahead of the lookup and the memo only ever holds computed values.',
      },
      {
        title: 'Stopping at the memo when they asked for O(1) space',
        body: 'The common follow-up. Only <code>dp[i-1]</code> and <code>dp[i-2]</code> are ever read, so the array collapses to two rolling variables. Say this unprompted after the table version — it is the cheapest way to show you understand what the table is actually doing.',
      },
    ],
  },

  next: {
    kicker: 'What it unlocks',
    heading: 'The 1D DP family, in order',
    intro:
      'Climbing Stairs is the smallest possible instance of "the answer at i depends on a couple of earlier answers". Once the recursion → memo → table pipeline is automatic, these are the same procedure with a different recurrence:',
    items: [
      { num: 746, title: 'Min Cost Climbing Stairs', note: 'Identical structure, but you minimise a cost instead of counting — the first time the recurrence stops being a plain sum.' },
      { num: 198, title: 'House Robber', note: 'Still 1D, still two predecessors, but now the choice is take-or-skip. The natural next problem.' },
      { num: 213, title: 'House Robber II', note: 'The same solver called twice on two ranges. Teaches decomposition rather than a new recurrence.' },
      { num: 322, title: 'Coin Change', note: 'The state is still one number, but each cell now loops over every coin. The step up from two predecessors to many.' },
      { num: 300, title: 'Longest Increasing Subsequence', note: 'Where O(n²) DP shows up and then gets replaced by something cleverer. A good reality check.' },
      { num: 62, title: 'Unique Paths', note: 'Two parameters change between calls, so the table becomes 2D. Same derivation, one more dimension.' },
    ],
  },

  interview: {
    kicker: 'In the room',
    heading: 'The order to say things in',
    html: `
      <p>
        Start by naming the recurrence in English before writing anything: "to reach step n I must have
        come from n-1 or n-2, so the number of ways to reach n is the sum of the ways to reach those
        two." Then state the base cases. You have now specified the whole solution, and everything
        after this is an optimisation conversation rather than a correctness one.
      </p>
      <p>
        Write the naive recursion, then immediately say why it is unacceptable — repeated subproblems,
        exponential, and here is the specific one that repeats. Add the memo. Say out loud that the key
        is <code>k</code> <em>because k is the only thing that varies between calls</em>; that sentence
        is what separates someone deriving a solution from someone reciting one.
      </p>
      <p>
        Convert to the table if there is time, and finish with the O(1) space version unprompted. That
        full arc — recurrence, naive, memo, table, rolling variables — takes about six minutes once you
        have done it a few times, and it is the single best-rehearsed thing you can bring to a DP round.
      </p>
    `,
  },
};

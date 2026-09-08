import { approaches, approachById } from './algorithms.js';
import { fromLevelOrder, parseInput as parseLevelOrder } from '#engine/tree.js';

export default {
  slug: 'count-good-nodes-in-binary-tree',
  number: 1448,
  title: 'Count Good Nodes in Binary Tree',
  difficulty: 'Medium',
  topics: ['Tree', 'Depth-First Search', 'Breadth-First Search', 'Binary Tree'],
  pattern: 'Tree traversal',

  stage: 'binary-tree',
  inputLabel: 'Tree',
  parseInput: (text) => fromLevelOrder(parseLevelOrder(text)),
  reference: function count(root) {
    const go = (n, mx) =>
      n ? (n.val >= mx ? 1 : 0) + go(n.left, Math.max(mx, n.val)) + go(n.right, Math.max(mx, n.val)) : 0;
    return root ? go(root, root.val) : 0;
  },
  checkInputs: [
    '[3,1,4,3,null,1,5]',
    '[3,3,null,4,2]',
    '[1]',
    '[]',
    '[2,2,2,2]',
    '[1,2,3,4,5,6,7]',
    '[10,5,6,1,2,3,4]',
    '[1,null,2,null,3,null,4]',
    '[5,4,8,11,null,13,4,7,2,null,null,null,1]',
  ],

  video: {
    // Verified via YouTube oEmbed: author_name "NeetCode".
    youtubeId: '7cp5imvDzl4',
    title: "Microsoft's Most Asked Question 2021 - Count Good Nodes in a Binary Tree - Leetcode 1448 - Python",
    channel: 'NeetCode',
  },

  links: {
    leetcode: 'https://leetcode.com/problems/count-good-nodes-in-binary-tree/',
    neetcode: 'https://neetcode.io/problems/count-good-nodes-in-binary-tree',
  },

  blurb:
    'The mirror image of 104. Here information travels DOWN the tree — each node is judged against the ancestors it inherited.',

  lede:
    'A node is good when nothing above it is taller. That makes it a fact about a node\'s <em>ancestors</em>, so the running maximum has to be carried <em>down</em> the recursion as a parameter. Watch the blue number arrive at each node before its verdict is decided.',

  statement: [
    'Given a binary tree <code>root</code>, a node <var>X</var> in the tree is named <strong>good</strong> if in the path from root to <var>X</var> there are no nodes with a value <em>greater than</em> <var>X</var>.',
    'Return the number of <strong>good</strong> nodes in the binary tree.',
  ],

  examples: [
    { input: 'root = [3,1,4,3,null,1,5]', output: '4' },
    { input: 'root = [3,3,null,4,2]', output: '3' },
    { input: 'root = [1]', output: '1' },
  ],

  constraints: [
    'The number of nodes is in the range [1, 10⁵].',
    'Each node\'s value is between [-10⁴, 10⁴].',
  ],

  defaultInput: '[3,1,4,3,null,1,5]',
  presets: [
    { name: 'example', arr: '[3,1,4,3,null,1,5]' },
    { name: 'ties count', arr: '[2,2,2,2]' },
    { name: 'all good', arr: '[1,2,3,4,5,6,7]' },
    { name: 'only the root', arr: '[10,5,6,1,2,3,4]' },
    { name: 'left spine', arr: '[1,null,2,null,3,null,4]' },
    { name: 'one node', arr: '[7]' },
  ],

  badgeLabels: { recursive: 'Good in this subtree' },
  carryLabels: { recursive: 'Max above', iterative: 'Max above', bfs: 'Max above' },

  tour: [
    { focus: 'stage', approach: 'recursive',
      text: 'One rule: a node is good if nothing on the path above it is taller. So every verdict depends on ancestors — on what came DOWN.' },
    { focus: 'code', approach: 'recursive',
      text: 'That is why dfs takes two arguments. node is what to look at; maxVal is the tallest thing seen on the way here.' },
    { focus: 'stage', approach: 'recursive', play: true,
      text: 'Play it. The blue number appears beside a node BEFORE its ring is decided — it arrived from the parent, and it is the only thing the comparison needs.' },
    { focus: 'code', approach: 'recursive', at: { anchor: 'update' },
      text: 'This line is the whole trick. maxVal is reassigned before the recursive calls, so the children inherit a possibly-raised bar — and the parent\'s own copy is untouched.' },
    { focus: 'stack', approach: 'recursive', at: { anchor: 'retZero' },
      text: 'Nulls still get a real call and still return 0. Same base case as 104.' },
    { focus: 'stage', approach: 'iterative', play: true,
      text: 'Without recursion you must store maxVal yourself, so every stack entry becomes a PAIR. That pair is exactly what the call frame was holding for you.' },
    { focus: 'stage', approach: 'bfs', play: true,
      text: 'And now a queue instead of a stack — one word of difference. The nodes light up row by row, and the answer is identical, because no verdict ever depended on visiting order.' },
    { focus: null, approach: 'recursive',
      text: 'Down for context, up for counts. Being able to say which of the two a problem needs is most of tree recursion.' },
  ],

  approaches,
  approachById,

  essay: [
    {
      kicker: 'The whole problem',
      figure: {
        approach: 'recursive',
        at: 'last',
        caption: 'The finished trace. Blue = the maximum inherited from above; green ring = good; grey dashed = blocked by an ancestor.',
      },
      heading: 'Down for context, up for counts',
      html: `
        <p>104 taught that answers flow <em>up</em>: every call is handed a subtree and has no idea how deep it already
        is. This problem is the mirror. "Good" is defined by what is <strong>above</strong> a node, so the running
        maximum has to travel <em>down</em>:</p>
        <div class="claim">good(node) = node.val &gt;= max(values on the path above it)</div>
        <p>A parameter is how you move information down a recursion. That is all <code>maxVal</code> is —
        a summary of the entire ancestor path, compressed into one integer, because the only thing you ever need to
        know about the ancestors is their maximum.</p>
        <p>Both directions are running at once here, which is what makes 1448 the better teaching problem of the two.
        <code>maxVal</code> goes down as an argument; <code>res</code> comes back up as a return value. Nearly every
        harder tree question is some combination of those two moves.</p>
      `,
    },
    {
      kicker: 'The line people get wrong',
      figure: {
        approach: 'recursive',
        at: { anchor: 'update' },
        caption: 'maxVal is reassigned before the recursive calls. The children see the new bar; the parent frame keeps its own copy.',
      },
      heading: 'Why reassigning maxVal is safe',
      html: `
        <p>The line <code>maxVal = max(maxVal, node.val)</code> looks alarming the first time — you are mutating the
        thing you were just judged against. It is fine, and understanding why is the point of the problem.</p>
        <p><code>maxVal</code> is a <strong>parameter</strong>, so each call has its own copy. Reassigning it changes
        what this frame passes to its children and nothing else. The comparison on the line above has already happened,
        and the parent's frame, sitting further down the call stack, still holds the value it was given. Scrub the trace
        and watch the blue badges: a node's badge never changes after it appears.</p>
        <p>If you find that uncomfortable, write it without the reassignment — pass
        <code>max(maxVal, node.val)</code> directly into both recursive calls. Identical behaviour, and arguably the
        clearer version to write on a whiteboard because there is no mutation to explain.</p>
      `,
    },
    {
      kicker: 'The one that reveals understanding',
      heading: 'Why the traversal order does not matter',
      html: `
        <p>Run the BFS tab and compare the final number with the recursive one. They match, and the reason is worth
        being able to state: <strong>a node's verdict depends only on its own ancestors</strong>, never on which other
        nodes have been visited. There is no shared running state to get out of order.</p>
        <p>That is not true of every tree problem. Anything that compares a node against a <em>global</em> best so far —
        diameter, max path sum — genuinely depends on accumulated state, and the ordering matters. Knowing which
        category a problem is in tells you immediately whether you can reach for a queue, parallelise the subtrees, or
        must keep a single mutable accumulator.</p>
        <p>The interview version of this observation: "each node only needs its root-to-node path, so this is
        embarrassingly parallel over subtrees." Say that and the follow-up question usually changes.</p>
      `,
    },
  ],

  comparison: {
    kicker: 'Three ways',
    heading: 'Same O(n), and unusually, same code',
    columns: ['Approach', 'Where maxVal lives', 'Time', 'Space', 'Reach for it when'],
    rows: [
      ['Recursive DFS', 'A function parameter, one per frame', 'O(n)', 'O(h) call stack',
        'Always, first. It is the version that reads like the definition.'],
      ['Iterative DFS', 'A field in each (node, maxVal) stack entry', 'O(n)', 'O(h) explicit stack',
        'The follow-up is "without recursion", or the tree is deep enough to overflow the stack.'],
      ['BFS / level order', 'A field in each (node, maxVal) queue entry', 'O(n)', 'O(w) queue, w = widest row',
        'Rarely — but being able to say it works unchanged is the point.'],
    ],
    footnote: `
      The last two differ by one method call: <code>pop()</code> versus <code>popleft()</code>. Compare the tabs
      line by line. When swapping a stack for a queue changes nothing but the order things light up, the algorithm
      does not depend on order — and saying so is a stronger answer than either implementation.
    `,
  },

  traps: {
    kicker: 'Failure modes',
    heading: 'The five that actually cost points',
    items: [
      {
        title: 'Using <code>&gt;</code> instead of <code>&gt;=</code>',
        body: 'The definition says no ancestor with a value <em>greater than</em> this node — so a tie is still good. With <code>&gt;</code> the root fails its own test when seeded with its own value, and every duplicate on a path is silently dropped. Try the <b>ties count</b> preset: the answer is 4, not 1.',
      },
      {
        title: 'Seeding the recursion with 0',
        body: 'Values go down to -10⁴, so 0 is not a floor. Any negative root gets marked bad and its whole subtree is judged against a bar that never existed. Seed with <code>root.val</code>, or with <code>float(\'-inf\')</code> / <code>INT_MIN</code>.',
      },
      {
        title: 'Reaching for a global <code>maxVal</code>',
        body: 'A single variable outside the recursion looks tidier and is wrong: after the left subtree returns, it still holds the left subtree\'s maximum, which is not on the right subtree\'s ancestor path at all. You would need to restore it on the way out — at which point you have reinvented the parameter, badly.',
      },
      {
        title: 'Forgetting the stack entry needs the pair',
        body: 'The most common iterative slip is pushing bare nodes and trying to look up "the max above" later. There is no parent pointer, so there is nothing to look up. The context has to be stored with the node — which is exactly what the recursive call frame was doing.',
      },
      {
        title: 'Recursion depth on a degenerate tree',
        body: 'Constraints allow 10⁵ nodes. A linked-list-shaped tree makes the recursion that deep and Python\'s default limit is 1000. Worth naming even while writing the recursive version — noticing it is the point. Try the <b>left spine</b> preset.',
      },
    ],
  },

  next: {
    kicker: 'What it unlocks',
    heading: 'Once information flows both ways',
    intro:
      'The reason to over-learn this one is that "pass context down, return an aggregate up" is the shape of every tree problem harder than 104. These are variations on it rather than new ideas:',
    items: [
      { num: 104, title: 'Maximum Depth of Binary Tree', note: 'The pure up-only case. Worth watching first — the contrast is the lesson.' },
      { num: 129, title: 'Sum Root to Leaf Numbers', note: 'Identical shape: carry the number built so far down, sum the leaves up.' },
      { num: 112, title: 'Path Sum', note: 'Carry the remaining target down. Same parameter trick, subtraction instead of max.' },
      { num: 98, title: 'Validate Binary Search Tree', note: 'Carry a <em>range</em> down instead of a single max. The natural next step.' },
      { num: 236, title: 'Lowest Common Ancestor', note: 'Answers flow up, but each node must combine what both sides reported.' },
      { num: 124, title: 'Binary Tree Maximum Path Sum', note: 'Both directions plus a global accumulator — the hard-mode payoff.' },
    ],
  },

  interview: {
    kicker: 'In the room',
    heading: 'What to say while you write it',
    html: `
      <p>Open with the classification, not the code: "good depends on the path above a node, so I need to carry
      information down; the count aggregates on the way up." That one sentence tells the interviewer you can decompose
      a tree problem rather than pattern-match it, and it makes the rest of the solution obvious.</p>
      <p>Then name the seed explicitly — <code>dfs(root, root.val)</code>, and say why: the root has no ancestors, so
      it is good by definition, and seeding with its own value gets that for free without a sentinel. Give complexity
      unprompted: <code>O(n)</code> time, every node visited once; <code>O(h)</code> space, worst case
      <code>O(n)</code> on a degenerate tree.</p>
      <p>If they ask for the iterative version, the honest framing lands well: you are taking the one thing the call
      frame was holding for you — <code>maxVal</code> — and storing it yourself, which is why the entries become pairs.
      And if there is time, the observation that a queue works identically is the cheapest way to show you understand
      the problem rather than the traversal.</p>
    `,
  },
};

import { approaches, approachById } from './algorithms.js';
import { fromLevelOrder, parseInput as parseLevelOrder } from '#engine/tree.js';

/**
 * One problem = one folder.
 *   algorithms.js  instrumented solutions + per-language source with anchors
 *   index.js       everything the page renders around them
 *
 * To add a problem, copy this folder, rewrite both files, and register the
 * new module in content/index.js. Nothing else in the app needs to change.
 */
export default {
  slug: 'maximum-depth-of-binary-tree',
  number: 104,
  title: 'Maximum Depth of Binary Tree',
  difficulty: 'Easy',
  topics: ['Tree', 'Depth-First Search', 'Breadth-First Search', 'Binary Tree'],
  pattern: 'Tree traversal',

  // How this problem is staged and what its input is.
  stage: 'binary-tree',
  inputLabel: 'Tree',
  parseInput: (text) => fromLevelOrder(parseLevelOrder(text)),
  /** Ground truth for scripts/check.mjs. */
  reference: function depth(root) {
    return root ? 1 + Math.max(depth(root.left), depth(root.right)) : 0;
  },
  checkInputs: [
    '[3,9,20,null,null,15,7]',
    '[1,null,2]',
    '[]',
    '[0]',
    '[1,2,3,4,null,null,5,6]',
    '[1,2,null,3,null,4,null,5]',
    '[5,4,8,11,null,13,4,7,2,null,null,null,1]',
  ],

  links: {
    leetcode: 'https://leetcode.com/problems/maximum-depth-of-binary-tree/',
    neetcode: 'https://neetcode.io/problems/depth-of-binary-tree',
  },

  blurb:
    'The base pattern for almost every tree question. Recurse, combine the two subtree answers, hand the result back up.',

  lede:
    'Three ways to solve it, running one step at a time. Watch the call stack grow, hit the null base case, and hand answers back up the tree — because the moment you can see values flowing <em>upward</em>, every other tree problem gets easier.',

  statement: [
    'Given the <code>root</code> of a binary tree, return its <strong>maximum depth</strong>.',
    "A binary tree's maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.",
  ],

  examples: [
    { input: 'root = [3,9,20,null,null,15,7]', output: '3' },
    { input: 'root = [1,null,2]', output: '2' },
    { input: 'root = []', output: '0' },
  ],

  constraints: [
    'The number of nodes is in the range [0, 10⁴].',
    '-100 <= Node.val <= 100',
  ],

  // What the visualiser starts on, and the shapes worth trying.
  defaultInput: '[3,9,20,null,null,15,7]',
  presets: [
    { name: 'example', arr: '[3,9,20,null,null,15,7]' },
    { name: 'skewed', arr: '[1,null,2,null,3,null,4]' },
    { name: 'perfect', arr: '[1,2,3,4,5,6,7]' },
    { name: 'lopsided', arr: '[5,4,8,11,null,13,4,7,2,null,null,null,1]' },
    { name: 'one node', arr: '[7]' },
    { name: 'empty', arr: '[]' },
  ],

  // Per-approach label for the number that appears on each node.
  badgeLabels: { recursive: 'Return value', iterative: 'Depth', bfs: 'Level' },

  approaches,
  approachById,

  essay: [
    {
      kicker: 'The whole problem',
      heading: 'One sentence, written twice',
      html: `
        <p>Depth is defined recursively, so the definition <em>is</em> the algorithm. Say it in English
        first and the code writes itself:</p>
        <div class="claim">depth(empty) = 0<br>depth(node)&nbsp; = 1 + max(depth(left), depth(right))</div>
        <p>That's it. The recursive solution is a literal transcription. Everything else on this page —
        the explicit stack, the queue — is the same two lines with the bookkeeping moved somewhere you
        can see it.</p>
        <p>One definition worth pinning down: LeetCode counts <strong>nodes</strong>, not edges. A single-node
        tree has depth 1, not 0. Height is usually measured in edges, which is why the same tree is
        sometimes "depth 3" and sometimes "height 2" depending on whose textbook you're reading.
        Read the constraints, not your memory.</p>
      `,
    },
    {
      kicker: 'The part that trips people',
      heading: 'Nothing counts on the way down',
      html: `
        <p>Beginners expect a counter that increments as you descend. In the recursive version there
        isn't one — <strong>no information travels downward at all</strong>. Every call is handed a subtree
        and asked the same question, with no idea how deep it already is.</p>
        <p>The answers are built on the way <em>back up</em>. A null child returns 0, its parent turns that
        into 1, that parent turns it into 2. Scrub the recursive trace above and watch the green badges
        appear: they fill in bottom-up, leaves first, root last. The root's badge is the answer, and it
        is the last thing to exist.</p>
        <p>The iterative version flips this. There, depth <em>is</em> passed down — that's exactly what the
        <code>[node, depth]</code> pair is for — and the answer accumulates in <code>res</code> as you go.
        Two opposite information flows, same result. Being able to say that out loud is most of what an
        interviewer is listening for.</p>
      `,
    },
  ],

  comparison: {
    kicker: 'Three ways',
    heading: 'Same O(n), different shape',
    columns: ['Approach', 'Where depth lives', 'Time', 'Space', 'Reach for it when'],
    rows: [
      ['Recursive DFS', 'In the return values, flowing up', 'O(n)', 'O(h) call stack',
        "Always, first. It's five lines and it's the one you'll be asked to write."],
      ['Iterative DFS', 'In the stack entries, flowing down', 'O(n)', 'O(h) explicit stack',
        'The follow-up is "now without recursion", or the tree is deep enough to blow the stack.'],
      ['BFS / level order', "Implicit — it's the row number", 'O(n)', 'O(w) queue, w = widest row',
        'You need levels for anything else too. This template generalises furthest.'],
    ],
    footnote: `
      <code>h</code> is the height and <code>w</code> the maximum width. They pull in opposite directions:
      a skewed tree is terrible for DFS (<code>h = n</code>) and free for BFS (<code>w = 1</code>); a perfect
      tree is the reverse (<code>h = log n</code>, <code>w = n/2</code>). Try the <b>skewed</b> and
      <b>perfect</b> presets above and watch which panel gets tall.
    `,
  },

  traps: {
    kicker: 'Failure modes',
    heading: 'The five that actually cost points',
    items: [
      {
        title: 'Swapping <code>max</code> for <code>min</code> to solve Minimum Depth',
        body: 'The most common trap in this family. It breaks on a node with one child: the missing side returns 0, <code>min</code> takes it, and you report a leaf that doesn\'t exist. Minimum depth needs an explicit one-child case — or just use BFS and return at the first leaf, which is also faster.',
      },
      {
        title: 'Counting nodes instead of levels in BFS',
        body: 'If you don\'t snapshot <code>len(q)</code> before the inner loop, you drain nodes the current iteration enqueued and lose the level boundary. That single <code>size</code> variable is the entire trick of the level-order template.',
      },
      {
        title: 'Forgetting the empty tree',
        body: '<code>root = []</code> must return 0. The recursive version handles it for free; the BFS version needs the explicit guard, or <code>q.popleft()</code> runs on nothing.',
      },
      {
        title: 'Recursion depth on skewed input',
        body: 'Constraints allow up to 10⁴ nodes. A linked-list-shaped tree makes the recursion that deep, and Python\'s default limit is 1000. Worth naming in an interview even if you still write the recursive version — noticing it is the point.',
      },
      {
        title: 'Pushing nulls in BFS the way you do in DFS',
        body: 'The iterative DFS here happily pushes null children and filters them on pop — harmless. Do that in the level-order loop and your <code>size</code> count includes phantoms, so the levels desynchronise. Guard before enqueueing.',
      },
    ],
  },

  next: {
    kicker: 'What it unlocks',
    heading: 'This is the base pattern, not a one-off',
    intro:
      '104 is worth over-learning because "recurse, then combine the two subtree answers" is the shape of most tree problems. Once the return-values-flow-upward picture is solid, these become variations rather than new problems:',
    items: [
      { num: 110, title: 'Balanced Binary Tree', note: 'Same recursion, but return depth <em>and</em> a balanced flag together.' },
      { num: 543, title: 'Diameter of Binary Tree', note: 'Same recursion; the answer is a side effect recorded at each node, not the return value.' },
      { num: 111, title: 'Minimum Depth', note: 'The trap above, made into its own problem.' },
      { num: 102, title: 'Binary Tree Level Order Traversal', note: 'The BFS template here, collecting rows instead of counting them.' },
      { num: 199, title: 'Binary Tree Right Side View', note: 'Same BFS loop, take the last node of each row.' },
      { num: 124, title: 'Max Path Sum', note: 'The 543 pattern with sums — the hard-mode payoff for understanding this one.' },
    ],
  },

  interview: {
    kicker: 'In the room',
    heading: 'What to say while you write it',
    html: `
      <p>Lead with the recurrence in English before touching code — "the depth of a tree is one plus the deeper
      of its two subtrees, and an empty tree has depth zero." That single sentence tells the interviewer you
      understand the structure rather than remembering a snippet.</p>
      <p>Then state the base case, write the five lines, and give complexity unprompted: <code>O(n)</code> time
      because every node is visited once, <code>O(h)</code> space for the call stack, worst case
      <code>O(n)</code> on a degenerate tree. If they ask for the iterative version, the honest framing is
      the best one — you're making the call stack explicit, and the pair carries the depth the stack frame
      used to hold for you.</p>
    `,
  },
};

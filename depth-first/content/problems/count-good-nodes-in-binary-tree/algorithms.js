/**
 * algorithms.js — instrumented implementations of LeetCode 1448.
 *
 * The visual grammar for this problem, and the reason it earns three tabs:
 *
 *   blue badge, left of a node   the maxVal that was handed DOWN into that call
 *   green ring                   that node is good  (val >= the blue number)
 *   grey dashed ring             that node is not good
 *   green badge, right of a node the count that subtree returned (recursive only)
 *
 * 104's lesson is that answers flow up. This one's is that context flows down —
 * so the frames deliberately make the inherited number a visible object on the
 * tree rather than a variable in a side panel.
 */

/* ------------------------------------------------------------------ */
/* 1. Recursive DFS — maxVal carried down as a parameter               */
/* ------------------------------------------------------------------ */

const recursiveCode = {
  python: {
    source: `class Solution:
    def goodNodes(self, root: TreeNode) -> int:
        def dfs(node, maxVal):
            if not node:
                return 0

            res = 1 if node.val >= maxVal else 0
            maxVal = max(maxVal, node.val)
            res += dfs(node.left, maxVal)
            res += dfs(node.right, maxVal)
            return res

        return dfs(root, root.val)`,
    anchors: { seed: 13, call: 3, nullCheck: 4, retZero: 5, test: 7, update: 8, left: 9, right: 10, ret: 11 },
  },
  javascript: {
    source: `var goodNodes = function(root) {
    const dfs = (node, maxVal) => {
        if (node === null) {
            return 0;
        }

        let res = node.val >= maxVal ? 1 : 0;
        maxVal = Math.max(maxVal, node.val);
        res += dfs(node.left, maxVal);
        res += dfs(node.right, maxVal);
        return res;
    };

    return dfs(root, root.val);
};`,
    anchors: { seed: 14, call: 2, nullCheck: 3, retZero: 4, test: 7, update: 8, left: 9, right: 10, ret: 11 },
  },
  java: {
    source: `class Solution {
    public int goodNodes(TreeNode root) {
        return dfs(root, root.val);
    }

    private int dfs(TreeNode node, int maxVal) {
        if (node == null) {
            return 0;
        }

        int res = node.val >= maxVal ? 1 : 0;
        maxVal = Math.max(maxVal, node.val);
        res += dfs(node.left, maxVal);
        res += dfs(node.right, maxVal);
        return res;
    }
}`,
    anchors: { seed: 3, call: 6, nullCheck: 7, retZero: 8, test: 11, update: 12, left: 13, right: 14, ret: 15 },
  },
  cpp: {
    source: `class Solution {
public:
    int goodNodes(TreeNode* root) {
        return dfs(root, root->val);
    }

private:
    int dfs(TreeNode* node, int maxVal) {
        if (node == nullptr) {
            return 0;
        }

        int res = node->val >= maxVal ? 1 : 0;
        maxVal = max(maxVal, node->val);
        res += dfs(node->left, maxVal);
        res += dfs(node->right, maxVal);
        return res;
    }
};`,
    anchors: { seed: 4, call: 8, nullCheck: 9, retZero: 10, test: 13, update: 14, left: 15, right: 16, ret: 17 },
  },
};

/** Shared by all three: the empty tree never happens on LeetCode, but the input box allows it. */
function emptyFrames(anchor) {
  return {
    frames: [
      {
        anchor,
        caption:
          'Empty tree. The constraints promise at least one node, so this case never reaches your submission — but there is nothing to count.',
        callStack: [], path: [], returns: {}, carried: {}, marks: {},
        active: null, aux: null, vars: [], result: 0, flash: 'done',
        returning: null, nullSlot: null,
      },
    ],
    answer: 0,
  };
}

function recursiveFrames(root) {
  if (!root) return emptyFrames('seed');

  const frames = [];
  const callStack = [];
  const path = [];
  const returns = {};
  const carried = {};
  const marks = {};
  let good = 0;

  const snap = (anchor, caption, extra = {}) => {
    frames.push({
      anchor,
      caption,
      callStack: callStack.map((f) => ({ ...f })),
      path: [...path],
      returns: { ...returns },
      carried: { ...carried },
      marks: { ...marks },
      active: extra.active ?? null,
      aux: null,
      vars: [{ name: 'good so far', value: good }, ...(extra.vars ?? [])],
      result: extra.result ?? null,
      flash: extra.flash ?? null,
      returning: extra.returning ?? null,
      nullSlot: extra.nullSlot ?? null,
    });
  };

  const dfs = (node, maxVal, parent, side) => {
    const label = node ? `dfs(${node.val}, max=${maxVal})` : `dfs(null, max=${maxVal})`;
    callStack.push({ label, nodeId: node ? node.id : null, isNull: !node });
    if (node) path.push(node.id);

    const slot = node || !parent ? null : { parentId: parent.id, side };

    snap(
      'call',
      node
        ? `Call dfs on node ${node.val}, handed maxVal = ${maxVal} from above.`
        : `Call dfs(null) — the ${side} child of ${parent.val} does not exist. maxVal still travels with it.`,
      { active: node ? node.id : null, flash: 'call', nullSlot: slot, vars: [{ name: 'maxVal in', value: maxVal }] }
    );

    if (!node) {
      snap('nullCheck', 'node is null, so the base case fires.', {
        nullSlot: slot, vars: [{ name: 'maxVal in', value: maxVal }],
      });
      snap('retZero', 'Return 0 — an empty subtree holds no good nodes. Frame pops.', {
        flash: 'return', returning: 0, nullSlot: slot,
      });
      callStack.pop();
      return 0;
    }

    // The inherited number becomes a visible object on the tree here, before
    // the comparison — the picture should show WHERE it came from.
    carried[node.id] = maxVal;
    snap('nullCheck', `Node ${node.val} is real. The blue number beside it is the maximum on the path above it.`, {
      active: node.id, vars: [{ name: 'maxVal in', value: maxVal }],
    });

    const isGood = node.val >= maxVal;
    marks[node.id] = isGood ? 'good' : 'bad';
    if (isGood) good += 1;
    let res = isGood ? 1 : 0;

    snap(
      'test',
      isGood
        ? `${node.val} >= ${maxVal}, so nothing on the path above blocks it. GOOD — res starts at 1.`
        : `${node.val} < ${maxVal}, so an ancestor is taller. Not good — res starts at 0.`,
      { active: node.id, flash: isGood ? 'best' : null, vars: [{ name: 'maxVal in', value: maxVal }, { name: 'res', value: res }] }
    );

    const nextMax = Math.max(maxVal, node.val);
    snap(
      'update',
      nextMax === maxVal
        ? `max(${maxVal}, ${node.val}) = ${nextMax} — this node does not raise the bar for its children.`
        : `max(${maxVal}, ${node.val}) = ${nextMax} — this node raises the bar for everything below it.`,
      { active: node.id, vars: [{ name: 'maxVal out', value: nextMax }, { name: 'res', value: res }] }
    );

    snap('left', `Go left from ${node.val}, carrying ${nextMax} down.`, {
      active: node.id, vars: [{ name: 'maxVal out', value: nextMax }, { name: 'res', value: res }],
    });
    const leftCount = dfs(node.left, nextMax, node, 'left');
    res += leftCount;
    snap('left', `Left subtree of ${node.val} found ${leftCount}. res = ${res}.`, {
      active: node.id, vars: [{ name: 'res', value: res }],
    });

    snap('right', `Now right from ${node.val}, carrying the same ${nextMax}.`, {
      active: node.id, vars: [{ name: 'res', value: res }],
    });
    const rightCount = dfs(node.right, nextMax, node, 'right');
    res += rightCount;
    snap('right', `Right subtree of ${node.val} found ${rightCount}. res = ${res}.`, {
      active: node.id, vars: [{ name: 'res', value: res }],
    });

    returns[node.id] = res;
    snap('ret', `The subtree rooted at ${node.val} holds ${res} good node${res === 1 ? '' : 's'}. Return it upward.`, {
      active: node.id, flash: 'return', returning: res, vars: [{ name: 'res', value: res }],
    });

    callStack.pop();
    path.pop();
    return res;
  };

  const answer = dfs(root, root.val, null, 'root');

  frames.push({
    anchor: 'seed',
    caption: `The call stack is empty. ${answer} good node${answer === 1 ? '' : 's'}. Notice the root is always good — it is seeded with its own value, so ${root.val} >= ${root.val}.`,
    callStack: [], path: [], returns: { ...returns }, carried: { ...carried }, marks: { ...marks },
    active: root.id, aux: null, vars: [{ name: 'good so far', value: good }],
    result: answer, flash: 'done', returning: null, nullSlot: null,
  });

  return { frames, answer };
}

/* ------------------------------------------------------------------ */
/* 2 & 3. Explicit stack / queue of (node, maxVal) pairs               */
/* ------------------------------------------------------------------ */

const iterativeCode = {
  python: {
    source: `class Solution:
    def goodNodes(self, root: TreeNode) -> int:
        res = 0
        stack = [(root, root.val)]

        while stack:
            node, maxVal = stack.pop()

            if node.val >= maxVal:
                res += 1

            maxVal = max(maxVal, node.val)
            if node.left:
                stack.append((node.left, maxVal))
            if node.right:
                stack.append((node.right, maxVal))

        return res`,
    anchors: { initRes: 3, initBag: 4, while: 6, pop: 7, test: 9, inc: 10, update: 12, pushLeft: 14, pushRight: 16, ret: 18 },
  },
  javascript: {
    source: `var goodNodes = function(root) {
    let res = 0;
    const stack = [[root, root.val]];

    while (stack.length > 0) {
        let [node, maxVal] = stack.pop();

        if (node.val >= maxVal) {
            res++;
        }

        maxVal = Math.max(maxVal, node.val);
        if (node.left) stack.push([node.left, maxVal]);
        if (node.right) stack.push([node.right, maxVal]);
    }

    return res;
};`,
    anchors: { initRes: 2, initBag: 3, while: 5, pop: 6, test: 8, inc: 9, update: 12, pushLeft: 13, pushRight: 14, ret: 17 },
  },
  java: {
    source: `class Solution {
    public int goodNodes(TreeNode root) {
        int res = 0;
        Deque<Pair<TreeNode, Integer>> stack = new ArrayDeque<>();
        stack.push(new Pair<>(root, root.val));

        while (!stack.isEmpty()) {
            Pair<TreeNode, Integer> top = stack.pop();
            TreeNode node = top.getKey();
            int maxVal = top.getValue();

            if (node.val >= maxVal) {
                res++;
            }

            maxVal = Math.max(maxVal, node.val);
            if (node.left != null) stack.push(new Pair<>(node.left, maxVal));
            if (node.right != null) stack.push(new Pair<>(node.right, maxVal));
        }

        return res;
    }
}`,
    anchors: { initRes: 3, initBag: 5, while: 7, pop: 8, test: 12, inc: 13, update: 16, pushLeft: 17, pushRight: 18, ret: 21 },
  },
  cpp: {
    source: `class Solution {
public:
    int goodNodes(TreeNode* root) {
        int res = 0;
        stack<pair<TreeNode*, int>> st;
        st.push({root, root->val});

        while (!st.empty()) {
            auto [node, maxVal] = st.top();
            st.pop();

            if (node->val >= maxVal) {
                res++;
            }

            maxVal = max(maxVal, node->val);
            if (node->left) st.push({node->left, maxVal});
            if (node->right) st.push({node->right, maxVal});
        }

        return res;
    }
};`,
    anchors: { initRes: 4, initBag: 6, while: 8, pop: 9, test: 12, inc: 13, update: 16, pushLeft: 17, pushRight: 18, ret: 21 },
  },
};

const bfsCode = {
  python: {
    source: `class Solution:
    def goodNodes(self, root: TreeNode) -> int:
        res = 0
        q = deque([(root, root.val)])

        while q:
            node, maxVal = q.popleft()

            if node.val >= maxVal:
                res += 1

            maxVal = max(maxVal, node.val)
            if node.left:
                q.append((node.left, maxVal))
            if node.right:
                q.append((node.right, maxVal))

        return res`,
    anchors: { initRes: 3, initBag: 4, while: 6, pop: 7, test: 9, inc: 10, update: 12, pushLeft: 14, pushRight: 16, ret: 18 },
  },
  javascript: {
    source: `var goodNodes = function(root) {
    let res = 0;
    const q = [[root, root.val]];

    while (q.length > 0) {
        let [node, maxVal] = q.shift();

        if (node.val >= maxVal) {
            res++;
        }

        maxVal = Math.max(maxVal, node.val);
        if (node.left) q.push([node.left, maxVal]);
        if (node.right) q.push([node.right, maxVal]);
    }

    return res;
};`,
    anchors: { initRes: 2, initBag: 3, while: 5, pop: 6, test: 8, inc: 9, update: 12, pushLeft: 13, pushRight: 14, ret: 17 },
  },
  java: {
    source: `class Solution {
    public int goodNodes(TreeNode root) {
        int res = 0;
        Queue<Pair<TreeNode, Integer>> q = new LinkedList<>();
        q.add(new Pair<>(root, root.val));

        while (!q.isEmpty()) {
            Pair<TreeNode, Integer> front = q.poll();
            TreeNode node = front.getKey();
            int maxVal = front.getValue();

            if (node.val >= maxVal) {
                res++;
            }

            maxVal = Math.max(maxVal, node.val);
            if (node.left != null) q.add(new Pair<>(node.left, maxVal));
            if (node.right != null) q.add(new Pair<>(node.right, maxVal));
        }

        return res;
    }
}`,
    anchors: { initRes: 3, initBag: 5, while: 7, pop: 8, test: 12, inc: 13, update: 16, pushLeft: 17, pushRight: 18, ret: 21 },
  },
  cpp: {
    source: `class Solution {
public:
    int goodNodes(TreeNode* root) {
        int res = 0;
        queue<pair<TreeNode*, int>> q;
        q.push({root, root->val});

        while (!q.empty()) {
            auto [node, maxVal] = q.front();
            q.pop();

            if (node->val >= maxVal) {
                res++;
            }

            maxVal = max(maxVal, node->val);
            if (node->left) q.push({node->left, maxVal});
            if (node->right) q.push({node->right, maxVal});
        }

        return res;
    }
};`,
    anchors: { initRes: 4, initBag: 6, while: 8, pop: 9, test: 12, inc: 13, update: 16, pushLeft: 17, pushRight: 18, ret: 21 },
  },
};

/**
 * One builder for both explicit-container versions. They differ by a single
 * character in the source — pop() vs popleft() — and that is precisely the
 * point being made, so they share a body rather than being copy-pasted.
 */
function bagFrames(root, kind) {
  if (!root) return emptyFrames('initRes');

  const isStack = kind === 'stack';
  const title = isStack ? 'STACK  (bottom → top)' : 'QUEUE  (front → back)';
  const takeWord = isStack ? 'Pop' : 'Dequeue';

  const frames = [];
  const bag = [];
  const seen = [];
  const carried = {};
  const marks = {};
  let res = 0;

  const auxItems = () =>
    bag.map((e, i) => ({
      key: `${i}-${e.node.id}-${e.maxVal}`,
      label: `(${e.node.val}, ${e.maxVal})`,
      nodeId: e.node.id,
      depth: e.maxVal,
      isNull: false,
    }));

  const snap = (anchor, caption, extra = {}) => {
    frames.push({
      anchor,
      caption,
      callStack: null,
      path: [...seen],
      returns: {},
      carried: { ...carried },
      marks: { ...marks },
      active: extra.active ?? null,
      aux: { kind: isStack ? 'stack' : 'queue', title, items: auxItems() },
      vars: [{ name: 'res', value: res }, ...(extra.vars ?? [])],
      result: extra.result ?? null,
      flash: extra.flash ?? null,
      returning: null,
    });
  };

  snap('initRes', 'res counts good nodes. Start at 0.', { active: root.id });
  bag.push({ node: root, maxVal: root.val });
  snap(
    'initBag',
    `Seed the ${kind} with a PAIR: the root, and the running max it should be judged against. Seeding it with the root's own value makes the root good by definition.`,
    { active: root.id }
  );

  let guard = 0;
  while (bag.length > 0 && guard++ < 5000) {
    snap('while', `The ${kind} holds ${bag.length} pair${bag.length === 1 ? '' : 's'} — keep going.`, {});

    const { node, maxVal } = isStack ? bag.pop() : bag.shift();
    carried[node.id] = maxVal;
    if (!seen.includes(node.id)) seen.push(node.id);
    snap('pop', `${takeWord} (${node.val}, ${maxVal}). The pair carries its own context — nothing is looked up.`, {
      active: node.id, flash: 'pop', vars: [{ name: 'maxVal', value: maxVal }],
    });

    const isGood = node.val >= maxVal;
    marks[node.id] = isGood ? 'good' : 'bad';
    snap(
      'test',
      isGood
        ? `${node.val} >= ${maxVal} — nothing above it is taller. GOOD.`
        : `${node.val} < ${maxVal} — an ancestor blocks it. Not good.`,
      { active: node.id, vars: [{ name: 'maxVal', value: maxVal }] }
    );

    if (isGood) {
      res += 1;
      snap('inc', `res = ${res}.`, { active: node.id, flash: 'best' });
    }

    const nextMax = Math.max(maxVal, node.val);
    snap(
      'update',
      nextMax === maxVal
        ? `max(${maxVal}, ${node.val}) = ${nextMax} — the bar for the children is unchanged.`
        : `max(${maxVal}, ${node.val}) = ${nextMax} — the children inherit a higher bar.`,
      { active: node.id, vars: [{ name: 'maxVal out', value: nextMax }] }
    );

    if (node.left) {
      bag.push({ node: node.left, maxVal: nextMax });
      snap('pushLeft', `Push (${node.left.val}, ${nextMax}) — the child is stored WITH the context it needs.`, {
        active: node.id,
      });
    }
    if (node.right) {
      bag.push({ node: node.right, maxVal: nextMax });
      snap('pushRight', `Push (${node.right.val}, ${nextMax}).`, { active: node.id });
    }
  }

  snap('while', `The ${kind} is empty.`, {});
  frames.push({
    anchor: 'ret',
    caption: `Return res = ${res}. Every node was judged against its own ancestors, so the visiting order never mattered.`,
    callStack: null, path: [...seen], returns: {},
    carried: { ...carried }, marks: { ...marks },
    active: null,
    aux: { kind: isStack ? 'stack' : 'queue', title, items: [] },
    vars: [{ name: 'res', value: res }],
    result: res, flash: 'done', returning: null,
  });

  return { frames, answer: res };
}

/* ------------------------------------------------------------------ */

export const approaches = [
  {
    id: 'recursive',
    name: 'Recursive DFS',
    tagline: 'The five lines you should be able to write cold.',
    watchFor:
      'Watch the BLUE number appear beside each node before its ring turns green or grey. That number arrived from above — it is the whole problem.',
    idea:
      'A node is good when nothing on the path from the root is taller than it. That is a fact about its ancestors, ' +
      'so the recursion carries the running maximum DOWN as a parameter. Each call compares, then hands its children ' +
      'a possibly-raised bar. The counts add up on the way back out.',
    time: 'O(n)',
    space: 'O(h)',
    spaceNote: 'h = height. The maxVal parameter is one integer per frame, not a copy of the path.',
    stackPanel: 'call',
    code: recursiveCode,
    build: (root) => recursiveFrames(root),
  },
  {
    id: 'iterative',
    name: 'Iterative DFS',
    tagline: 'The parameter becomes a field in the stack entry.',
    watchFor:
      'Watch the stack panel: every entry is a PAIR. The context is stored next to the node, not looked up from it.',
    idea:
      'The only thing the recursion was doing for you is remembering which maxVal belongs to which node. Make the stack ' +
      'explicit and you have to store it yourself — which is why the entries are (node, maxVal) pairs. If you can explain ' +
      'why the pair is necessary, you understand the recursive version.',
    time: 'O(n)',
    space: 'O(h)',
    spaceNote: 'The stack holds at most one root-to-leaf path plus siblings.',
    stackPanel: 'aux',
    code: iterativeCode,
    build: (root) => bagFrames(root, 'stack'),
  },
  {
    id: 'bfs',
    name: 'BFS / Level Order',
    tagline: 'Same code, one word different — and the answer is identical.',
    watchFor:
      'The nodes light up row by row instead of branch by branch, and the final count is unchanged. Order does not matter here.',
    idea:
      'Swap the stack for a queue and literally nothing else changes: pop() becomes popleft(). The answer is the same because ' +
      'each verdict depends only on a node\'s own ancestors, never on which nodes were visited before it. That is worth ' +
      'saying out loud in an interview — it is the difference between memorising a traversal and understanding one.',
    time: 'O(n)',
    space: 'O(w)',
    spaceNote: 'w = maximum width, up to n/2 for the bottom row of a full tree.',
    stackPanel: 'aux',
    code: bfsCode,
    build: (root) => bagFrames(root, 'queue'),
  },
];

export const approachById = (id) => approaches.find((a) => a.id === id) || approaches[0];

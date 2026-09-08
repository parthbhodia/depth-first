/**
 * algorithms.js — instrumented implementations of LeetCode 104.
 *
 * Each approach exposes:
 *   - code[lang]    : { source, anchors }  where anchors map a semantic step
 *                     name to a 1-indexed line number in that language's source
 *   - buildFrames() : replays the algorithm and records one frame per step
 *
 * A frame is a complete snapshot of the machine at one instant:
 *   { anchor, caption, active, path, callStack, aux, returns, vars, result, flash }
 *
 * The UI never runs the algorithm — it only paints frames. That separation is
 * what makes scrubbing backwards, stepping, and speed control trivial.
 */

/* ------------------------------------------------------------------ */
/* 1. Recursive DFS                                                    */
/* ------------------------------------------------------------------ */

const recursiveCode = {
  python: {
    source: `class Solution:
    def maxDepth(self, root: Optional[TreeNode]) -> int:
        if not root:
            return 0

        left = self.maxDepth(root.left)
        right = self.maxDepth(root.right)

        return 1 + max(left, right)`,
    anchors: { call: 2, nullCheck: 3, retZero: 4, left: 6, right: 7, ret: 9 },
  },
  javascript: {
    source: `var maxDepth = function(root) {
    if (root === null) {
        return 0;
    }

    const left = maxDepth(root.left);
    const right = maxDepth(root.right);

    return 1 + Math.max(left, right);
};`,
    anchors: { call: 1, nullCheck: 2, retZero: 3, left: 6, right: 7, ret: 9 },
  },
  java: {
    source: `class Solution {
    public int maxDepth(TreeNode root) {
        if (root == null) {
            return 0;
        }

        int left = maxDepth(root.left);
        int right = maxDepth(root.right);

        return 1 + Math.max(left, right);
    }
}`,
    anchors: { call: 2, nullCheck: 3, retZero: 4, left: 7, right: 8, ret: 10 },
  },
  cpp: {
    source: `class Solution {
public:
    int maxDepth(TreeNode* root) {
        if (root == nullptr) {
            return 0;
        }

        int left = maxDepth(root->left);
        int right = maxDepth(root->right);

        return 1 + max(left, right);
    }
};`,
    anchors: { call: 3, nullCheck: 4, retZero: 5, left: 8, right: 9, ret: 11 },
  },
};

function recursiveFrames(root) {
  const frames = [];
  const callStack = [];
  const path = [];
  const returns = {};

  const snap = (anchor, caption, extra = {}) => {
    frames.push({
      anchor,
      caption,
      callStack: callStack.map((f) => ({ ...f })),
      path: [...path],
      returns: { ...returns },
      active: extra.active ?? null,
      aux: null,
      vars: extra.vars ?? [],
      result: extra.result ?? null,
      flash: extra.flash ?? null,
      returning: extra.returning ?? null,
      nullSlot: extra.nullSlot ?? null,
    });
  };

  const dfs = (node, parent, side) => {
    const label = node ? `maxDepth(${node.val})` : 'maxDepth(null)';
    callStack.push({ label, nodeId: node ? node.id : null, isNull: !node });
    if (node) path.push(node.id);

    // A missing child still gets a real function call. Showing it as a ghost
    // slot on the tree is the whole point of the base case.
    const slot = node || !parent ? null : { parentId: parent.id, side };

    snap(
      'call',
      node
        ? `Call maxDepth(${node.val}). A new frame goes on the call stack.`
        : `Call maxDepth(null) — the ${side} child of ${parent ? parent.val : 'root'} does not exist.`,
      { active: node ? node.id : null, flash: 'call', nullSlot: slot }
    );

    if (!node) {
      snap('nullCheck', `root is null, so the base case fires.`, { nullSlot: slot });
      snap('retZero', `Return 0 — an empty subtree contributes no depth. Frame pops.`, {
        flash: 'return',
        returning: 0,
        nullSlot: slot,
      });
      callStack.pop();
      return 0;
    }

    snap('nullCheck', `Node ${node.val} is not null, so we keep descending.`, { active: node.id });

    snap('left', `Go into the LEFT subtree of ${node.val} and wait for its answer.`, {
      active: node.id,
    });
    const left = dfs(node.left, node, 'left');
    snap('left', `Left subtree of ${node.val} returned ${left}.`, {
      active: node.id,
      vars: [{ name: 'left', value: left }],
    });

    snap('right', `Now the RIGHT subtree of ${node.val}.`, {
      active: node.id,
      vars: [{ name: 'left', value: left }],
    });
    const right = dfs(node.right, node, 'right');
    snap('right', `Right subtree of ${node.val} returned ${right}.`, {
      active: node.id,
      vars: [
        { name: 'left', value: left },
        { name: 'right', value: right },
      ],
    });

    const val = 1 + Math.max(left, right);
    returns[node.id] = val;
    snap('ret', `1 + max(${left}, ${right}) = ${val}. Node ${node.val} returns ${val}.`, {
      active: node.id,
      flash: 'return',
      returning: val,
      vars: [
        { name: 'left', value: left },
        { name: 'right', value: right },
      ],
    });

    callStack.pop();
    path.pop();
    return val;
  };

  const answer = dfs(root, null, 'root');

  frames.push({
    anchor: 'ret',
    caption: `The call stack is empty. Maximum depth = ${answer}.`,
    callStack: [],
    path: [],
    returns: { ...returns },
    active: root ? root.id : null,
    aux: null,
    vars: [],
    result: answer,
    flash: 'done',
    returning: null,
    nullSlot: null,
  });

  return { frames, answer };
}

/* ------------------------------------------------------------------ */
/* 2. Iterative DFS (explicit stack of [node, depth])                  */
/* ------------------------------------------------------------------ */

const iterativeCode = {
  python: {
    source: `class Solution:
    def maxDepth(self, root: Optional[TreeNode]) -> int:
        stack = [[root, 1]]
        res = 0

        while stack:
            node, depth = stack.pop()

            if node:
                res = max(res, depth)
                stack.append([node.left, depth + 1])
                stack.append([node.right, depth + 1])

        return res`,
    anchors: {
      initStack: 3, initRes: 4, while: 6, pop: 7,
      ifNode: 9, max: 10, pushLeft: 11, pushRight: 12, ret: 14,
    },
  },
  javascript: {
    source: `var maxDepth = function(root) {
    const stack = [[root, 1]];
    let res = 0;

    while (stack.length > 0) {
        const [node, depth] = stack.pop();

        if (node !== null) {
            res = Math.max(res, depth);
            stack.push([node.left, depth + 1]);
            stack.push([node.right, depth + 1]);
        }
    }

    return res;
};`,
    anchors: {
      initStack: 2, initRes: 3, while: 5, pop: 6,
      ifNode: 8, max: 9, pushLeft: 10, pushRight: 11, ret: 15,
    },
  },
  java: {
    source: `class Solution {
    public int maxDepth(TreeNode root) {
        Deque<Pair<TreeNode, Integer>> stack = new ArrayDeque<>();
        stack.push(new Pair<>(root, 1));
        int res = 0;

        while (!stack.isEmpty()) {
            Pair<TreeNode, Integer> top = stack.pop();
            TreeNode node = top.getKey();
            int depth = top.getValue();

            if (node != null) {
                res = Math.max(res, depth);
                stack.push(new Pair<>(node.left, depth + 1));
                stack.push(new Pair<>(node.right, depth + 1));
            }
        }

        return res;
    }
}`,
    anchors: {
      initStack: 4, initRes: 5, while: 7, pop: 8,
      ifNode: 12, max: 13, pushLeft: 14, pushRight: 15, ret: 19,
    },
  },
  cpp: {
    source: `class Solution {
public:
    int maxDepth(TreeNode* root) {
        stack<pair<TreeNode*, int>> st;
        st.push({root, 1});
        int res = 0;

        while (!st.empty()) {
            auto [node, depth] = st.top();
            st.pop();

            if (node != nullptr) {
                res = max(res, depth);
                st.push({node->left, depth + 1});
                st.push({node->right, depth + 1});
            }
        }

        return res;
    }
};`,
    anchors: {
      initStack: 5, initRes: 6, while: 8, pop: 9,
      ifNode: 12, max: 13, pushLeft: 14, pushRight: 15, ret: 19,
    },
  },
};

const labelOf = (node, depth) => `[${node ? node.val : 'null'}, ${depth}]`;

function iterativeFrames(root) {
  const frames = [];
  const stack = [{ node: root, depth: 1 }];
  const seen = [];
  const depths = {};
  let res = 0;

  const auxItems = () =>
    stack.map((e, i) => ({
      key: `${i}-${e.node ? e.node.id : 'n'}-${e.depth}`,
      label: labelOf(e.node, e.depth),
      nodeId: e.node ? e.node.id : null,
      depth: e.depth,
      isNull: !e.node,
    }));

  const snap = (anchor, caption, extra = {}) => {
    frames.push({
      anchor,
      caption,
      callStack: null,
      path: [...seen],
      returns: { ...depths },
      active: extra.active ?? null,
      aux: { kind: 'stack', title: 'STACK  (bottom → top)', items: auxItems() },
      vars: [
        { name: 'res', value: res },
        ...(extra.vars ?? []),
      ],
      result: extra.result ?? null,
      flash: extra.flash ?? null,
      returning: null,
    });
  };

  snap('initStack', `Seed the stack with the root paired with depth 1.`, {
    active: root ? root.id : null,
  });
  snap('initRes', `res tracks the deepest depth seen so far. Start at 0.`, {});

  let guard = 0;
  while (stack.length > 0 && guard++ < 5000) {
    snap('while', `Stack is not empty (${stack.length} item${stack.length === 1 ? '' : 's'}) — keep looping.`, {});

    const { node, depth } = stack.pop();
    snap('pop', `Pop ${labelOf(node, depth)} off the top.`, {
      active: node ? node.id : null,
      vars: [{ name: 'depth', value: depth }],
      flash: 'pop',
    });

    if (node) {
      snap('ifNode', `Node ${node.val} is real, so it counts.`, {
        active: node.id,
        vars: [{ name: 'depth', value: depth }],
      });

      const before = res;
      res = Math.max(res, depth);
      depths[node.id] = depth;
      if (!seen.includes(node.id)) seen.push(node.id);
      snap(
        'max',
        before === res
          ? `max(${before}, ${depth}) = ${res} — no improvement.`
          : `max(${before}, ${depth}) = ${res} — new deepest level.`,
        { active: node.id, vars: [{ name: 'depth', value: depth }], flash: before === res ? null : 'best' }
      );

      stack.push({ node: node.left, depth: depth + 1 });
      snap('pushLeft', `Push the left child ${labelOf(node.left, depth + 1)}.`, {
        active: node.id,
        vars: [{ name: 'depth', value: depth }],
      });

      stack.push({ node: node.right, depth: depth + 1 });
      snap('pushRight', `Push the right child ${labelOf(node.right, depth + 1)}.`, {
        active: node.id,
        vars: [{ name: 'depth', value: depth }],
      });
    } else {
      snap('ifNode', `It's null — nothing to record, nothing to push. Skip.`, {});
    }
  }

  snap('while', `Stack is empty. The loop ends.`, {});
  frames.push({
    anchor: 'ret',
    caption: `Return res = ${res}. That's the maximum depth.`,
    callStack: null,
    path: [...seen],
    returns: { ...depths },
    active: null,
    aux: { kind: 'stack', title: 'STACK  (bottom → top)', items: [] },
    vars: [{ name: 'res', value: res }],
    result: res,
    flash: 'done',
    returning: null,
  });

  return { frames, answer: res };
}

/* ------------------------------------------------------------------ */
/* 3. BFS — level order                                                */
/* ------------------------------------------------------------------ */

const bfsCode = {
  python: {
    source: `class Solution:
    def maxDepth(self, root: Optional[TreeNode]) -> int:
        if not root:
            return 0

        q = deque([root])
        level = 0

        while q:
            for _ in range(len(q)):
                node = q.popleft()
                if node.left:
                    q.append(node.left)
                if node.right:
                    q.append(node.right)
            level += 1

        return level`,
    anchors: {
      guard: 3, retZero: 4, initQ: 6, initLevel: 7, while: 9,
      forLevel: 10, popleft: 11, pushLeft: 13, pushRight: 15, inc: 16, ret: 18,
    },
  },
  javascript: {
    source: `var maxDepth = function(root) {
    if (root === null) {
        return 0;
    }

    const q = [root];
    let level = 0;

    while (q.length > 0) {
        let size = q.length;
        for (let i = 0; i < size; i++) {
            const node = q.shift();
            if (node.left) q.push(node.left);
            if (node.right) q.push(node.right);
        }
        level++;
    }

    return level;
};`,
    anchors: {
      guard: 2, retZero: 3, initQ: 6, initLevel: 7, while: 9,
      forLevel: 11, popleft: 12, pushLeft: 13, pushRight: 14, inc: 16, ret: 19,
    },
  },
  java: {
    source: `class Solution {
    public int maxDepth(TreeNode root) {
        if (root == null) {
            return 0;
        }

        Queue<TreeNode> q = new LinkedList<>();
        q.add(root);
        int level = 0;

        while (!q.isEmpty()) {
            int size = q.size();
            for (int i = 0; i < size; i++) {
                TreeNode node = q.poll();
                if (node.left != null) q.add(node.left);
                if (node.right != null) q.add(node.right);
            }
            level++;
        }

        return level;
    }
}`,
    anchors: {
      guard: 3, retZero: 4, initQ: 8, initLevel: 9, while: 11,
      forLevel: 13, popleft: 14, pushLeft: 15, pushRight: 16, inc: 18, ret: 21,
    },
  },
  cpp: {
    source: `class Solution {
public:
    int maxDepth(TreeNode* root) {
        if (root == nullptr) {
            return 0;
        }

        queue<TreeNode*> q;
        q.push(root);
        int level = 0;

        while (!q.empty()) {
            int size = q.size();
            for (int i = 0; i < size; i++) {
                TreeNode* node = q.front();
                q.pop();
                if (node->left) q.push(node->left);
                if (node->right) q.push(node->right);
            }
            level++;
        }

        return level;
    }
};`,
    anchors: {
      guard: 4, retZero: 5, initQ: 9, initLevel: 10, while: 12,
      forLevel: 14, popleft: 15, pushLeft: 17, pushRight: 18, inc: 20, ret: 23,
    },
  },
};

function bfsFrames(root) {
  const frames = [];
  const seen = [];
  const depths = {};
  let queue = [];
  let level = 0;

  const auxItems = () =>
    queue.map((n, i) => ({
      key: `${i}-${n.id}`,
      label: String(n.val),
      nodeId: n.id,
      depth: null,
      isNull: false,
    }));

  const snap = (anchor, caption, extra = {}) => {
    frames.push({
      anchor,
      caption,
      callStack: null,
      path: [...seen],
      returns: { ...depths },
      active: extra.active ?? null,
      aux: { kind: 'queue', title: 'QUEUE  (front → back)', items: auxItems() },
      vars: [{ name: 'level', value: level }, ...(extra.vars ?? [])],
      result: extra.result ?? null,
      flash: extra.flash ?? null,
      returning: null,
      levelBand: extra.levelBand ?? null,
    });
  };

  if (!root) {
    snap('guard', `root is null.`, {});
    frames.push({
      anchor: 'retZero',
      caption: `Return 0 — an empty tree has depth 0.`,
      callStack: null, path: [], returns: {}, active: null,
      aux: { kind: 'queue', title: 'QUEUE  (front → back)', items: [] },
      vars: [], result: 0, flash: 'done', returning: null, levelBand: null,
    });
    return { frames, answer: 0 };
  }

  snap('guard', `root is not null, so we can start.`, { active: root.id });
  queue = [root];
  snap('initQ', `Put the root in the queue.`, { active: root.id });
  snap('initLevel', `level counts how many rows we have fully drained.`, {});

  let guard = 0;
  while (queue.length > 0 && guard++ < 5000) {
    snap('while', `Queue is not empty — there is another level to process.`, {});

    const size = queue.length;
    const rowVals = queue.map((n) => n.val).join(', ');
    snap('forLevel', `Snapshot the size (${size}). Everything in the queue right now — ${rowVals} — is exactly one level.`, {
      levelBand: level,
    });

    for (let i = 0; i < size; i++) {
      const node = queue.shift();
      depths[node.id] = level + 1;
      if (!seen.includes(node.id)) seen.push(node.id);
      snap('popleft', `Dequeue ${node.val}.`, { active: node.id, flash: 'pop', levelBand: level });

      if (node.left) {
        queue.push(node.left);
        snap('pushLeft', `Enqueue left child ${node.left.val} for the next level.`, {
          active: node.id, levelBand: level,
        });
      }
      if (node.right) {
        queue.push(node.right);
        snap('pushRight', `Enqueue right child ${node.right.val} for the next level.`, {
          active: node.id, levelBand: level,
        });
      }
    }

    level += 1;
    snap('inc', `That whole level is drained. level = ${level}.`, { flash: 'best' });
  }

  snap('while', `Queue is empty — no levels left.`, {});
  frames.push({
    anchor: 'ret',
    caption: `Return level = ${level}. Counting levels IS counting depth.`,
    callStack: null, path: [...seen], returns: { ...depths }, active: null,
    aux: { kind: 'queue', title: 'QUEUE  (front → back)', items: [] },
    vars: [{ name: 'level', value: level }],
    result: level, flash: 'done', returning: null, levelBand: null,
  });

  return { frames, answer: level };
}

/* ------------------------------------------------------------------ */

export const approaches = [
  {
    id: 'recursive',
    watchFor:
      'Watch the green badges appear bottom-up. Leaves first, root last — the answer is built on the way back UP.',
    name: 'Recursive DFS',
    tagline: 'The one-liner everyone should know cold.',
    idea:
      'The depth of a tree is 1 (for the current node) plus the deeper of its two subtrees. ' +
      'Write that sentence down and you have written the algorithm — the recursion carries the bookkeeping for you.',
    time: 'O(n)',
    space: 'O(h)',
    spaceNote: 'h = height of the tree. O(log n) if balanced, O(n) if it degenerates into a linked list.',
    stackPanel: 'call',
    code: recursiveCode,
    build: recursiveFrames,
  },
  {
    id: 'iterative',
    watchFor:
      'Watch the depth travel DOWN inside each stack pair — the opposite direction to the recursive tab.',
    name: 'Iterative DFS',
    tagline: 'Same traversal, but you own the stack.',
    idea:
      'Replace the hidden call stack with a real one. The trick is that each stack entry carries a pair — ' +
      '[node, depth] — so every node announces its own depth when it comes off the stack. res keeps the running max.',
    time: 'O(n)',
    space: 'O(h)',
    spaceNote: 'The explicit stack holds at most one root-to-leaf path plus siblings.',
    stackPanel: 'aux',
    code: iterativeCode,
    build: iterativeFrames,
  },
  {
    id: 'bfs',
    watchFor:
      'Watch the queue drain one full row at a time. The number of drains is the depth.',
    name: 'BFS / Level Order',
    tagline: 'Count the rows. The most reusable template of the three.',
    idea:
      'Process the tree one full row at a time. Snapshot the queue length before draining it and you know exactly ' +
      'where each level ends — so the number of drains is the depth. This is the template that also solves minimum depth, ' +
      'right-side view, level averages, and zigzag order.',
    time: 'O(n)',
    space: 'O(w)',
    spaceNote: 'w = maximum width of the tree, up to n/2 for the bottom row of a full tree.',
    stackPanel: 'aux',
    code: bfsCode,
    build: bfsFrames,
  },
];

export const approachById = (id) => approaches.find((a) => a.id === id) || approaches[0];

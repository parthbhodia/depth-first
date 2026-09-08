/**
 * tree.js — binary tree construction + layout.
 * Zero dependencies. Works in the browser and in Node.
 */

/**
 * Build a binary tree from LeetCode level-order array notation.
 * e.g. [3, 9, 20, null, null, 15, 7]
 * Returns the root node, or null for an empty tree.
 *
 * Each node: { id, val, left, right, depth }
 */
export function fromLevelOrder(values) {
  if (!values || values.length === 0 || values[0] === null || values[0] === undefined) {
    return null;
  }

  let nextId = 0;
  const makeNode = (val) => ({ id: nextId++, val, left: null, right: null, depth: 0 });

  const root = makeNode(values[0]);
  const queue = [root];
  let i = 1;

  while (queue.length > 0 && i < values.length) {
    const node = queue.shift();

    if (i < values.length) {
      const v = values[i++];
      if (v !== null && v !== undefined) {
        node.left = makeNode(v);
        node.left.depth = node.depth + 1;
        queue.push(node.left);
      }
    }

    if (i < values.length) {
      const v = values[i++];
      if (v !== null && v !== undefined) {
        node.right = makeNode(v);
        node.right.depth = node.depth + 1;
        queue.push(node.right);
      }
    }
  }

  return root;
}

/** Parse a user-typed string like "[3,9,20,null,null,15,7]" into an array. */
export function parseInput(text) {
  const cleaned = String(text).trim().replace(/^\[/, '').replace(/\]$/, '').trim();
  if (cleaned === '') return [];
  return cleaned.split(',').map((raw) => {
    const t = raw.trim().toLowerCase();
    if (t === 'null' || t === 'n' || t === '#' || t === '') return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  });
}

/** Flatten a tree into an array of nodes (preorder). */
export function collectNodes(root) {
  const out = [];
  const walk = (n) => {
    if (!n) return;
    out.push(n);
    walk(n.left);
    walk(n.right);
  };
  walk(root);
  return out;
}

/**
 * Tidy layout: leaves get sequential horizontal slots, parents are centred
 * over their children. Produces the classic, non-overlapping tree picture.
 *
 * Returns { nodes: [{id, val, x, y, depth}], edges: [{from, to, side}], width, height }
 */
export function layout(root, opts = {}) {
  const xGap = opts.xGap ?? 78;
  const yGap = opts.yGap ?? 92;
  const padX = opts.padX ?? 46;
  const padY = opts.padY ?? 42;

  const positions = new Map();
  let slot = 0;
  let maxDepth = 0;

  const assign = (node, depth) => {
    if (!node) return null;
    maxDepth = Math.max(maxDepth, depth);
    const leftX = assign(node.left, depth + 1);
    const myLeafSlot = slot;
    const rightX = assign(node.right, depth + 1);

    let x;
    if (leftX !== null && rightX !== null) {
      x = (leftX + rightX) / 2;
    } else if (leftX !== null) {
      // Only-left child: offset the parent slightly right of the child.
      x = leftX + 0.5;
    } else if (rightX !== null) {
      x = rightX - 0.5;
    } else {
      x = myLeafSlot;
      slot += 1;
    }

    positions.set(node.id, { x, y: depth });
    return x;
  };

  assign(root, 0);

  // Normalise so the leftmost column sits at 0.
  let minX = Infinity;
  let maxX = -Infinity;
  for (const p of positions.values()) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
  }
  if (!Number.isFinite(minX)) {
    minX = 0;
    maxX = 0;
  }

  const nodes = [];
  const edges = [];

  const walk = (node) => {
    if (!node) return;
    const p = positions.get(node.id);
    nodes.push({
      id: node.id,
      val: node.val,
      depth: p.y,
      x: padX + (p.x - minX) * xGap,
      y: padY + p.y * yGap,
    });
    if (node.left) {
      edges.push({ from: node.id, to: node.left.id, side: 'left' });
      walk(node.left);
    }
    if (node.right) {
      edges.push({ from: node.id, to: node.right.id, side: 'right' });
      walk(node.right);
    }
  };
  walk(root);

  const byId = new Map(nodes.map((n) => [n.id, n]));

  return {
    nodes,
    edges,
    byId,
    width: padX * 2 + (maxX - minX) * xGap,
    height: padY * 2 + maxDepth * yGap,
  };
}

/** Geometry the canvas and the layout must agree on. */
export const LAYOUT = { xGap: 94, yGap: 106, nodeR: 24, padX: 46, padY: 42 };

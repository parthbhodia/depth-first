/**
 * calltree.js — layout for a tree of function CALLS.
 *
 * Different problem from tree.js. There the tree is the input and it is fully
 * known up front. Here the tree is the *execution*: it comes into existence as
 * the algorithm runs, and how much of it exists is the whole point of the
 * animation (naive recursion explodes; memoisation prunes it).
 *
 * The trick that makes it watchable: every approach records the complete list
 * of calls it will ever make, and layout runs ONCE over that list. Frames then
 * reveal nodes by changing their state. Nothing moves mid-animation — if the
 * geometry re-flowed on every call the viewer would lose their place.
 */

const NODE_W = 74;
const NODE_H = 28;

export const CALL_LAYOUT = {
  xGap: 84,
  yGap: 76,
  padX: 46,
  padY: 26,
  nodeW: NODE_W,
  nodeH: NODE_H,
};

/**
 * @param nodes [{ id, parentId, key, label, depth }] in creation order
 * @returns { nodes: [...+x,y], edges, byId, width, height, dupKeys:Set, keyCounts }
 */
export function layoutCallTree(nodes, opts = {}) {
  const o = { ...CALL_LAYOUT, ...opts };

  if (!nodes || !nodes.length) {
    return {
      nodes: [], edges: [], byId: new Map(),
      width: 100, height: 60, dupKeys: new Set(), keyCounts: {},
    };
  }

  const kids = new Map();
  let rootId = null;
  for (const n of nodes) {
    if (n.parentId === null || n.parentId === undefined) rootId = n.id;
    else {
      if (!kids.has(n.parentId)) kids.set(n.parentId, []);
      kids.get(n.parentId).push(n.id);
    }
  }

  const byIdRaw = new Map(nodes.map((n) => [n.id, n]));

  // Which subproblems are solved more than once? That repetition IS the lesson.
  const keyCounts = {};
  for (const n of nodes) keyCounts[n.key] = (keyCounts[n.key] || 0) + 1;
  const dupKeys = new Set(Object.keys(keyCounts).filter((k) => keyCounts[k] > 1));

  // Leaves take the next slot; a parent centres over its children.
  const pos = new Map();
  let slot = 0;
  let maxDepth = 0;

  const assign = (id) => {
    const node = byIdRaw.get(id);
    maxDepth = Math.max(maxDepth, node.depth);
    const children = kids.get(id) || [];
    if (!children.length) {
      const x = slot;
      slot += 1;
      pos.set(id, x);
      return x;
    }
    const xs = children.map(assign);
    const x = (xs[0] + xs[xs.length - 1]) / 2;
    pos.set(id, x);
    return x;
  };
  assign(rootId);

  const out = nodes.map((n) => ({
    ...n,
    x: o.padX + pos.get(n.id) * o.xGap,
    y: o.padY + n.depth * o.yGap,
    dup: dupKeys.has(String(n.key)),
    dupCount: keyCounts[n.key] || 1,
    w: o.nodeW,
    h: o.nodeH,
  }));

  const byId = new Map(out.map((n) => [n.id, n]));
  const edges = [];
  for (const n of out) {
    if (n.parentId === null || n.parentId === undefined) continue;
    edges.push({ from: n.parentId, to: n.id });
  }

  return {
    nodes: out,
    edges,
    byId,
    width: o.padX * 2 + Math.max(0, slot - 1) * o.xGap,
    height: o.padY * 2 + maxDepth * o.yGap + o.nodeH,
    dupKeys,
    keyCounts,
  };
}

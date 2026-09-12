import { problems } from './index.js';

/**
 * The learning path, as a graph.
 *
 * Deliberately built from THIS site's own coverage plan rather than copying
 * anyone else's roadmap: two roots (trees and arrays/stacks) feeding the
 * families the site actually intends to trace. Nodes light up automatically as
 * problems land in the registry, so this never drifts out of date by hand.
 */
const NODES = [
  { id: 'trees', label: 'Trees & recursion', col: 0, row: 0,
    blurb: 'Where return values flow back up.',
    problems: [104, 1448, 110, 543, 111] },
  { id: 'arrays', label: 'Arrays & stacks', col: 0, row: 3,
    blurb: 'Pointers, windows, and the humble stack.',
    problems: [1, 121, 155] },

  { id: 'bfs', label: 'BFS / level order', col: 1, row: 0,
    blurb: 'One full row at a time.',
    problems: [102, 199] },
  { id: 'backtracking', label: 'Backtracking', col: 1, row: 1,
    blurb: 'Choose, explore, un-choose.',
    problems: [78, 90, 46, 39, 77, 22] },
  { id: 'dp1', label: '1-D dynamic programming', col: 1, row: 2,
    blurb: 'Recursion → memo → table.',
    problems: [70, 746, 198, 322] },
  { id: 'monostack', label: 'Monotonic stack', col: 1, row: 3,
    blurb: 'The non-obvious insight nobody derives cold.',
    problems: [739, 84] },

  { id: 'graphs', label: 'Graphs', col: 2, row: 0,
    blurb: 'Grids and adjacency lists are the same thing.',
    problems: [200, 207, 133] },
  { id: 'dp2', label: '2-D dynamic programming', col: 2, row: 2,
    blurb: 'Two things vary, so the table grows a dimension.',
    problems: [62, 1143] },

  { id: 'unionfind', label: 'Union-Find', col: 3, row: 0,
    blurb: 'Path compression, flattening as you watch.',
    problems: [547, 721] },
  { id: 'advanced', label: 'Segment tree & BIT', col: 3, row: 1,
    blurb: 'Rare elsewhere, real at Google.',
    problems: [307, 2158] },
];

const EDGES = [
  ['trees', 'bfs'], ['trees', 'backtracking'], ['trees', 'dp1'],
  ['arrays', 'monostack'], ['arrays', 'dp1'],
  ['bfs', 'graphs'],
  ['graphs', 'unionfind'], ['graphs', 'advanced'],
  ['dp1', 'dp2'],
];

export const COL_GAP = 262;
export const ROW_GAP = 146;
export const NODE_W = 212;
export const NODE_H = 114;
const PAD = 14;

/** Nodes annotated with which of their problems actually exist on the site. */
export function roadmap() {
  const bySlugNumber = new Map(problems.map((p) => [p.number, p]));

  const nodes = NODES.map((n) => {
    const live = n.problems.map((num) => bySlugNumber.get(num)).filter(Boolean);
    return {
      ...n,
      live,
      traced: live.length,
      total: n.problems.length,
      ready: live.length > 0,
      x: PAD + n.col * COL_GAP,
      y: PAD + n.row * ROW_GAP,
      w: NODE_W,
      h: NODE_H,
    };
  });

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const edges = EDGES
    .map(([a, b]) => ({ from: byId.get(a), to: byId.get(b) }))
    .filter((e) => e.from && e.to);

  const maxCol = Math.max(...nodes.map((n) => n.col));
  const maxRow = Math.max(...nodes.map((n) => n.row));

  return {
    nodes,
    edges,
    width: PAD * 2 + maxCol * COL_GAP + NODE_W,
    height: PAD * 2 + maxRow * ROW_GAP + NODE_H,
    tracedCount: problems.length,
    totalCount: NODES.reduce((a, n) => a + n.problems.length, 0),
  };
}

/** Where a newcomer should begin: the first node with something to watch. */
export const startHere = () => {
  const r = roadmap();
  const first = r.nodes.find((n) => n.ready);
  return first ? first.live[0] : null;
};

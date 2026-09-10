/**
 * ring.js — hashing onto a ring, and the geometry to draw it.
 * Zero dependencies. Works in the browser and in Node.
 *
 * Two spaces, kept deliberately separate:
 *   - the HASH space is the full 2^32, exactly like a real system. All
 *     ownership and load maths happen here, so virtual nodes behave the way
 *     they actually do in production (more replicas → more even load).
 *   - the DRAW space is 0–360°, a scaled-down shadow of the hash space used
 *     only to place things on the SVG circle.
 *
 * An earlier version hashed straight into 360 slots. It made the picture and
 * the number match, but it quietly broke the whole lesson: with a few hundred
 * virtual nodes crammed into 360 slots, load got *worse*, not better. The site
 * exists to not do that. So the number a viewer reads is the degree; the maths
 * underneath runs at full resolution.
 */

export const SPACE = 0x100000000; // 2^32
export const DEG = 360;

/**
 * FNV-1a for the bytes, then MurmurHash3's fmix32 finalizer for avalanche.
 * The finalizer matters here specifically: virtual nodes hash "name#0",
 * "name#1", … which differ in one low byte. Plain FNV-1a leaves those
 * correlated, so the replicas clump on the ring and load stays lumpy — the
 * exact opposite of what virtual nodes are supposed to buy you. fmix32
 * decorrelates them, which is why production rings use a hash with real
 * avalanche (MD5/SHA/murmur) rather than a raw multiplicative one.
 */
export function hashPos(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}

/** Position → degrees clockwise from the top, for drawing only. */
export const toDeg = (pos) => (pos / SPACE) * DEG;

/** A name's ring position (full resolution) and its drawing angle. */
export const onRing = (name) => hashPos(name);
export const angleOf = (name) => toDeg(hashPos(name));

/** A server's j-th virtual node. Real systems hash "name#j" exactly like this. */
export const vnodeName = (serverId, j) => `${serverId}#${j}`;

export const RING = {
  r: 150,
  cx: 200,
  cy: 200,
  serverR: 15,
  vnodeR: 6,
  keyR: 7,
  keyInset: 32, // keys orbit inside the ring so they never sit on a server
  width: 400,
  height: 400,
};

/** Degrees clockwise from 12 o'clock → SVG coordinates. */
export function pointAt(deg, radius) {
  const t = ((deg - 90) * Math.PI) / 180;
  return { x: RING.cx + radius * Math.cos(t), y: RING.cy + radius * Math.sin(t) };
}

/**
 * Build the placed nodes for a set of servers, sorted by ring position.
 * replicas = 1 gives plain consistent hashing; more gives virtual nodes.
 * Each node carries both `pos` (full resolution, for ownership) and `angle`
 * (degrees, for drawing).
 */
export function placeServers(serverIds, replicas = 1) {
  const nodes = [];
  for (const id of serverIds) {
    for (let j = 0; j < replicas; j += 1) {
      const name = replicas === 1 ? id : vnodeName(id, j);
      const pos = hashPos(name);
      nodes.push({
        key: name,
        server: id,
        replica: j,
        pos,
        angle: toDeg(pos),
        virtual: replicas > 1,
      });
    }
  }
  return nodes.sort((a, b) => a.pos - b.pos || a.key.localeCompare(b.key));
}

/** Place keys with the same two-space treatment. */
export function placeKeys(keyIds) {
  return keyIds.map((id) => {
    const pos = hashPos(id);
    return { id, label: id, pos, angle: toDeg(pos) };
  });
}

/**
 * Walk clockwise from a position to the first server node at or after it,
 * wrapping past the top back to the first. This wrap IS the ring.
 */
export function ownerOf(pos, placed) {
  if (!placed.length) return null;
  for (const n of placed) {
    if (n.pos >= pos) return n;
  }
  return placed[0];
}

/** Assign every key. Returns { byKey, load } — load counts keys per SERVER. */
export function assign(keys, placed) {
  const byKey = new Map();
  const load = new Map();
  for (const k of keys) {
    const node = ownerOf(k.pos, placed);
    byKey.set(k.id, node);
    if (node) load.set(node.server, (load.get(node.server) || 0) + 1);
  }
  return { byKey, load };
}

/** Modulo assignment — the naive baseline the ring exists to replace. */
export function assignModulo(keys, serverIds) {
  const byKey = new Map();
  const load = new Map();
  for (const k of keys) {
    const id = serverIds[k.pos % serverIds.length];
    byKey.set(k.id, id);
    load.set(id, (load.get(id) || 0) + 1);
  }
  return { byKey, load };
}

/** How many assignments differ between two maps of keyId → owner id. */
export function countMoved(before, after, keys) {
  let moved = 0;
  const movedIds = [];
  for (const k of keys) {
    if (before.get(k.id) !== after.get(k.id)) {
      moved += 1;
      movedIds.push(k.id);
    }
  }
  return { moved, movedIds };
}

/**
 * Spread of load, as a percentage: how far the most-loaded server sits above
 * its fair share. 0% is perfectly even. This is the number virtual nodes exist
 * to shrink, and it only shrinks reliably over many keys.
 */
export function spread(load, serverIds, total) {
  if (!serverIds.length || !total) return 0;
  const ideal = total / serverIds.length;
  let worst = 0;
  for (const id of serverIds) {
    worst = Math.max(worst, (load.get(id) || 0) - ideal);
  }
  return Math.round((worst / ideal) * 100);
}

/**
 * Simulate load balance over `n` synthetic keys for a replica count.
 * Used to state the virtual-node payoff honestly, over a real sample rather
 * than the dozen keys the picture can hold.
 */
export function simulateSpread(serverIds, replicas, n = 10000) {
  const placed = placeServers(serverIds, replicas);
  const load = new Map();
  for (let i = 0; i < n; i += 1) {
    const node = ownerOf(hashPos(`sim:${i}`), placed);
    if (node) load.set(node.server, (load.get(node.server) || 0) + 1);
  }
  return { load, spread: spread(load, serverIds, n) };
}

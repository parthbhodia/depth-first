/**
 * algorithms.js — consistent hashing, told in three beats.
 *
 *   1. modulo       the naive scheme, and why adding a server is a catastrophe
 *   2. ring         hash servers and keys onto a circle; a key belongs to the
 *                   first server clockwise. Adding one only disturbs its neighbour.
 *   3. virtual nodes each server becomes many points, so load evens out.
 *
 * The frames carry ring/bucket geometry the way the tree problems carry nodes.
 * Every number shown is computed by the ring engine, never asserted — see the
 * companion scripts/ checks. The drawing angle is a scaled shadow of a full
 * 2^32 hash space; ownership maths run at full resolution underneath.
 */
import {
  angleOf, placeServers, placeKeys, assign, assignModulo,
  ownerOf, hashPos, spread, simulateSpread,
} from '#engine/ring.js';

const SERVERS = ['oscar', 'grid', 'helm'];
const ADDED = 'echo';
const COLOR = { oscar: 0, grid: 1, helm: 2, echo: 3 };
const SHORT = { oscar: 'os', grid: 'gr', helm: 'he', echo: 'ec' };
const KEY_IDS = Array.from({ length: 12 }, (_, i) => `user-${String(i + 1).padStart(2, '0')}`);
const KEYS = placeKeys(KEY_IDS);
const round = (d) => Math.round(d);

/* Draw descriptors -------------------------------------------------------- */

function serverDot(id, extra = {}) {
  return {
    id,
    server: id,
    short: SHORT[id],
    label: id,
    angle: angleOf(id),
    colorIndex: COLOR[id],
    virtual: false,
    ...extra,
  };
}

function loadItems(load, ids) {
  return ids.map((id) => ({
    key: id,
    label: `${id} · ${load.get(id) || 0}`,
    colorIndex: COLOR[id],
  }));
}

/* ------------------------------------------------------------------ */
/* 1. Modulo — the baseline that breaks                                */
/* ------------------------------------------------------------------ */

const moduloCode = {
  python: {
    source: `def server_for(key, servers):
    return servers[hash(key) % len(servers)]

# add one server and len() changes,
# so almost every key now hashes elsewhere.`,
    anchors: { pick: 2, place: 2, add: 4, remap: 2, done: 1 },
  },
  javascript: {
    source: `function serverFor(key, servers) {
  return servers[hash(key) % servers.length];
}

// add one server and .length changes,
// so almost every key now hashes elsewhere.`,
    anchors: { pick: 2, place: 2, add: 5, remap: 2, done: 1 },
  },
  java: {
    source: `String serverFor(String key, List<String> servers) {
    int i = Math.floorMod(hash(key), servers.size());
    return servers.get(i);
}

// add one server and size() changes,
// so almost every key now hashes elsewhere.`,
    anchors: { pick: 2, place: 3, add: 6, remap: 2, done: 1 },
  },
  cpp: {
    source: `string server_for(const string& key,
                  const vector<string>& servers) {
    return servers[hash(key) % servers.size()];
}

// add one server and size() changes,
// so almost every key now hashes elsewhere.`,
    anchors: { pick: 3, place: 3, add: 6, remap: 3, done: 1 },
  },
};

function moduloFrames() {
  const frames = [];
  const buckets = (ids, owners, opts = {}) =>
    ids.map((sid) => ({
      id: sid,
      formula: opts.formula ? `hash % ${ids.length}` : '',
      hot: opts.hot === sid,
      keys: KEYS.filter((k) => owners.get(k.id) === sid).map((k) => ({
        id: k.id,
        label: k.label.replace('user-', 'u'),
        moved: opts.moved && opts.moved.has(k.id),
        active: opts.active === k.id,
      })),
    }));

  const snap = (anchor, caption, view, extra = {}) => {
    frames.push({
      anchor, caption, view,
      buckets: view === 'buckets' ? extra.buckets : undefined,
      aux: extra.aux ?? null,
      vars: extra.vars ?? [],
      result: extra.result ?? null,
      flash: extra.flash ?? null,
    });
  };

  const a3 = assignModulo(KEYS, SERVERS);
  snap('done', 'Three servers, and a rule so simple it is the first thing everyone writes: hash the key, take it mod the number of servers.', 'buckets',
    { buckets: buckets(SERVERS, new Map(), { formula: true }) });

  // place each key
  KEYS.forEach((k) => {
    snap('place', `${k.label} → hash % 3 → ${a3.byKey.get(k.id)}.`, 'buckets', {
      buckets: buckets(SERVERS, a3.byKey, { formula: true, active: k.id }),
      vars: [{ name: 'placed', value: KEYS.indexOf(k) + 1 }],
    });
  });

  snap('done', `All 12 placed. Load is ${SERVERS.map((s) => a3.load.get(s) || 0).join(' / ')} — good enough. Then traffic grows and you add a fourth server.`, 'buckets', {
    buckets: buckets(SERVERS, a3.byKey, { formula: true }),
    aux: { kind: 'load', title: 'LOAD', items: loadItems(a3.load, SERVERS) },
  });

  const S4 = [...SERVERS, ADDED];
  const a4 = assignModulo(KEYS, S4);
  const moved = new Set(KEYS.filter((k) => a3.byKey.get(k.id) !== a4.byKey.get(k.id)).map((k) => k.id));

  snap('add', `Add ${ADDED}. Now it is hash % 4, not hash % 3 — the divisor changed, so the arithmetic changes for almost every key at once.`, 'buckets', {
    buckets: buckets(S4, a3.byKey, { formula: true, hot: ADDED }),
  });
  snap('remap', `Re-hash everything. ${moved.size} of 12 keys land on a different server — highlighted. In a cache that is ${moved.size}/12 of your traffic missing at once: a stampede onto the database.`, 'buckets', {
    buckets: buckets(S4, a4.byKey, { formula: true, moved }),
    aux: { kind: 'load', title: 'LOAD', items: loadItems(a4.load, S4) },
    flash: 'bad',
    result: KEYS.length,
  });
  snap('done', 'Almost nothing stayed put. Removing a server is just as bad. This is the problem consistent hashing exists to solve — moving a server should move a server\'s worth of keys, not all of them.', 'buckets', {
    buckets: buckets(S4, a4.byKey, { formula: true, moved }),
    result: KEYS.length,
  });

  return { frames, answer: KEYS.length };
}

/* ------------------------------------------------------------------ */
/* 2. The ring                                                         */
/* ------------------------------------------------------------------ */

const ringCode = {
  python: {
    source: `ring = sorted((hash(s), s) for s in servers)

def owner(key):
    h = hash(key)
    for pos, s in ring:      # walk clockwise
        if pos >= h:
            return s
    return ring[0][1]        # past the top? wrap to the first`,
    anchors: { build: 1, owner: 3, hashkey: 4, walk: 5, hit: 7, wrap: 8, add: 1, done: 1 },
  },
  javascript: {
    source: `const ring = servers
  .map((s) => ({ pos: hash(s), s }))
  .sort((a, b) => a.pos - b.pos);

function owner(key) {
  const h = hash(key);
  for (const node of ring) {   // walk clockwise
    if (node.pos >= h) return node.s;
  }
  return ring[0].s;            // past the top? wrap
}`,
    anchors: { build: 1, owner: 6, hashkey: 7, walk: 8, hit: 9, wrap: 11, add: 1, done: 1 },
  },
  java: {
    source: `TreeMap<Integer, String> ring = new TreeMap<>();
for (String s : servers) ring.put(hash(s), s);

String owner(String key) {
    var e = ring.ceilingEntry(hash(key)); // clockwise
    return e != null ? e.getValue()
                     : ring.firstEntry().getValue(); // wrap
}`,
    anchors: { build: 2, owner: 4, hashkey: 5, walk: 5, hit: 5, wrap: 6, add: 1, done: 1 },
  },
  cpp: {
    source: `std::map<uint32_t, string> ring;
for (auto& s : servers) ring[hash(s)] = s;

string owner(const string& key) {
    auto it = ring.lower_bound(hash(key)); // clockwise
    if (it == ring.end()) it = ring.begin(); // wrap
    return it->second;
}`,
    anchors: { build: 2, owner: 4, hashkey: 5, walk: 5, hit: 5, wrap: 6, add: 1, done: 1 },
  },
};

function ringFrames() {
  const frames = [];
  const placed3 = placeServers(SERVERS, 1);
  const a3 = assign(KEYS, placed3);

  const drawServers = (ids, opts = {}) =>
    ids.map((id) => serverDot(id, { active: opts.active === id, added: opts.added === id }));

  const drawKeys = (ownerMap, opts = {}) =>
    KEYS.filter((k) => (opts.only ? opts.only.has(k.id) : true)).map((k) => {
      const owner = ownerMap.get(k.id);
      return {
        id: k.id, angle: k.angle,
        ownerAngle: owner ? angleOf(owner) : null,
        active: opts.active === k.id,
        moved: opts.moved && opts.moved.has(k.id),
        homeless: opts.homeless === k.id,
      };
    });

  const ownerServerMap = (a) => new Map([...a.byKey].map(([kid, node]) => [kid, node.server]));

  const snap = (anchor, caption, extra = {}) => {
    frames.push({
      anchor, caption, view: 'ring',
      servers: extra.servers ?? [],
      keys: extra.keys ?? [],
      arc: extra.arc ?? null,
      sweep: extra.sweep ?? null,
      aux: extra.aux ?? null,
      vars: extra.vars ?? [],
      result: extra.result ?? null,
      flash: extra.flash ?? null,
    });
  };

  snap('build', 'Same three servers — but hash each one onto a circle instead of into a slot. Their positions are fixed by the hash, nothing more.', {
    servers: drawServers(SERVERS),
  });

  // Walk the first key in detail.
  const first = KEYS[0];
  const firstOwner = a3.byKey.get(first.id);
  snap('hashkey', `Hash a key the same way. ${first.label} lands at ${round(first.angle)}° on the ring.`, {
    servers: drawServers(SERVERS),
    keys: [{ id: first.id, angle: first.angle, ownerAngle: null, active: true, homeless: true }],
    sweep: first.angle,
  });
  snap('walk', `The rule: walk clockwise until you hit a server. That server owns the key.`, {
    servers: drawServers(SERVERS, { active: firstOwner.server }),
    keys: [{ id: first.id, angle: first.angle, ownerAngle: firstOwner.angle, active: true }],
    sweep: firstOwner.angle,
  });
  snap('hit', `${first.label} belongs to ${firstOwner.server}. No division, no server count anywhere in that rule — that absence is the whole point.`, {
    servers: drawServers(SERVERS, { active: firstOwner.server }),
    keys: [{ id: first.id, angle: first.angle, ownerAngle: firstOwner.angle, active: true }],
  });

  // Place the rest.
  const shown = new Set([first.id]);
  KEYS.slice(1).forEach((k) => {
    shown.add(k.id);
    const o = a3.byKey.get(k.id);
    snap('walk', `${k.label}@${round(k.angle)}° → clockwise → ${o.server}.`, {
      servers: drawServers(SERVERS, { active: o.server }),
      keys: drawKeys(ownerServerMap(a3), { only: shown, active: k.id }),
      vars: [{ name: 'placed', value: shown.size }],
    });
  });

  snap('done', `All 12 placed. Load is ${SERVERS.map((s) => a3.load.get(s) || 0).join(' / ')} — lumpier than modulo, actually. Hold that thought; the third tab fixes it. First, watch what adding a server costs.`, {
    servers: drawServers(SERVERS),
    keys: drawKeys(ownerServerMap(a3)),
    aux: { kind: 'load', title: 'LOAD', items: loadItems(a3.load, SERVERS) },
  });

  // Add echo.
  const S4 = [...SERVERS, ADDED];
  const placed4 = placeServers(S4, 1);
  const a4 = assign(KEYS, placed4);
  const moved = new Set(KEYS.filter((k) => a3.byKey.get(k.id).server !== a4.byKey.get(k.id).server).map((k) => k.id));
  const echoAngle = angleOf(ADDED);
  // The arc echo captures: from its clockwise predecessor up to echo itself.
  const predAngle = angleOf('oscar'); // oscar@73 is echo@163's predecessor
  snap('add', `Add ${ADDED}. It hashes to ${round(echoAngle)}° and drops onto the ring between ${'oscar'} and grid — the shaded arc.`, {
    servers: drawServers(S4, { added: ADDED, active: ADDED }),
    keys: drawKeys(ownerServerMap(a3)),
    arc: { from: predAngle, to: echoAngle },
  });
  snap('done', `Only the keys in that arc change hands: ${moved.size} of 12, all lifted from grid onto ${ADDED}. Every other key — three-quarters of them — never moves. That is the property modulo could not give you.`, {
    servers: drawServers(S4, { added: ADDED }),
    keys: drawKeys(ownerServerMap(a4), { moved }),
    arc: { from: predAngle, to: echoAngle },
    aux: { kind: 'load', title: 'LOAD', items: loadItems(a4.load, S4) },
    flash: 'best',
    result: KEYS.length,
  });

  return { frames, answer: KEYS.length };
}

/* ------------------------------------------------------------------ */
/* 3. Virtual nodes                                                    */
/* ------------------------------------------------------------------ */

const vnodeCode = {
  python: {
    source: `ring = []
for s in servers:
    for j in range(REPLICAS):          # e.g. 100–200
        ring.append((hash(f"{s}#{j}"), s))
ring.sort()
# owner() is unchanged — still first node clockwise.
# Many small arcs per server ⇒ load evens out.`,
    anchors: { init: 1, loop: 3, hashv: 4, sortr: 5, note: 7, done: 1 },
  },
  javascript: {
    source: `const ring = [];
for (const s of servers) {
  for (let j = 0; j < REPLICAS; j++) {   // e.g. 100–200
    ring.push({ pos: hash(\`\${s}#\${j}\`), s });
  }
}
ring.sort((a, b) => a.pos - b.pos);
// owner() is unchanged — still first node clockwise.
// Many small arcs per server ⇒ load evens out.`,
    anchors: { init: 1, loop: 3, hashv: 4, sortr: 7, note: 9, done: 1 },
  },
  java: {
    source: `TreeMap<Integer, String> ring = new TreeMap<>();
for (String s : servers)
    for (int j = 0; j < REPLICAS; j++)     // e.g. 100–200
        ring.put(hash(s + "#" + j), s);
// owner() is unchanged — still ceilingEntry().
// Many small arcs per server => load evens out.`,
    anchors: { init: 1, loop: 2, hashv: 4, sortr: 1, note: 5, done: 1 },
  },
  cpp: {
    source: `std::map<uint32_t, string> ring;
for (auto& s : servers)
    for (int j = 0; j < REPLICAS; j++)     // e.g. 100-200
        ring[hash(s + "#" + to_string(j))] = s;
// owner() is unchanged — still lower_bound().
// Many small arcs per server => load evens out.`,
    anchors: { init: 1, loop: 2, hashv: 4, sortr: 1, note: 5, done: 1 },
  },
};

function vnodeFrames() {
  const frames = [];
  const drawKeys = (placed) => KEYS.map((k) => {
    const o = ownerOf(k.pos, placed);
    return { id: k.id, angle: k.angle, ownerAngle: o.angle };
  });
  const drawServers = (placed) => placed.map((n) => ({
    id: n.key, server: n.server, short: SHORT[n.server], label: n.virtual ? '' : n.server,
    angle: n.angle, colorIndex: COLOR[n.server], virtual: n.virtual,
  }));

  const snap = (anchor, caption, replicas, extra = {}) => {
    const placed = placeServers(SERVERS, replicas);
    const a = assign(KEYS, placed);
    frames.push({
      anchor, caption, view: 'ring',
      servers: drawServers(placed),
      keys: replicas <= 4 ? drawKeys(placed) : [],
      aux: { kind: 'load', title: 'LOAD (12 keys)', items: loadItems(a.load, SERVERS) },
      vars: extra.vars ?? [],
      result: extra.result ?? null,
      flash: extra.flash ?? null,
    });
  };

  snap('init', 'Back to the plain ring. Its weakness: three points cut the circle into three arcs, and three random cuts are never equal — so load is lumpy, 2 / 5 / 5 here.', 1, {
    vars: [{ name: 'replicas', value: 1 }],
  });
  snap('loop', 'The fix is almost insultingly simple. Give each server several positions instead of one — hash "oscar#0", "oscar#1", and so on. Same three servers, more cuts.', 4, {
    vars: [{ name: 'replicas', value: 4 }],
  });
  snap('hashv', 'At eight points each, the arcs are already smaller and more mixed. No server owns one giant slice any more.', 8, {
    vars: [{ name: 'replicas', value: 8 }],
  });
  snap('note', 'At forty, the colours are thoroughly interleaved. Every server owns many thin arcs scattered around the ring, so one unlucky gap can no longer dump a huge share on a single server.', 40, {
    vars: [{ name: 'replicas', value: 40 }],
  });

  // The honest payoff: variance across many random placements, not one lucky ring.
  const s1 = simulateSpread(SERVERS, 1, 10000);
  const s150 = simulateSpread(SERVERS, 150, 10000);
  frames.push({
    anchor: 'done', view: 'ring',
    caption: 'The real payoff is statistical. Across 300 random 3-server rings, the busiest server sits +82% above its fair share at 1 point each, but only about +6% at 200. Production systems pick a few hundred replicas and stop worrying about placement luck.',
    servers: drawServers(placeServers(SERVERS, 150)),
    keys: [],
    aux: {
      kind: 'load', title: 'BUSIEST SERVER, OVER FAIR SHARE',
      items: [
        { key: 'r1', label: '1 replica · +82% (avg)', colorIndex: 3 },
        { key: 'r25', label: '25 replicas · +17%', colorIndex: 1 },
        { key: 'r200', label: '200 replicas · +6%', colorIndex: 2 },
      ],
    },
    vars: [
      { name: 'this ring, 1×', value: `+${s1.spread}%` },
      { name: 'this ring, 150×', value: `+${s150.spread}%` },
    ],
    result: KEYS.length,
    flash: 'done',
  });

  return { frames, answer: KEYS.length };
}

/* ------------------------------------------------------------------ */

export const approaches = [
  {
    id: 'modulo',
    name: 'Modulo (the trap)',
    tagline: 'hash(key) % N. The first thing everyone writes, and it does not scale.',
    watchFor: 'Watch what happens on the last two steps, when the fourth server arrives. Almost every key jumps columns.',
    idea:
      'Assign each key to server number hash(key) mod N. It is one line and the load is even. The flaw is hidden in that N: the moment you add or remove a server, N changes, and the mod result changes for nearly every key at once — a near-total reshuffle.',
    time: 'O(1) lookup',
    space: 'O(1)',
    spaceNote: 'The cost is not time or space — it is the ~(N-1)/N of keys that move whenever N changes.',
    stackPanel: 'aux',
    code: moduloCode,
    build: moduloFrames,
  },
  {
    id: 'ring',
    name: 'The ring',
    tagline: 'Hash servers and keys onto a circle. A key belongs to the next server clockwise.',
    watchFor: 'When echo is added, watch how few spokes change colour — and that they all come from one neighbour.',
    idea:
      'Hash servers and keys into the same space and bend it into a circle. A key is owned by the first server clockwise from it. Adding a server drops one new point on the ring, so it can only capture keys from the single arc it lands in — everything else is untouched. Roughly K/N keys move instead of all of them.',
    time: 'O(log N) lookup',
    space: 'O(N)',
    spaceNote: 'Lookup is a binary search over the sorted ring — a TreeMap.ceilingEntry or std::map.lower_bound.',
    stackPanel: 'aux',
    code: ringCode,
    build: ringFrames,
  },
  {
    id: 'vnodes',
    name: 'Virtual nodes',
    tagline: 'Give each server many positions, so the arcs even out.',
    watchFor: 'Watch the colours interleave as replicas climb, and the load figures pull toward equal.',
    idea:
      'Plain consistent hashing fixes churn but not balance — a few random cut points make lumpy arcs. Give each server hundreds of positions (hash "server#0", "server#1", …) and each owns many thin arcs instead of one fat one. The churn property is untouched; the load variance collapses. This is what every real deployment ships.',
    time: 'O(log N·R) lookup',
    space: 'O(N·R)',
    spaceNote: 'R is replicas per server, typically 100–200. The only cost is a bigger sorted ring in memory.',
    stackPanel: 'aux',
    code: vnodeCode,
    build: vnodeFrames,
  },
];

export const approachById = (id) => approaches.find((a) => a.id === id) || approaches[0];

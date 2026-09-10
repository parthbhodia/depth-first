import { approaches, approachById } from './algorithms.js';

/**
 * Consistent hashing is a concept, not a LeetCode problem, so it wears the
 * problem contract lightly: the scenario is fixed, and the invariant the check
 * script verifies is simply that every key ends up owned by exactly one server
 * (answer = number of keys). That is a real property worth asserting — no key
 * is ever orphaned or double-counted — not a rubber stamp.
 */
export default {
  slug: 'consistent-hashing',
  number: null,
  kicker: 'System Design',
  title: 'Consistent Hashing',
  difficulty: 'Core',
  topics: ['System Design', 'Distributed Systems', 'Hashing', 'Sharding'],
  pattern: 'Distributing keys across servers',

  stage: 'ring',
  inputLabel: 'Scenario',
  parseInput: () => ({ keys: 12 }),
  reference: () => 12,
  checkInputs: ['default'],

  video: {
    // Verified via YouTube oEmbed: author_name "ByteByteGo".
    youtubeId: 'UF9Iqmg94tk',
    title: 'Consistent Hashing | Algorithms You Should Know #1',
    channel: 'ByteByteGo',
  },

  links: {
    leetcode: 'https://github.com/liquidslr/system-design-notes/tree/main/05.%20Consistent%20Hashing',
    neetcode: 'https://github.com/liquidslr/system-design-notes',
  },
  linkLabels: { leetcode: 'Notes (ch. 05)', neetcode: 'Full repo' },

  blurb:
    'How a distributed cache adds and removes servers without reshuffling almost every key. The idea behind Dynamo, Cassandra, and every sharded cache.',

  lede:
    'Chapter 5 of the system-design notes, made to run. Watch the naive scheme collapse when a server joins, then watch the ring move only the keys it has to — and virtual nodes even out the load. This is the one distributed-systems idea that comes up in almost every design interview.',

  statement: [
    'You are spreading millions of keys — cache entries, user sessions, shards of a table — across a pool of servers. Each key must map to exactly one server, and every client must agree on which.',
    'The hard part is not the steady state. It is what happens when a server is <strong>added or removed</strong>: how many keys have to move? With <code>hash(key) % N</code> the answer is almost all of them. Consistent hashing brings it down to roughly <code>K/N</code>.',
  ],

  examples: [
    { input: 'add a server (modulo)', output: '~(N−1)/N of all keys move' },
    { input: 'add a server (ring)', output: 'only one arc moves ≈ K/N keys' },
    { input: 'virtual nodes', output: 'load variance collapses' },
  ],

  constraints: [
    'Every key maps to exactly one server, and all clients compute the same mapping.',
    'Adding or removing one server should move O(K/N) keys, not O(K).',
    'Load should stay roughly even across servers without central coordination.',
  ],

  defaultInput: 'default',
  presets: [],

  badgeLabels: {},

  tour: [
    { focus: 'stage', approach: 'modulo', play: true,
      text: 'Start with the scheme everyone writes first: server = hash(key) % N. Play it, and watch the last two steps — adding one server relocates almost every key.' },
    { focus: 'stage', approach: 'ring', at: { anchor: 'walk' },
      text: 'The ring replaces division with geometry. Servers and keys hash onto one circle; a key belongs to the first server clockwise. No N in that rule anywhere.' },
    { focus: 'stage', approach: 'ring', play: true,
      text: 'Play it to the end. When echo is added it lands in one arc and steals only that arc — about a quarter of the keys, all from a single neighbour. Everything else stays put.' },
    { focus: 'stage', approach: 'vnodes', play: true,
      text: 'The ring fixes churn but not balance — three random cuts make lumpy arcs. Give each server many positions and the load evens out, with the churn property untouched.' },
    { focus: null, approach: 'ring',
      text: 'Churn from the ring, balance from virtual nodes. That two-sentence story is what an interviewer wants when they say "how would you shard this?"' },
  ],

  approaches,
  approachById,

  essay: [
    {
      kicker: 'Why modulo betrays you',
      figure: { approach: 'modulo', at: 'last', caption: 'hash % N after a fourth server joins. The highlighted keys — most of them — changed owner, purely because the divisor went from 3 to 4.' },
      heading: 'The divisor is the whole problem',
      html: `
        <p>The naive assignment is <code>server = hash(key) % N</code>. In the steady state it is perfect:
        one operation, even load, no bookkeeping. Every flaw it has is hidden inside that <code>N</code>.</p>
        <p>When you add the fourth server, <code>N</code> becomes 4, and <code>hash(key) % 4</code> bears almost
        no relationship to <code>hash(key) % 3</code>. It isn't that a few keys shift — the arithmetic changes
        for <strong>roughly (N−1)/N of every key at once</strong>. For a cache, that is most of your entries
        suddenly on the wrong node: a wall of misses, and the database wearing the whole load while the cache
        refills. The scheme works right up until the moment you need it to scale, which is the worst possible
        time to fail.</p>
      `,
    },
    {
      kicker: 'What the ring buys',
      figure: { approach: 'ring', at: 'last', caption: 'Adding echo. Only the shaded arc changes hands — four keys, all lifted from grid. Three-quarters of the ring never notices.' },
      heading: 'Move a server, move a server\'s worth of keys',
      html: `
        <p>Put the servers <em>and</em> the keys on the same circle, and let a key belong to the first server
        clockwise from it. The lookup rule now contains no server count at all — and that absence is exactly
        why adding a server is cheap. A new server is one new point on the ring. It can only take keys from the
        single arc it lands in, stealing them from <strong>one</strong> neighbour. Every other key keeps its
        owner.</p>
        <p>So instead of relocating (N−1)/N of everything, you relocate about <code>K/N</code> — one server's
        fair share. That is the property the whole idea exists for, and it is worth saying in exactly those
        terms in an interview: <em>"adding a node should cost one node's worth of movement, not a full
        reshuffle."</em> Lookup is a binary search over the sorted ring — <code>ceilingEntry</code> in a Java
        TreeMap, <code>lower_bound</code> in a C++ map — so it stays <code>O(log N)</code>.</p>
      `,
    },
    {
      kicker: 'The catch, and its fix',
      figure: { approach: 'vnodes', at: { anchor: 'note' }, caption: 'Each server given many positions. The colours interleave, so no single server owns one oversized arc.' },
      heading: 'Virtual nodes: balance without touching churn',
      html: `
        <p>The ring has a weakness the modulo scheme did not: with only a few points, the arcs are uneven, so
        load is lumpy — 2 / 5 / 5 in the demo, and a departing server dumps its <em>entire</em> arc on one
        unlucky neighbour. Both problems have the same cause: too few cut points.</p>
        <p>So make more. Give each server a few hundred positions on the ring — hash <code>"server#0"</code>,
        <code>"server#1"</code>, and so on. Each server now owns many thin arcs scattered around the circle
        instead of one fat one. Add or remove a server and its share is spread across, and gathered from, all
        the others a little at a time. The lookup code does not change at all.</p>
        <p>One honest caveat the picture can't show in twelve keys: balance is a statistical claim. Over a
        single ring you might get lucky or unlucky, but across many random placements the busiest server drops
        from roughly <strong>+82% above fair share at one point each to about +6% at two hundred</strong>.
        That is why production systems pick a few hundred replicas and stop thinking about placement luck. It
        also needs a decent hash: cheap ones leave <code>server#0</code> and <code>server#1</code> correlated,
        the replicas clump, and the balance never arrives — which is why real rings use MD5, murmur, or similar.</p>
      `,
    },
  ],

  comparison: {
    kicker: 'Three schemes',
    heading: 'What moves when the pool changes',
    columns: ['Scheme', 'Keys moved when a server joins', 'Load balance', 'Lookup', 'Used by'],
    rows: [
      ['hash % N', '≈ (N−1)/N — almost everything', 'Even, while it lasts', 'O(1)', 'Toy systems, fixed-size pools'],
      ['Consistent hashing', '≈ K/N — one arc', 'Lumpy with few nodes', 'O(log N)', 'The idea; rarely shipped bare'],
      ['+ virtual nodes', '≈ K/N, spread over all peers', 'Even, and reliably so', 'O(log N·R)', 'Dynamo, Cassandra, Riak, memcached rings'],
    ],
    footnote: `
      <code>K</code> is the total number of keys, <code>N</code> the number of servers, <code>R</code> the
      replicas per server. The jump that matters is the first column: from "move almost everything" to "move
      one server's share." Virtual nodes then buy back the even load that plain consistent hashing gives up.
    `,
  },

  traps: {
    kicker: 'What interviewers probe',
    heading: 'Five things to get right out loud',
    items: [
      {
        title: 'Saying "hash mod N" and stopping',
        body: 'It is the correct starting point, but if you don\'t immediately name the rehash-on-resize problem, the interviewer assumes you haven\'t hit it in production. Say the flaw before they ask.',
      },
      {
        title: 'Forgetting virtual nodes',
        body: 'Plain consistent hashing has visibly uneven load and a bad failure mode: a dead node dumps its whole arc on one neighbour. Virtual nodes are not an optimisation here, they are the version people actually run. Leaving them out is the most common gap.',
      },
      {
        title: 'Hand-waving the hash function',
        body: 'With a weak hash, a server\'s replicas ("s#0", "s#1", …) land close together and balance never materialises. Naming MD5 / murmur and why (avalanche on near-identical inputs) shows you\'ve implemented it, not just read about it.',
      },
      {
        title: 'Ignoring replication and the "next N nodes"',
        body: 'Real systems store each key on the next R distinct servers clockwise, not just one, for fault tolerance. If asked about durability, that walk — skipping virtual nodes of a server you already picked — is the answer.',
      },
      {
        title: 'Missing hot keys',
        body: 'Consistent hashing balances the key space, not traffic. One viral key still hammers one server. The fix is a different layer — replicate or split hot keys — and noticing that the ring can\'t solve it is the senior signal.',
      },
    ],
  },

  next: {
    kicker: 'Where it shows up',
    heading: 'The same ring, in real systems',
    intro:
      'Consistent hashing is a building block, not a destination. Once the churn-and-balance story is solid, these designs become "a ring, plus …":',
    items: [
      { num: '06', title: 'Key-Value Store', note: 'The ring is the partitioner. Add replication across the next N nodes and you have Dynamo.' },
      { num: '19', title: 'Distributed Message Queue', note: 'Partitions map to brokers by the same trick, so rebalancing on broker changes is cheap.' },
      { num: '15', title: 'Google Drive', note: 'File chunks sharded across storage nodes; consistent hashing keeps re-chunking bounded.' },
      { num: '04', title: 'Rate Limiter', note: 'A distributed limiter shards counters by key — the ring decides which node holds each.' },
      { num: '25', title: 'Gaming Leaderboard', note: 'Shard by player; the ring keeps shard moves cheap as the fleet scales with player count.' },
    ],
  },

  interview: {
    kicker: 'In the room',
    heading: 'The two sentences to land',
    html: `
      <p>When a design turns to sharding — "how do you spread this across nodes?" — lead with the failure of the
      obvious answer: <em>"hash mod N works until the pool changes, and then almost every key moves."</em> That
      one line tells the interviewer you have run into it, not just read the chapter.</p>
      <p>Then give the fix in two beats: <strong>the ring</strong> for churn — "a key goes to the next server
      clockwise, so adding a node moves only its arc, about K/N keys" — and <strong>virtual nodes</strong> for
      balance — "each server gets a few hundred positions so load stays even and a dead node's share spreads
      across everyone." If you have time, add the replication walk (next N distinct nodes clockwise) and hot
      keys as the thing the ring can't fix. That progression — problem, ring, virtual nodes, replication,
      limits — is a complete answer.</p>
    `,
  },
};

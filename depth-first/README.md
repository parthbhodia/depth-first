# Depth First

Interactive, step-by-step traces of interview algorithms. Nuxt 4, statically generated, no backend.

Two problems so far, each traced three ways in four languages:

- **LC 104 — Maximum Depth of Binary Tree** — recursive DFS, iterative DFS, BFS, over a live
  call stack and tree canvas.
- **LC 70 — Climbing Stairs** — naive recursion, memoised, bottom-up table. The call tree
  explodes, then collapses, then disappears. This is the recursion → memo → table transition
  as one continuous picture.

---

## Run it

```bash
npm install          # .npmrc already sets legacy-peer-deps
npm run dev          # http://localhost:3000
npm run generate     # static site → .output/public
npm run preview
```

Node 20+ (22 recommended).

## Deploy

Static output, so anything that serves files works.

| Host | What to do |
| --- | --- |
| **Vercel** | Import the repo. `vercel.json` already sets the build command and output dir. |
| **Netlify** | Import the repo. `netlify.toml` is committed. |
| **Cloudflare Pages** | Build `npm run generate`, output `.output/public`. |
| **GitHub Pages / S3 / nginx** | Upload `.output/public`. |

**Set your domain before the first deploy** so canonicals, the sitemap and OG tags point at the
right place:

```
NUXT_PUBLIC_SITE_URL=https://your-domain.com
```

(Default lives in `nuxt.config.ts` under `runtimeConfig.public.siteUrl`.)

`/sitemap.xml` and `/robots.txt` are generated from the problem registry at build time.

---

## Voice narration

Each step already has a written caption, so narration reads it with the browser's own
`speechSynthesis` — no audio files, no TTS bill, and it covers every approach, every
language and every tree the viewer types in.

Two details that matter:

- **The voice sets the pace.** With narration on, the trace waits for the sentence to
  finish rather than racing a fixed timer against it (`useTrace`'s `pace` option). If
  speech fails or is unavailable it falls back to the timer, so playback never stalls.
- **Captions are rewritten for the ear** (`shared/engine/speech.js`). Read verbatim,
  "1 + max(0, 0) = 1" comes out as "one plus max open paren zero comma zero close paren
  equals one". `toSpeech()` turns it into "1 plus the max of 0 and 0 equals 1".

Off by default — audio never starts on its own. `V` toggles it. The chosen voice
persists in `localStorage`; the on/off state deliberately does not.

## How a trace works

The algorithm runs **once**, at render time, against whatever tree is in the input box. As it runs
it records a frame per step:

```js
{
  anchor,      // semantic step name → maps to a line number in each language
  caption,     // the sentence shown under the trace
  active,      // node currently executing
  path,        // nodes on the call stack
  callStack,   // recursive approaches
  aux,         // { kind: 'stack' | 'queue', items } for iterative approaches
  returns,     // node id → the number shown in its badge
  vars,        // local variables to display
  result,      // non-null on the final frame
  nullSlot,    // where to draw the ghost "null" node, if any
  levelBand,   // BFS: which row is being drained
}
```

The UI never executes anything — it paints `frames[index]`. That is why stepping backwards,
scrubbing and speed changes can't desynchronise the panels.

Because frames reference **anchors** rather than line numbers, switching language keeps your place:
each language's source declares its own `anchors` map.

---

## Layout

```
shared/engine/          generic, problem-agnostic
  tree.js               level-order parsing, tidy binary-tree layout, geometry
  calltree.js           n-ary layout for a tree of CALLS + duplicate detection
  highlight.js          small 5-class tokeniser (no 100KB grammar lib)
  speech.js             caption → spoken phrasing, speech rate
  languages.js          the language tabs

content/
  index.js              THE REGISTRY — add new problems here
  problems/<slug>/
    algorithms.js       instrumented solutions + per-language source & anchors
    index.js            everything else the page renders

app/
  components/
    AlgoTrace.vue       the whole rig; picks a stage from problem.stage
    TreeCanvas.vue      binary tree — the INPUT, known up front
    CallTreeCanvas.vue  call tree — the EXECUTION, revealed as it happens
    DpTable.vue         memo chips and the dp array strip
    CodePane.vue        line numbers, highlighting, active-line marker
  composables/
    useTrace.js         playback: play/pause/step/scrub/speed, pace hook
    useNarration.js     browser speech, voice choice
  pages/
    index.vue           problem list
    problems/[slug].vue problem page
    about.vue

server/routes/          sitemap.xml, robots.txt (read the registry)
scripts/check.mjs       correctness + anchor + call-tree structure checks
```

### The two stages

`problem.stage` decides which canvas renders:

| stage | The picture is | Used by |
| --- | --- | --- |
| `binary-tree` | The **input**. Fully known up front; nodes light up as they're visited. | LC 104 |
| `call-tree` | The **execution**. Laid out once over every call the run will make, then revealed node by node as those calls happen. | LC 70 |

Laying the call tree out up front and revealing it — rather than re-flowing on every call —
is what keeps it watchable. If the geometry moved every time a node appeared, you'd lose
your place immediately.

## Adding a problem

1. `cp -r content/problems/<nearest-existing> content/problems/<new-slug>`
   (start from `climbing-stairs` for DP, `maximum-depth-of-binary-tree` for trees)
2. Rewrite `algorithms.js`:
   - write each solution as you normally would, then add `snap(anchor, caption, extra)` calls at
     each step you want the viewer to see;
   - give every language's source an `anchors` map (`{ stepName: lineNumber }`) — the test script
     below will tell you if one is missing or out of range.
3. Rewrite `index.js` — slug, number, title, statement, examples, essay, traps, related, plus
   the four fields the app needs to stage it:

   | field | what it does |
   | --- | --- |
   | `stage` | `'binary-tree'` or `'call-tree'` |
   | `inputLabel` | what the input box is called |
   | `parseInput(text)` | turns the input string into whatever `approach.build()` takes |
   | `reference(input)` | the correct answer, for `scripts/check.mjs` |
   | `checkInputs` | input strings to verify against |

4. Import it in `content/index.js` and add it to the `problems` array.

Routes, the problem index and the sitemap all read from that array, so there is nothing else to wire.

### Sanity-check a new problem

No test runner, because the checks that matter are short. `scripts/check.mjs` runs every
approach against the problem's own `reference()` across every `checkInputs` entry, asserts
each frame's anchor resolves to a real line in all four languages, and validates call-tree
structure (one root, no orphans, reveal count monotonic and within bounds).

```bash
node scripts/check.mjs
```

---

## Credit

Problems are LeetCode's. [NeetCode](https://neetcode.io) is the reference for *what* to practise
and in what order — this is meant to sit alongside that, adding the step-level picture that's hard
to get from a static code block.

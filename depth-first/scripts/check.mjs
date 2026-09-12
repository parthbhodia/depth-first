/**
 * Correctness + wiring check for every registered problem.
 *
 *   node scripts/check.mjs
 *
 * For each problem, for each declared input, run every approach and compare
 * with that problem's reference implementation. Then assert that every frame's
 * anchor resolves to a real line in every language, and that any call tree the
 * approach produced is structurally sound. A lesson's warm-up problem gets the
 * same treatment, and every pointer a lesson makes into an instrument must land.
 */
import { languages } from '#engine/languages.js';
import { problems } from '#content/index.js';

let failures = 0;
const fail = (msg) => { failures++; console.error('  FAIL  ' + msg); };

function checkProblem(problem) {
  for (const raw of problem.checkInputs) {
    const input = problem.parseInput(raw);
    const expected = problem.reference(input);

    for (const approach of problem.approaches) {
      const built = approach.build(input);
      const { frames, answer, nodes } = built;
      const final = frames[frames.length - 1];

      if (!frames.length) { fail(`${approach.id} on ${raw}: no frames`); continue; }
      if (answer !== expected) fail(`${approach.id} on ${raw}: returned ${answer}, expected ${expected}`);
      if (final.result !== expected) fail(`${approach.id} on ${raw}: final frame result ${final.result}, expected ${expected}`);
      if (!final.caption) fail(`${approach.id} on ${raw}: final frame has no caption`);

      // Where the answer is a collection, the scalar above only checks its
      // size. Problems can supply a deeper check of what was actually built.
      if (problem.verify) {
        const msg = problem.verify(input, built);
        if (msg) fail(`${approach.id} on ${raw}: ${msg}`);
      }

      // Anchors must land on a real line in every language.
      for (const lang of languages) {
        const entry = approach.code[lang.id];
        if (!entry) { fail(`${approach.id}: no ${lang.id} source`); continue; }
        const lineCount = entry.source.split('\n').length;
        for (const f of frames) {
          const line = entry.anchors[f.anchor];
          if (!line || line < 1 || line > lineCount) {
            fail(`${approach.id}/${lang.id} on ${raw}: anchor "${f.anchor}" missing or out of range`);
            break;
          }
        }
      }

      // Call trees: one root, every parent exists, reveal count never goes
      // backwards and never exceeds the nodes that exist.
      if (nodes && nodes.length) {
        const ids = new Set(nodes.map((n) => n.id));
        const roots = nodes.filter((n) => n.parentId === null || n.parentId === undefined);
        if (roots.length !== 1) fail(`${approach.id} on ${raw}: expected 1 root, got ${roots.length}`);
        for (const n of nodes) {
          if (n.parentId !== null && n.parentId !== undefined && !ids.has(n.parentId)) {
            fail(`${approach.id} on ${raw}: node ${n.id} has a missing parent`);
            break;
          }
        }
        let prev = 0;
        for (const f of frames) {
          const r = f.revealed ?? 0;
          if (r < prev) { fail(`${approach.id} on ${raw}: reveal count went backwards`); break; }
          if (r > nodes.length) { fail(`${approach.id} on ${raw}: reveal count exceeds node count`); break; }
          prev = r;
        }
      }
    }
  }

  // A complexity panel counts the trace by anchor and quotes source lines by
  // anchor; both must exist, and every story line must render to text.
  for (const approach of problem.approaches) {
    const cx = approach.complexity;
    if (!cx) continue;
    const dflt = problem.parseInput(problem.defaultInput);
    const built = approach.build(dflt);
    for (const l of cx.time.loops || []) {
      for (const lang of languages) {
        if (!approach.code[lang.id]?.anchors[l.anchor]) fail(`${approach.id}/${lang.id}: complexity loop anchor "${l.anchor}" missing`);
      }
    }
    for (const a of cx.time.iterationAnchors || []) {
      if (!built.frames.some((fr) => fr.anchor === a)) fail(`${approach.id}: complexity iteration anchor "${a}" never occurs on the default input`);
    }
    const m = { n: 0, label: "", calls: 0, leaves: 0, answers: 0, iterations: 0, by: {}, maxDepth: 0, frames: 0, levels: [1] };
    const say = (x) => (typeof x === "function" ? x(m) : x);
    try {
      [cx.lead, cx.time.final, cx.time.note, cx.space.note, ...cx.time.story, ...cx.space.story, ...(cx.time.loops || []).flatMap((l) => [l.runs, l.measured])].forEach(say);
      say(cx.space.measured);
    } catch (e) {
      fail(`${approach.id}: complexity text threw: ${e.message}`);
    }
  }

  const sample = problem.parseInput(problem.defaultInput);
  for (const approach of problem.approaches) {
    const { frames, nodes } = approach.build(sample);
    const extra = nodes && nodes.length ? `, ${nodes.length} calls` : '';
    console.log(`  ${approach.id.padEnd(10)} ok — ${frames.length} frames${extra} on the default input`);
  }
}

// A lesson is prose that points INTO an instrument. Every pointer must land:
// the approach exists, the frame exists, the anchor exists in every language.
function checkLesson(problem) {
  const lesson = problem.lesson;
  const probFor = (ref) => (ref && ref.problem === 'warmup' ? lesson.warmup : problem);
  const framesOf = (p, approachId) => {
    const a = p.approaches.find((x) => x.id === approachId);
    return a ? a.build(p.parseInput(p.defaultInput)).frames : null;
  };

  const jumps = [lesson.finish, ...lesson.steps.flatMap((s) => (s.jumps || []).map((j) => ({ ...j, _step: s.title })))].filter(Boolean);
  for (const j of jumps) {
    const p = j.target === 'warmup' ? lesson.warmup : problem;
    const frames = framesOf(p, j.approach);
    if (!frames) { fail(`lesson: unknown approach ${j.approach} in "${j._step || 'finish'}"`); continue; }
    if (typeof j.at === "object" && j.at.anchor && !frames.some((f) => f.anchor === j.at.anchor)) fail(`lesson: no frame with anchor ${j.at.anchor} in ${j.approach}`);
    if (typeof j.at === 'number' && j.at >= frames.length) fail(`lesson: frame ${j.at} is past the end of ${j.approach} (${frames.length} frames)`);
  }
  for (const s of lesson.steps) {
    for (const g of [s.figure, s.grow, s.instrument].filter(Boolean)) {
      const p = probFor(g);
      if (g.approach && !p.approaches.some((x) => x.id === g.approach)) fail(`lesson: unknown approach ${g.approach} in "${s.title}"`);
      if (typeof g.at === "object" && g.at.anchor && !framesOf(p, g.approach).some((f) => f.anchor === g.at.anchor)) fail(`lesson: figure anchor ${g.at.anchor} missing in "${s.title}"`);
    }
    if (s.parts) {
      const p = probFor(s);
      const a = p.approaches.find((x) => x.id === s.approach);
      if (!a) { fail(`lesson: unknown approach ${s.approach} in "${s.title}"`); continue; }
      for (const part of s.parts) for (const an of part.anchors) for (const lang of languages) {
        if (!a.code[lang.id] || !a.code[lang.id].anchors[an]) fail(`lesson: anchor ${an} missing in ${a.id}/${lang.id}`);
      }
    }
  }
  console.log(`  lesson     ok — ${lesson.steps.length} steps, ${jumps.length} jumps`);
}

for (const problem of problems) {
  console.log(`\n${problem.number} — ${problem.title}  [${problem.stage}]`);
  if (problem.lesson) {
    if (problem.lesson.warmup) {
      console.log(`  warm-up: ${problem.lesson.warmup.title}`);
      checkProblem(problem.lesson.warmup);
    }
    checkLesson(problem);
  }
  checkProblem(problem);
}

console.log(failures === 0 ? '\nAll checks passed.\n' : `\n${failures} failure(s).\n`);
process.exit(failures === 0 ? 0 : 1);

/**
 * Correctness + wiring check for every registered problem.
 *
 *   node scripts/check.mjs
 *
 * For each problem, for each declared input, run every approach and compare
 * with that problem's reference implementation. Then assert that every frame's
 * anchor resolves to a real line in every language, and that any call tree the
 * approach produced is structurally sound.
 */
import { languages } from '#engine/languages.js';
import { problems } from '#content/index.js';

let failures = 0;
const fail = (msg) => { failures++; console.error('  FAIL  ' + msg); };

for (const problem of problems) {
  console.log(`\n${problem.number} — ${problem.title}  [${problem.stage}]`);

  // A lesson is prose that points INTO the instrument. Every pointer must land.
  if (problem.lesson) {
    const dflt = problem.parseInput(problem.defaultInput);
    const jumps = [problem.lesson.finish, ...problem.lesson.steps.flatMap((s) => s.jumps || [])].filter(Boolean);
    for (const j of jumps) {
      const a = problem.approaches.find((x) => x.id === j.approach);
      if (!a) { fail(`lesson: unknown approach ${j.approach}`); continue; }
      const frames = a.build(dflt).frames;
      if (j.at && j.at.anchor && !frames.some((f) => f.anchor === j.at.anchor)) fail(`lesson: no frame with anchor ${j.at.anchor} in ${a.id}`);
      if (typeof j.at === "number" && j.at >= frames.length) fail(`lesson: frame ${j.at} is past the end of ${a.id} (${frames.length} frames)`);
    }
    for (const s of problem.lesson.steps) {
      for (const g of [s.figure, s.grow].filter(Boolean)) {
        if (!problem.approaches.some((x) => x.id === g.approach)) fail(`lesson: unknown approach ${g.approach} in "${s.title}"`);
      }
      if (s.parts) {
        const a = problem.approaches.find((x) => x.id === s.approach);
        if (!a) { fail(`lesson: unknown approach ${s.approach} in "${s.title}"`); continue; }
        for (const p of s.parts) for (const an of p.anchors) for (const lang of languages) {
          if (!a.code[lang.id] || !a.code[lang.id].anchors[an]) fail(`lesson: anchor ${an} missing in ${a.id}/${lang.id}`);
        }
      }
    }
    console.log(`  lesson     ok — ${problem.lesson.steps.length} steps, ${jumps.length} jumps`);
  }

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

  const sample = problem.parseInput(problem.defaultInput);
  for (const approach of problem.approaches) {
    const { frames, nodes } = approach.build(sample);
    const extra = nodes && nodes.length ? `, ${nodes.length} calls` : '';
    console.log(`  ${approach.id.padEnd(10)} ok — ${frames.length} frames${extra} on the default input`);
  }
}

console.log(failures === 0 ? '\nAll checks passed.\n' : `\n${failures} failure(s).\n`);
process.exit(failures === 0 ? 0 : 1);

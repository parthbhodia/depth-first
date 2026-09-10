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

/**
 * Captions are written to be READ. Spoken verbatim they come out as
 * "one plus max open paren zero comma zero close paren equals one", which is
 * worse than silence. This rewrites a caption into something a speech engine
 * says the way a person would say it out loud.
 *
 * Pure and dependency-free so the site and the standalone page share it.
 */
export function toSpeech(text) {
  if (!text) return '';
  let s = String(text);

  // Function calls people say by name, not by punctuation.
  s = s.replace(/maxDepth\(\s*null\s*\)/gi, 'max depth of null');
  s = s.replace(/maxDepth\(([^)]*)\)/gi, 'max depth of $1');
  s = s.replace(/\bmax\(([^)]*)\)/gi, (_, inner) => 'the max of ' + inner.replace(/\s*,\s*/g, ' and '));
  s = s.replace(/\blen\(\s*q\s*\)/gi, 'the length of q');
  s = s.replace(/\bq\.popleft\(\)/gi, 'q dot popleft');
  s = s.replace(/\bstack\.pop\(\)/gi, 'stack dot pop');

  // [node, depth] pairs — the brackets are noise, the pairing is the point.
  s = s.replace(/\[\s*([^\],]+?)\s*,\s*([^\]]+?)\s*\]/g, 'the pair $1, $2');

  // node.left → "node left"
  s = s.replace(/([A-Za-z])\.([A-Za-z])/g, '$1 $2');

  // Operators and dashes.
  s = s.replace(/\s*—\s*/g, ', ');
  s = s.replace(/\s*→\s*/g, ' becomes ');
  s = s.replace(/\s*=\s*/g, ' equals ');
  s = s.replace(/(\d)\s*\+\s*/g, '$1 plus ');
  s = s.replace(/\s*\+\s*(\d)/g, ' plus $1');

  // Leftover empty call parens.
  s = s.replace(/\(\)/g, '');

  return s.replace(/\s+/g, ' ').trim();
}

/** The playback speed control doubles as the speech rate control. */
export function speechRate(speed) {
  if (speed <= 0.5) return 0.8;
  if (speed >= 2) return 1.6;
  return 1;
}

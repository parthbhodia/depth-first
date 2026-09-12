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
  // Any other call with arguments: climb(5) → "climb of 5", dfs(null) → "dfs of null".
  s = s.replace(/\b([A-Za-z_]\w*)\(([^()]+)\)/g, '$1 of $2');

  // Indexing: nums[i] → "nums at i", dp[5] → "dp at 5". Must run before the
  // list rules below, which would otherwise eat the brackets.
  s = s.replace(/(\w)\[([^[\]]+)\]/g, '$1 at $2');

  // Lists. [ ] is an empty list; [node, depth] pairs keep the word "pair"
  // because the pairing is the point; anything longer reads as a list.
  s = s.replace(/\[\s*\]/g, 'an empty list');
  s = s.replace(/\[\s*([^\],]+?)\s*,\s*([^\],]+?)\s*\]/g, 'the pair $1, $2');
  s = s.replace(/\[([^[\]]+)\]/g, (_, inner) => {
    const items = inner.split(',').map((x) => x.trim()).filter(Boolean);
    if (items.length < 2) return items.join('');
    return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
  });

  // Powers: 2^n, 2ⁿ, 2ⁿ⁺¹.
  s = s.replace(/(\w+)\^(\w+)/g, '$1 to the power of $2');
  s = s.replace(/ⁿ⁺¹/g, ' to the power of n plus 1');
  s = s.replace(/ⁿ/g, ' to the power of n');
  s = s.replace(/²/g, ' squared');

  // node.left → "node left"
  s = s.replace(/([A-Za-z])\.([A-Za-z])/g, '$1 $2');

  // Operators and dashes.
  s = s.replace(/\s*—\s*/g, ', ');
  s = s.replace(/\s*→\s*/g, ' becomes ');
  // Comparisons first, so a single = never eats half of ==.
  s = s.replace(/\s*==\s*/g, ' equals ');
  s = s.replace(/\s*!=\s*/g, ' is not equal to ');
  s = s.replace(/\s*>=\s*/g, ' is at least ');
  s = s.replace(/\s*<=\s*/g, ' is at most ');
  s = s.replace(/(\S)\s*>\s*(\S)/g, '$1 is greater than $2');
  s = s.replace(/(\S)\s*<\s*(\S)/g, '$1 is less than $2');
  s = s.replace(/\s*=\s*/g, ' equals ');
  s = s.replace(/(\d)\s*\+\s*/g, '$1 plus ');
  s = s.replace(/\s*\+\s*(\d)/g, ' plus $1');
  s = s.replace(/\s*−\s*/g, ' minus ');
  s = s.replace(/\b([A-Za-z])-(\d)/g, '$1 minus $2');
  s = s.replace(/\s*%\s*/g, ' mod ');
  s = s.replace(/(\S)@(\d)/g, '$1 at $2');
  s = s.replace(/°/g, ' degrees');
  s = s.replace(/\s*·\s*/g, ' times ');

  // Leftover empty call parens.
  s = s.replace(/\(\)/g, '');

  return s.replace(/\s+/g, ' ').trim();
}

/**
 * One utterance per sentence. Engines pause properly between utterances, and
 * Chrome's cloud voices go silent partway through anything longer than about
 * fifteen seconds, so short pieces are both clearer and safer.
 */
export function toSentences(phrase) {
  const parts = (String(phrase).match(/[^.!?]+[.!?]*["')\]]*/g) || [])
    .map((p) => p.trim())
    .filter(Boolean);
  return parts.length ? parts : [String(phrase).trim()].filter(Boolean);
}

/**
 * The playback speed control doubles as the speech rate control. A touch
 * under 1 at normal speed: every voice is easier to follow that way.
 */
export function speechRate(speed) {
  if (speed <= 0.5) return 0.8;
  if (speed >= 2) return 1.5;
  return 0.95;
}

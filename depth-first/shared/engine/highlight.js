/**
 * A deliberately small syntax highlighter.
 *
 * A full grammar library would be ~100KB for four short snippets, and it would
 * fight the site's palette. This tokenises into five classes that map onto the
 * existing design tokens, which is all the code pane needs.
 */

const KEYWORDS = {
  python: ['class', 'def', 'self', 'return', 'if', 'not', 'while', 'for', 'in', 'None', 'import', 'from', 'else', 'elif', 'and', 'or', 'is'],
  javascript: ['var', 'const', 'let', 'function', 'return', 'if', 'while', 'for', 'null', 'else', 'of', 'new', 'true', 'false'],
  java: ['class', 'public', 'private', 'int', 'void', 'return', 'if', 'while', 'for', 'null', 'new', 'else', 'static', 'boolean'],
  cpp: ['class', 'public', 'private', 'int', 'void', 'return', 'if', 'while', 'for', 'nullptr', 'new', 'else', 'auto', 'bool', 'struct'],
};

const TYPES = {
  python: ['Optional', 'TreeNode', 'Solution', 'int', 'deque'],
  javascript: ['Math'],
  java: ['TreeNode', 'Deque', 'ArrayDeque', 'Pair', 'Queue', 'LinkedList', 'Integer', 'Math', 'Solution'],
  cpp: ['TreeNode', 'stack', 'queue', 'pair', 'Solution'],
};

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const TOKEN = /(#[^\n]*|\/\/[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\b\d+\b)|([A-Za-z_][A-Za-z0-9_]*)|(\s+)|([^\sA-Za-z0-9_])/g;

export function highlight(line, lang) {
  const kw = new Set(KEYWORDS[lang] || []);
  const ty = new Set(TYPES[lang] || []);
  const re = new RegExp(TOKEN.source, 'g');
  let out = '';
  let m;

  while ((m = re.exec(line)) !== null) {
    const [full, com, str, num, ident, ws, pun] = m;
    if (com) out += `<span class="t-com">${esc(com)}</span>`;
    else if (str) out += `<span class="t-str">${esc(str)}</span>`;
    else if (num) out += `<span class="t-num">${num}</span>`;
    else if (ident) {
      const after = line.slice(re.lastIndex);
      if (kw.has(ident)) out += `<span class="t-kw">${ident}</span>`;
      else if (ty.has(ident)) out += `<span class="t-fn">${ident}</span>`;
      else if (/^\s*\(/.test(after)) out += `<span class="t-fn">${ident}</span>`;
      else out += ident;
    } else if (ws) out += ws;
    else if (pun) out += `<span class="t-pun">${esc(pun)}</span>`;
    else out += esc(full);
  }

  return out || '&nbsp;';
}

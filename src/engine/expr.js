// Minimal evaluator for the subset of GitHub Actions expression syntax used in ${{ }} and if: conditions.
// Supports: literals (true/false/null/numbers/'strings'), ==, !=, >, >=, <, <=, &&, ||, !, (), dotted/bracket
// property access (github.ref, needs.build.outputs.x, matrix.node), and function calls:
// success(), failure(), always(), cancelled(), contains(a,b), startsWith(a,b), endsWith(a,b), join(a,b).

function tokenize(src) {
  const tokens = [];
  let i = 0;
  const n = src.length;
  const isIdentStart = c => /[A-Za-z_]/.test(c);
  const isIdentPart = c => /[A-Za-z0-9_\-]/.test(c);
  while (i < n) {
    const c = src[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === "'") {
      let j = i + 1, s = '';
      while (j < n) {
        if (src[j] === "'" && src[j + 1] === "'") { s += "'"; j += 2; continue; }
        if (src[j] === "'") { j++; break; }
        s += src[j]; j++;
      }
      tokens.push({ t: 'str', v: s }); i = j; continue;
    }
    if (/[0-9]/.test(c) || (c === '-' && /[0-9]/.test(src[i + 1] || ''))) {
      let j = i + 1;
      while (j < n && /[0-9.]/.test(src[j])) j++;
      tokens.push({ t: 'num', v: parseFloat(src.slice(i, j)) }); i = j; continue;
    }
    if (c === '=' && src[i + 1] === '=') { tokens.push({ t: 'op', v: '==' }); i += 2; continue; }
    if (c === '!' && src[i + 1] === '=') { tokens.push({ t: 'op', v: '!=' }); i += 2; continue; }
    if (c === '>' && src[i + 1] === '=') { tokens.push({ t: 'op', v: '>=' }); i += 2; continue; }
    if (c === '<' && src[i + 1] === '=') { tokens.push({ t: 'op', v: '<=' }); i += 2; continue; }
    if (c === '&' && src[i + 1] === '&') { tokens.push({ t: 'op', v: '&&' }); i += 2; continue; }
    if (c === '|' && src[i + 1] === '|') { tokens.push({ t: 'op', v: '||' }); i += 2; continue; }
    if ('><'.includes(c)) { tokens.push({ t: 'op', v: c }); i++; continue; }
    if (c === '!') { tokens.push({ t: 'op', v: '!' }); i++; continue; }
    if (c === '(') { tokens.push({ t: 'lparen' }); i++; continue; }
    if (c === ')') { tokens.push({ t: 'rparen' }); i++; continue; }
    if (c === ',') { tokens.push({ t: 'comma' }); i++; continue; }
    if (c === '.') { tokens.push({ t: 'dot' }); i++; continue; }
    if (c === '[') { tokens.push({ t: 'lbrack' }); i++; continue; }
    if (c === ']') { tokens.push({ t: 'rbrack' }); i++; continue; }
    if (isIdentStart(c)) {
      let j = i + 1;
      while (j < n && isIdentPart(src[j])) j++;
      const word = src.slice(i, j);
      const low = word.toLowerCase();
      if (low === 'true') tokens.push({ t: 'bool', v: true });
      else if (low === 'false') tokens.push({ t: 'bool', v: false });
      else if (low === 'null') tokens.push({ t: 'null' });
      else tokens.push({ t: 'ident', v: word });
      i = j; continue;
    }
    // Unknown character: skip it defensively rather than throw, so odd input degrades gracefully.
    i++;
  }
  return tokens;
}

function parse(tokens) {
  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];
  function parseOr() {
    let left = parseAnd();
    while (peek() && peek().t === 'op' && peek().v === '||') { next(); left = { k: 'or', l: left, r: parseAnd() }; }
    return left;
  }
  function parseAnd() {
    let left = parseEquality();
    while (peek() && peek().t === 'op' && peek().v === '&&') { next(); left = { k: 'and', l: left, r: parseEquality() }; }
    return left;
  }
  function parseEquality() {
    let left = parseRelational();
    while (peek() && peek().t === 'op' && ['==', '!='].includes(peek().v)) {
      const op = next().v; left = { k: 'cmp', op, l: left, r: parseRelational() };
    }
    return left;
  }
  function parseRelational() {
    let left = parseUnary();
    while (peek() && peek().t === 'op' && ['>', '>=', '<', '<='].includes(peek().v)) {
      const op = next().v; left = { k: 'cmp', op, l: left, r: parseUnary() };
    }
    return left;
  }
  function parseUnary() {
    if (peek() && peek().t === 'op' && peek().v === '!') { next(); return { k: 'not', v: parseUnary() }; }
    return parsePrimary();
  }
  function parsePrimary() {
    const tk = peek();
    if (!tk) return { k: 'lit', v: null };
    if (tk.t === 'lparen') { next(); const e = parseOr(); if (peek() && peek().t === 'rparen') next(); return e; }
    if (tk.t === 'str') { next(); return { k: 'lit', v: tk.v }; }
    if (tk.t === 'num') { next(); return { k: 'lit', v: tk.v }; }
    if (tk.t === 'bool') { next(); return { k: 'lit', v: tk.v }; }
    if (tk.t === 'null') { next(); return { k: 'lit', v: null }; }
    if (tk.t === 'ident') {
      next();
      // function call?
      if (peek() && peek().t === 'lparen') {
        next();
        const args = [];
        if (peek() && peek().t !== 'rparen') {
          args.push(parseOr());
          while (peek() && peek().t === 'comma') { next(); args.push(parseOr()); }
        }
        if (peek() && peek().t === 'rparen') next();
        return { k: 'call', name: tk.v.toLowerCase(), args };
      }
      // property path
      const path = [tk.v];
      while (peek() && (peek().t === 'dot' || peek().t === 'lbrack')) {
        if (peek().t === 'dot') {
          next();
          if (peek() && peek().t === 'ident') path.push(next().v);
          else if (peek() && peek().t === 'num') path.push(String(next().v));
        } else {
          next();
          if (peek() && (peek().t === 'str' || peek().t === 'num')) path.push(String(next().v));
          if (peek() && peek().t === 'rbrack') next();
        }
      }
      return { k: 'path', path };
    }
    next();
    return { k: 'lit', v: null };
  }
  return parseOr();
}

function get(ctx, path) {
  let cur = ctx;
  for (const key of path) {
    if (cur == null) return undefined;
    const lower = key.toLowerCase();
    if (typeof cur === 'object' && !(key in cur) && lower in cur) cur = cur[lower];
    else cur = cur[key];
  }
  return cur;
}

function truthy(v) {
  if (v === undefined || v === null) return false;
  if (typeof v === 'string') return v.length > 0;
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'boolean') return v;
  return true;
}

function toStr(v) {
  if (v === undefined || v === null) return '';
  return String(v);
}

function evalNode(node, ctx) {
  switch (node.k) {
    case 'lit': return node.v;
    case 'path': return get(ctx, node.path);
    case 'not': return !truthy(evalNode(node.v, ctx));
    case 'and': {
      const l = evalNode(node.l, ctx);
      if (!truthy(l)) return l;
      return evalNode(node.r, ctx);
    }
    case 'or': {
      const l = evalNode(node.l, ctx);
      if (truthy(l)) return l;
      return evalNode(node.r, ctx);
    }
    case 'cmp': {
      const l = evalNode(node.l, ctx);
      const r = evalNode(node.r, ctx);
      const bothNum = typeof l === 'number' && typeof r === 'number';
      const a = bothNum ? l : toStr(l).toLowerCase();
      const b = bothNum ? r : toStr(r).toLowerCase();
      switch (node.op) {
        case '==': return a === b;
        case '!=': return a !== b;
        case '>': return a > b;
        case '>=': return a >= b;
        case '<': return a < b;
        case '<=': return a <= b;
      }
      return false;
    }
    case 'call': {
      const args = node.args.map(a => evalNode(a, ctx));
      switch (node.name) {
        case 'success': return (ctx.__jobStatus || 'success') === 'success';
        case 'failure': return (ctx.__jobStatus || 'success') === 'failure';
        case 'cancelled': return (ctx.__jobStatus || 'success') === 'cancelled';
        case 'always': return true;
        case 'contains': return toStr(args[0]).toLowerCase().includes(toStr(args[1]).toLowerCase());
        case 'startswith': return toStr(args[0]).toLowerCase().startsWith(toStr(args[1]).toLowerCase());
        case 'endswith': return toStr(args[0]).toLowerCase().endsWith(toStr(args[1]).toLowerCase());
        case 'join': return Array.isArray(args[0]) ? args[0].join(args[1] !== undefined ? toStr(args[1]) : ',') : toStr(args[0]);
        default: return undefined;
      }
    }
  }
  return undefined;
}

// Strips a single ${{ ... }} wrapper if the whole string is exactly one expression; GH Actions `if:`
// accepts the bare expression (no ${{ }}) too, so we handle both.
function unwrap(raw) {
  if (typeof raw !== 'string') return raw;
  const m = raw.trim().match(/^\$\{\{([\s\S]*)\}\}$/);
  return m ? m[1].trim() : raw.trim();
}

function evaluateExpression(raw, ctx) {
  try {
    const src = unwrap(raw);
    const tokens = tokenize(src);
    const ast = parse(tokens);
    return evalNode(ast, ctx);
  } catch (e) {
    return undefined;
  }
}

// Interpolates all ${{ ... }} occurrences inside a free-form string (e.g. a run: command), returning
// a plain string with each expression replaced by its stringified value. Used for log rendering.
function interpolate(raw, ctx) {
  if (typeof raw !== 'string') return raw;
  return raw.replace(/\$\{\{([\s\S]*?)\}\}/g, (_, inner) => {
    try {
      const tokens = tokenize(inner.trim());
      const ast = parse(tokens);
      return toStr(evalNode(ast, ctx));
    } catch (e) {
      return '';
    }
  });
}

module.exports = { evaluateExpression, interpolate, truthy, tokenize, parse };

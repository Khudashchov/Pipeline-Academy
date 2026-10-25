// Lightweight line-based YAML syntax highlighter for the editor overlay. Not a full parser -- just
// enough token recognition to make the editor read like a real one: comments, keys, strings, the
// ${{ }} expression syntax (GitHub Actions' own notation, worth calling out visually), list dashes,
// and literals.

function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Splits a line into the code part and a trailing comment, respecting quotes so a '#' inside a
// string is not mistaken for a comment marker.
function splitComment(line) {
  let inSingle = false, inDouble = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === "'" && !inDouble) inSingle = !inSingle;
    else if (c === '"' && !inSingle) inDouble = !inDouble;
    else if (c === '#' && !inSingle && !inDouble && (i === 0 || /\s/.test(line[i - 1]))) {
      return { code: line.slice(0, i), comment: line.slice(i) };
    }
  }
  return { code: line, comment: '' };
}

// Highlights ${{ ... }} expression spans and quoted strings inside a code fragment (HTML-escaped already not yet; this works on raw text and escapes as it goes).
function highlightInline(text) {
  let out = '';
  let i = 0;
  const n = text.length;
  while (i < n) {
    if (text[i] === '$' && text[i + 1] === '{' && text[i + 2] === '{') {
      const end = text.indexOf('}}', i + 3);
      const stop = end === -1 ? n : end + 2;
      out += `<span class="tok-expr">${esc(text.slice(i, stop))}</span>`;
      i = stop;
      continue;
    }
    if (text[i] === "'" || text[i] === '"') {
      const quote = text[i];
      let j = i + 1;
      while (j < n && text[j] !== quote) j++;
      j = Math.min(n, j + 1);
      out += `<span class="tok-str">${esc(text.slice(i, j))}</span>`;
      i = j;
      continue;
    }
    // consume a run of plain text up to the next special character
    let j = i;
    while (j < n && !(text[j] === '$' && text[j + 1] === '{') && text[j] !== "'" && text[j] !== '"') j++;
    if (j === i) j++;
    out += esc(text.slice(i, j));
    i = j;
  }
  return out;
}

function highlightLine(line) {
  const { code, comment } = splitComment(line);
  const m = code.match(/^(\s*(?:-\s+)?)([A-Za-z0-9_.\-]+)(\s*:)(\s|$)/);
  let body;
  if (m) {
    const [, lead, key, colon] = m;
    const rest = code.slice(m[0].length - m[4].length); // keep the separating whitespace with the value
    body = `${esc(lead)}<span class="tok-key">${esc(key)}</span>${esc(colon)}${highlightInline(rest)}`;
  } else {
    const dash = code.match(/^(\s*-\s+)(.*)$/);
    if (dash) body = `${esc(dash[1])}${highlightInline(dash[2])}`;
    else body = highlightInline(code);
  }
  const commentHtml = comment ? `<span class="tok-comment">${esc(comment)}</span>` : '';
  return body + commentHtml;
}

function highlightYaml(text) {
  return text.split('\n').map(highlightLine).join('\n');
}

if (typeof module !== 'undefined') module.exports = { highlightYaml, splitComment, highlightInline };

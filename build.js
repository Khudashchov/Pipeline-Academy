const fs = require('fs');
const path = require('path');
const dir = __dirname;

function read(name) { return fs.readFileSync(path.join(dir, name), 'utf8'); }

const style = read('style.css');
let exprJs = read('expr.js');
let triggersJs = read('triggers.js');
let schedulerJs = read('scheduler.js');
let helpersJs = read('helpers.js');
let highlightJs = read('highlight.js');
let lessonsJs = read('lessons.js');
let appJs = read('app.js');

// Strip the one Node-only require() line so the file runs as a plain concatenated <script> in the
// browser, where expr.js's top-level functions are already in scope as globals.
schedulerJs = schedulerJs.replace(/^const \{ evaluateExpression, truthy \} = require\(['"]\.\/expr\.js['"]\);\s*\n/m, '');

// Strip any bare (unguarded) `module.exports = ...;` line -- `module` is undefined in a plain
// browser <script>, so an unguarded assignment throws a ReferenceError the moment that line runs.
// Files that already guard it with `if (typeof module !== 'undefined') ...` are left alone; that
// guard is a no-op in the browser and doesn't need stripping.
function stripBareExports(src) {
  return src.replace(/^module\.exports = [\s\S]*?;\s*\n/m, '');
}
exprJs = stripBareExports(exprJs);
triggersJs = stripBareExports(triggersJs);
schedulerJs = stripBareExports(schedulerJs);

for (const [name, src] of [['expr.js', exprJs], ['triggers.js', triggersJs], ['scheduler.js', schedulerJs], ['helpers.js', helpersJs], ['highlight.js', highlightJs], ['lessons.js', lessonsJs]]) {
  if (/\brequire\(/.test(src)) throw new Error(`${name} still contains a require() call -- would break in the browser bundle`);
  if (/^module\.exports/m.test(src)) throw new Error(`${name} still contains a bare module.exports -- would throw in the browser bundle`);
}

const skeleton = `<meta name="claude:viewport-fit-sides" content="cover">
<title>Pipeline Academy</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap">
<style>
${style}
</style>

<div class="app">
  <header class="topbar">
    <div class="topbar-inner">
      <button class="sidebar-toggle" id="sidebarToggle" type="button">&#9776; Modules</button>
      <div class="brand"><span class="brand-mark">PA</span><span class="brand-name">Pipeline Academy</span></div>
      <div class="topbar-spacer"></div>
      <div class="progress-pill"><div class="progress-track"><div class="progress-fill" id="progressFill"></div></div><span class="progress-label" id="progressLabel">0 / 0</span></div>
    </div>
  </header>
  <div class="layout" id="layout">
    <div class="sidebar-scrim" id="sidebarScrim"></div>
    <nav class="sidebar" id="sidebar" aria-label="Curriculum"></nav>
    <main class="main" id="main"></main>
  </div>
</div>
<p class="lab-note">Pipeline Academy is a simulation: it parses real YAML and follows GitHub Actions' real trigger, dependency, matrix, and expression rules, but no code actually runs and no repository is touched. Progress is saved in this browser only.</p>

<script src="https://cdnjs.cloudflare.com/ajax/libs/js-yaml/4.1.0/js-yaml.min.js"></script>
<script>
${exprJs}

${triggersJs}

${schedulerJs}

${helpersJs}

${highlightJs}

${lessonsJs}

${appJs}
</script>
`;

const outPath = path.join(dir, 'pipeline-academy.html');
fs.writeFileSync(outPath, skeleton, 'utf8');
console.log('Wrote', outPath, '(' + (Buffer.byteLength(skeleton) / 1024).toFixed(1) + ' KB)');

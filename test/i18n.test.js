const { MODULES } = require('../src/lessons/lessons.js');
const { LESSONS_UK } = require('../src/lessons/lessons.uk.js');
const { STRINGS, t, setLang } = require('../src/i18n/i18n.js');
let pass = 0, fail = 0;
function check(label, cond) { if (cond) pass++; else { fail++; console.log('FAIL:', label); } }

// UI catalog: every English key has a Ukrainian translation with the same {placeholders}.
const placeholders = s => (s.match(/\{\w+\}/g) || []).sort().join(',');
for (const key of Object.keys(STRINGS.en)) {
  check(`uk has UI string ${key}`, typeof STRINGS.uk[key] === 'string');
  if (STRINGS.uk[key]) check(`uk ${key} keeps placeholders`, placeholders(STRINGS.uk[key]) === placeholders(STRINGS.en[key]));
}
check('no extra uk UI keys', Object.keys(STRINGS.uk).every(k => k in STRINGS.en));

// Lesson overlay: same ids, and array fields line up one-to-one with the English source.
const knownIds = new Set();
for (const mod of MODULES) {
  knownIds.add(mod.id);
  const m = LESSONS_UK[mod.id];
  check(`[${mod.id}] module translated`, m && m.title && m.blurb);
  for (const l of mod.lessons) {
    knownIds.add(l.id);
    const u = LESSONS_UK[l.id];
    if (!u) { check(`[${l.id}] lesson translated`, false); continue; }
    check(`[${l.id}] title/objective/intro`, u.title && u.objective && Array.isArray(u.intro) && u.intro.length > 0);
    check(`[${l.id}] hints count`, (u.hints || []).length === (l.hints || []).length);
    check(`[${l.id}] checks count`, (u.checks || []).length === l.checks.length);
    check(`[${l.id}] tip present iff English has one`, !!u.tip === !!l.tip);
    const enScen = (l.scenarios || []).map(s => s.id).sort().join(',');
    const ukScen = Object.keys(u.scenarios || {}).sort().join(',');
    check(`[${l.id}] scenario ids match`, enScen === ukScen);
    // Code samples must survive translation untouched.
    const codes = s => (String(s).match(/<code>[\s\S]*?<\/code>/g) || []).sort().join('|');
    const enIntro = l.intro, ukIntro = u.intro.join('\n');
    check(`[${l.id}] intro <code> spans unchanged`, codes(enIntro) === codes(ukIntro));
    l.checks.forEach((c, i) => check(`[${l.id}] check ${i} <code> spans unchanged`, codes(c.label) === codes((u.checks || [])[i] || '')));
  }
}
check('no stray uk ids', Object.keys(LESSONS_UK).every(id => knownIds.has(id)));

// t(): language switch and interpolation.
setLang('uk');
check('t() uses Ukrainian', t('lesson.mission') === 'Місія');
check('t() interpolates', t('run.approved', { env: 'production' }).includes('production'));
setLang('en');
check('t() uses English', t('lesson.mission') === 'Mission');

console.log(`i18n: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

const yaml = require('js-yaml');
const { evaluateExpression } = require('../src/engine/expr.js');
const H = require('../src/lessons/helpers.js');
const { MODULES } = require('../src/lessons/lessons.js');

function buildApi(rawText) {
  let parsed = null, parses = true;
  try { parsed = yaml.load(rawText); if (parsed == null) parsed = {}; } catch (e) { parses = false; parsed = {}; }
  const api = {
    raw: rawText, parsed, parses,
    toArray: H.toArray,
    hasJob: k => H.hasJob(parsed, k),
    job: k => H.job(parsed, k),
    needsOf: k => H.needsOf(parsed, k),
    stepsOf: k => H.stepsOf(parsed, k),
    stepInJob: (k, pred) => H.stepInJob(parsed, k, pred),
    anyStepUses: re => H.anyStepUses(parsed, re),
    anyStepRuns: re => H.anyStepRuns(parsed, re),
    usesMatches: H.usesMatches,
    runMatches: H.runIncludes,
    countStepRuns: re => H.allSteps(parsed).reduce((n, { step }) => n + (typeof step.run === 'string' ? (step.run.match(re) || []).length : 0), 0),
    anyRawLineMatches: re => H.anyRawLineMatches(rawText, re),
    evalIf: (jobKey, extraCtx = {}) => {
      const j = H.job(parsed, jobKey);
      const expr = j.if !== undefined ? j.if : 'success()';
      const ctx = { github: {}, env: {}, secrets: {}, matrix: {}, needs: {}, __jobStatus: 'success', ...extraCtx };
      return !!evaluateExpression(String(expr), ctx);
    },
  };
  return api;
}

let pass = 0, fail = 0, lessonCount = 0;
for (const mod of MODULES) {
  for (const lesson of mod.lessons) {
    lessonCount++;
    const solApi = buildApi(lesson.solution);
    if (!solApi.parses) { fail++; console.log(`FAIL [${lesson.id}] solution does not parse as YAML`); continue; }
    let allPass = true;
    for (const c of lesson.checks) {
      let result;
      try { result = !!c.test(solApi); } catch (e) { result = false; console.log(`  threw: ${e.message}`); }
      if (!result) { allPass = false; console.log(`FAIL [${lesson.id}] solution does not satisfy check: ${c.label.replace(/<[^>]+>/g, '')}`); }
    }
    if (allPass) pass++; else fail++;

    // starter sanity: should parse (unless deliberately broken, e.g. m1-l1) and should NOT already satisfy every check
    const startApi = buildApi(lesson.starter);
    if (lesson.id !== 'm1-l1' && !startApi.parses) { console.log(`WARN [${lesson.id}] starter YAML fails to parse unexpectedly`); }
    if (startApi.parses) {
      const allAlreadyPass = lesson.checks.every(c => { try { return !!c.test(startApi); } catch (e) { return false; } });
      if (allAlreadyPass) console.log(`WARN [${lesson.id}] starter already satisfies every check -- no mission to do`);
    }
  }
}

console.log(`\n${lessonCount} lessons checked, ${pass} solutions fully pass, ${fail} have problems`);
process.exit(fail ? 1 : 0);

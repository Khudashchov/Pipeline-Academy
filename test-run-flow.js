const yaml = require('js-yaml');
const { evaluateTrigger } = require('./triggers.js');
const { planRun } = require('./scheduler.js');
const { MODULES } = require('./lessons.js');

const DEFAULT_GITHUB = { repository: 'kpi-labs/orbit-api', actor: 'bohdan', sha: '9f1c3abddeadbeef9f1c3abddeadbeef9f1c3ab', run_number: 128, workflow: 'CI' };
const DEFAULT_SECRETS = { DEPLOY_TOKEN: 'x', AWS_ROLE_ARN: 'x', AZURE_CLIENT_ID: 'x', AZURE_TENANT_ID: 'x', AZURE_SUBSCRIPTION_ID: 'x', GITHUB_TOKEN: 'x' };

function genericFaultHook(scenario) {
  return (jobKey, matrixVals, jobObj) => {
    const ov = scenario && scenario.overrides;
    if (!ov) return null;
    if (ov.forceFail === jobKey) {
      const steps = jobObj.steps || [];
      const idx = steps.length - 1;
      const last = steps[idx] || {};
      const label = last.name || (last.run ? last.run.split('\n')[0] : 'step');
      return { stepIndex: idx, message: `${label} exited with a non-zero status.` };
    }
    if (ov.forceFailMatrix && ov.forceFailMatrix.jobKey === jobKey && matrixVals) {
      const hit = Object.keys(ov.forceFailMatrix.match).every(k => String(matrixVals[k]) === String(ov.forceFailMatrix.match[k]));
      if (hit) {
        const steps = jobObj.steps || [];
        return { stepIndex: steps.length - 1, message: ov.forceFailMatrix.message || 'Step failed.' };
      }
    }
    return null;
  };
}

function runScenario(lesson, scenario, rawText) {
  const parsed = yaml.load(rawText) || {};
  const event = (scenario && scenario.event) || { name: 'push', refName: 'main' };
  const trig = evaluateTrigger(parsed.on, event);
  if (!trig.fires) return { trig, plan: null };
  const ctx = {
    github: { ref: event.isTag ? `refs/tags/${event.refName}` : `refs/heads/${event.refName}`, ref_name: event.refName, event_name: event.name, ...DEFAULT_GITHUB },
    env: parsed.env || {},
    secrets: DEFAULT_SECRETS,
    vars: {},
  };
  const plan = planRun(parsed, ctx, genericFaultHook(scenario));
  return { trig, plan };
}

let pass = 0, fail = 0;
function check(label, cond) { if (cond) pass++; else { fail++; console.log('FAIL:', label); } }

function find(id) { for (const m of MODULES) for (const l of m.lessons) if (l.id === id) return l; }

// m6-l1: notify only on failure
{
  const lesson = find('m6-l1');
  const r1 = runScenario(lesson, lesson.scenarios[0], lesson.solution); // tests pass
  const notify1 = r1.plan.nodes.find(n => n.jobKey === 'notify');
  check('m6-l1 notify skipped when tests pass', notify1.status === 'skipped');
  const r2 = runScenario(lesson, lesson.scenarios[1], lesson.solution); // tests fail
  const notify2 = r2.plan.nodes.find(n => n.jobKey === 'notify');
  check('m6-l1 notify runs when tests fail', notify2.status === 'success');
  const test2 = r2.plan.nodes.find(n => n.jobKey === 'test');
  check('m6-l1 test job shows failure', test2.status === 'failure');
}

// m7-l2: fail-fast false means sibling matrix combo keeps running despite one failing
{
  const lesson = find('m7-l2');
  const r = runScenario(lesson, lesson.scenarios[0], lesson.solution);
  const statuses = r.plan.nodes.map(n => n.status);
  check('m7-l2 one failure present', statuses.includes('failure'));
  check('m7-l2 no cancellations with fail-fast:false', !statuses.includes('cancelled'));
  check('m7-l2 excluded combo absent (8 nodes not 9)', r.plan.nodes.length === 8);
}

// m10-l1: environment gate flagged for UI pause
{
  const lesson = find('m10-l1');
  const r = runScenario(lesson, lesson.scenarios[0], lesson.solution);
  const deploy = r.plan.nodes.find(n => n.jobKey === 'deploy');
  check('m10-l1 deploy flags its environment', deploy.environment === 'production');
}

// m2-l2: push doesn't trigger a schedule/dispatch-only workflow
{
  const lesson = find('m2-l2');
  const r = runScenario(lesson, lesson.scenarios[2], lesson.solution); // push scenario
  check('m2-l2 push does not trigger', r.trig.fires === false);
  const r2 = runScenario(lesson, lesson.scenarios[0], lesson.solution); // scheduled
  check('m2-l2 schedule triggers', r2.trig.fires === true);
}

// m15 capstone: feature branch should skip build-image & deploy via if:
{
  const lesson = find('m15-l1');
  const r = runScenario(lesson, lesson.scenarios[1], lesson.solution); // feature branch
  check('capstone triggers on manual dispatch from feature branch', r.trig.fires === true);
  const bi = r.plan.nodes.find(n => n.jobKey === 'build-image');
  const dep = r.plan.nodes.find(n => n.jobKey === 'deploy');
  check('capstone build-image skipped on feature branch', bi.status === 'skipped');
  check('capstone deploy skipped on feature branch', dep.status === 'skipped');
  const rMain = runScenario(lesson, lesson.scenarios[0], lesson.solution);
  const biMain = rMain.plan.nodes.find(n => n.jobKey === 'build-image');
  const depMain = rMain.plan.nodes.find(n => n.jobKey === 'deploy');
  check('capstone build-image runs on main', biMain.status === 'success');
  check('capstone deploy runs on main', depMain.status === 'success');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

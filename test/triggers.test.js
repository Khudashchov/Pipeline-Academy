const yaml = require('js-yaml');
const { evaluateTrigger } = require('../src/engine/triggers.js');
let pass = 0, fail = 0;
function check(label, cond) { if (cond) pass++; else { fail++; console.log('FAIL:', label); } }

const on1 = yaml.load(`
push:
  branches: [main]
pull_request:
  branches: [main]
`);
check('push to main fires', evaluateTrigger(on1, { name: 'push', refName: 'main' }).fires === true);
check('push to feature does not fire', evaluateTrigger(on1, { name: 'push', refName: 'feature-x' }).fires === false);
check('pr to main fires default types', evaluateTrigger(on1, { name: 'pull_request', refName: 'main', prAction: 'opened' }).fires === true);
check('schedule not configured', evaluateTrigger(on1, { name: 'schedule' }).fires === false);

const on2 = yaml.load(`
schedule:
  - cron: '0 3 * * *'
workflow_dispatch:
  inputs:
    env: {type: choice, options: [staging, production]}
`);
check('schedule fires', evaluateTrigger(on2, { name: 'schedule' }).fires === true);
check('workflow_dispatch fires', evaluateTrigger(on2, { name: 'workflow_dispatch' }).fires === true);

const on3 = yaml.load(`
pull_request:
  types: [labeled]
  branches-ignore: [docs/*]
`);
check('pr opened not in types', evaluateTrigger(on3, { name: 'pull_request', refName: 'main', prAction: 'opened' }).fires === false);
check('pr labeled fires', evaluateTrigger(on3, { name: 'pull_request', refName: 'main', prAction: 'labeled' }).fires === true);
check('pr to docs branch ignored', evaluateTrigger(on3, { name: 'pull_request', refName: 'docs/readme', prAction: 'labeled' }).fires === false);

const on4 = yaml.load(`
push:
  branches: [main]
  paths:
    - 'services/api/**'
`);
check('path match fires', evaluateTrigger(on4, { name: 'push', refName: 'main', paths: ['services/api/handler.js'] }).fires === true);
check('path mismatch skips', evaluateTrigger(on4, { name: 'push', refName: 'main', paths: ['services/web/index.js'] }).fires === false);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

const yaml = require('js-yaml');
const { planRun, expandMatrix, topoLevels } = require('./scheduler.js');
let pass = 0, fail = 0;
function check(label, cond) { if (cond) pass++; else { fail++; console.log('FAIL:', label); } }

// 1. Basic needs ordering + parallel start
const wf1 = yaml.load(`
jobs:
  lint:
    runs-on: ubuntu-latest
    steps: [{run: "eslint ."}]
  test:
    runs-on: ubuntu-latest
    steps: [{run: "npm test"}]
  deploy:
    needs: [lint, test]
    runs-on: ubuntu-latest
    steps: [{run: "deploy.sh"}]
`);
const plan1 = planRun(wf1, { github: {}, env: {}, secrets: {} }, () => null);
check('3 nodes', plan1.nodes.length === 3);
check('deploy depends on lint+test', plan1.nodes.find(n => n.jobKey === 'deploy').needs.sort().join(',') === 'lint,test');
check('all succeed when no fault', plan1.overallStatus === 'success');
check('lint/test run before deploy (levels)', plan1.levelCount === 2);

// 2. Matrix expansion
const wf2 = yaml.load(`
jobs:
  build:
    strategy:
      matrix:
        node: [16, 18, 20]
        os: [ubuntu-latest, windows-latest]
    runs-on: \${{ matrix.os }}
    steps: [{run: "npm ci"}, {run: "npm test"}]
`);
check('6 matrix combos', expandMatrix(wf2.jobs.build.strategy).length === 6);
const plan2 = planRun(wf2, { github: {}, env: {}, secrets: {} }, () => null);
check('6 nodes from one job', plan2.nodes.length === 6);

// 3. Fault + fail-fast cancels siblings
const wf3 = yaml.load(`
jobs:
  build:
    strategy:
      matrix:
        node: [16, 18, 20]
    runs-on: ubuntu-latest
    steps: [{run: "npm ci"}, {run: "npm test"}]
`);
const plan3 = planRun(wf3, { github: {}, env: {}, secrets: {} }, (jobKey, matrixVals) => {
  return matrixVals && matrixVals.node === 16 ? { stepIndex: 1, message: 'Tests failed on Node 16' } : null;
});
const statuses3 = plan3.nodes.map(n => n.status);
check('one failure present', statuses3.includes('failure'));
check('fail-fast cancels later combos', statuses3.includes('cancelled'));

// 4. if: skips a job, and downstream job default-skips too (success() needed)
const wf4 = yaml.load(`
jobs:
  build:
    runs-on: ubuntu-latest
    steps: [{run: "build"}]
  deploy:
    needs: build
    if: "github.ref_name == 'main'"
    runs-on: ubuntu-latest
    steps: [{run: "deploy"}]
`);
const plan4 = planRun(wf4, { github: { ref_name: 'feature-x' }, env: {}, secrets: {} }, () => null);
check('deploy skipped on non-main branch', plan4.nodes.find(n => n.jobKey === 'deploy').status === 'skipped');

const plan4b = planRun(wf4, { github: { ref_name: 'main' }, env: {}, secrets: {} }, () => null);
check('deploy runs on main', plan4b.nodes.find(n => n.jobKey === 'deploy').status === 'success');

// 5. default behavior: downstream job auto-skips if upstream failed (no explicit if)
const wf5 = yaml.load(`
jobs:
  test:
    runs-on: ubuntu-latest
    steps: [{run: "npm test"}]
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps: [{run: "deploy"}]
`);
const plan5 = planRun(wf5, { github: {}, env: {}, secrets: {} }, (jobKey) => jobKey === 'test' ? { stepIndex: 0, message: 'tests failed' } : null);
check('deploy auto-skips after upstream failure', plan5.nodes.find(n => n.jobKey === 'deploy').status === 'skipped');

// 6. always() runs even after failure
const wf6 = yaml.load(`
jobs:
  test:
    runs-on: ubuntu-latest
    steps: [{run: "npm test"}]
  notify:
    needs: test
    if: always()
    runs-on: ubuntu-latest
    steps: [{run: "notify"}]
`);
const plan6 = planRun(wf6, { github: {}, env: {}, secrets: {} }, (jobKey) => jobKey === 'test' ? { stepIndex: 0, message: 'fail' } : null);
check('notify runs via always() despite upstream failure', plan6.nodes.find(n => n.jobKey === 'notify').status === 'success');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

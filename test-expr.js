const { evaluateExpression, interpolate } = require('./expr.js');
let pass = 0, fail = 0;
function check(label, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) { pass++; } else { fail++; console.log(`FAIL: ${label} -> got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)}`); }
}

const ctx = {
  github: { ref: 'refs/heads/main', ref_name: 'main', event_name: 'push', actor: 'bohdan' },
  env: { NODE_ENV: 'production' },
  secrets: { AWS_ROLE: 'present' },
  matrix: { node: 18, os: 'ubuntu-latest' },
  needs: { build: { result: 'success', outputs: { artifact_name: 'app-dist' } } },
  __jobStatus: 'success',
};

check('basic eq', evaluateExpression("${{ github.ref == 'refs/heads/main' }}", ctx), true);
check('neq', evaluateExpression("github.ref_name != 'dev'", ctx), true);
check('and', evaluateExpression("github.event_name == 'push' && github.ref_name == 'main'", ctx), true);
check('or false', evaluateExpression("github.event_name == 'pull_request' || github.ref_name == 'dev'", ctx), false);
check('not', evaluateExpression("!(github.ref_name == 'dev')", ctx), true);
check('contains', evaluateExpression("contains(github.ref, 'heads/main')", ctx), true);
check('startsWith', evaluateExpression("startsWith(github.ref, 'refs/heads')", ctx), true);
check('matrix number cmp', evaluateExpression('matrix.node >= 18', ctx), true);
check('needs result', evaluateExpression("needs.build.result == 'success'", ctx), true);
check('needs outputs', evaluateExpression("needs.build.outputs.artifact_name == 'app-dist'", ctx), true);
check('success() true', evaluateExpression('success()', ctx), true);
check('failure() false', evaluateExpression('failure()', ctx), false);
check('always() true', evaluateExpression('always()', { ...ctx, __jobStatus: 'failure' }), true);
check('failure() on failed job', evaluateExpression('failure()', { ...ctx, __jobStatus: 'failure' }), true);
check('bare expr no wrapper', evaluateExpression("github.ref_name == 'main'", ctx), true);
check('secret existence as string truthy', evaluateExpression('secrets.AWS_ROLE', ctx) ? true : false, true);
check('undefined secret falsy', evaluateExpression('secrets.MISSING', ctx) ? true : false, false);
check('interpolate', interpolate('Deploying ${{ needs.build.outputs.artifact_name }} to ${{ matrix.os }}', ctx), 'Deploying app-dist to ubuntu-latest');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

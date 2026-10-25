const { evaluateExpression, truthy } = require('./expr.js');

function toArray(v) {
  if (v === undefined || v === null) return [];
  return Array.isArray(v) ? v : [v];
}

// Cartesian-product expansion of a strategy.matrix block, honoring include/exclude at a basic level.
function expandMatrix(strategy) {
  if (!strategy || !strategy.matrix) return [null];
  const matrix = strategy.matrix;
  const dims = Object.keys(matrix).filter(k => k !== 'include' && k !== 'exclude' && Array.isArray(matrix[k]));
  let combos = [{}];
  for (const dim of dims) {
    const next = [];
    for (const combo of combos) for (const val of matrix[dim]) next.push({ ...combo, [dim]: val });
    combos = next;
  }
  if (combos.length === 0) combos = [{}];
  if (Array.isArray(matrix.exclude)) {
    combos = combos.filter(c => !matrix.exclude.some(ex => Object.keys(ex).every(k => String(c[k]) === String(ex[k]))));
  }
  if (Array.isArray(matrix.include)) {
    for (const inc of matrix.include) {
      const matchesExisting = combos.some(c => Object.keys(inc).every(k => dims.includes(k) ? String(c[k]) === String(inc[k]) : true));
      if (!matchesExisting || dims.length === 0) combos.push({ ...inc });
      else combos = combos.map(c => Object.keys(inc).every(k => !dims.includes(k) || String(c[k]) === String(inc[k])) ? { ...c, ...inc } : c);
    }
  }
  return combos;
}

// Kahn's-algorithm topological leveling: jobs with no unresolved `needs` share level 0, etc.
// Returns { levels: [[jobKey,...], ...], order: [jobKey,...] } or throws on a cycle.
function topoLevels(jobs) {
  const keys = Object.keys(jobs);
  const needsOf = k => toArray(jobs[k].needs).filter(n => keys.includes(n));
  const remaining = new Set(keys);
  const levels = [];
  const order = [];
  let guard = 0;
  while (remaining.size > 0 && guard++ < keys.length + 1) {
    const ready = [...remaining].filter(k => needsOf(k).every(n => !remaining.has(n)));
    if (ready.length === 0) break; // cycle; bail out, caller treats remaining as unreachable
    levels.push(ready);
    ready.forEach(k => { remaining.delete(k); order.push(k); });
  }
  if (remaining.size > 0) levels.push([...remaining]); // cyclic leftovers, surfaced rather than hidden
  return { levels, order, cyclic: remaining.size > 0 };
}

function aggregateNeedsStatus(needKeys, statusByJob) {
  if (needKeys.length === 0) return 'success';
  const statuses = needKeys.map(n => statusByJob[n] || 'success');
  if (statuses.some(s => s === 'cancelled')) return 'cancelled';
  if (statuses.some(s => s === 'failure')) return 'failure';
  if (statuses.some(s => s === 'skipped')) return 'skipped';
  return 'success';
}

// faultHook(jobKey, matrixVals, stepIndex, step) => { message } | null  -- marks one step as the
// scripted point of failure for lessons built around debugging a specific realistic mistake.
function planRun(workflow, context, faultHook) {
  const jobs = (workflow && workflow.jobs) || {};
  const keys = Object.keys(jobs);
  const { levels, cyclic } = topoLevels(jobs);
  const statusByJob = {};
  const outputsByJob = {};
  const nodes = [];
  const edges = [];

  levels.forEach((level, levelIdx) => {
    for (const jobKey of level) {
      const job = jobs[jobKey] || {};
      const needKeys = toArray(job.needs).filter(n => keys.includes(n));
      needKeys.forEach(n => edges.push({ from: n, to: jobKey }));
      const needsAgg = aggregateNeedsStatus(needKeys, statusByJob);
      const combos = expandMatrix(job.strategy);
      const failFast = job.strategy && job.strategy['fail-fast'] === false ? false : true;

      const combosResults = [];
      let sawFailure = false;
      combos.forEach((matrixVals, idx) => {
        const evalCtx = {
          ...context,
          needs: { ...context.needs, ...buildNeedsCtx(needKeys, statusByJob, outputsByJob) },
          matrix: matrixVals || {},
          __jobStatus: needsAgg,
        };
        const ifExpr = job.if !== undefined ? job.if : 'success()';
        const gatePasses = truthy(evaluateExpression(String(ifExpr), evalCtx));

        let status = 'success';
        let steps = toArray(job.steps).map((s, i) => ({
          name: s.name || (s.uses ? `Run ${s.uses}` : (s.run ? s.run.split('\n')[0].slice(0, 60) : `Step ${i + 1}`)),
          kind: s.uses ? 'uses' : 'run',
          raw: s,
          fail: false,
          failMessage: null,
        }));

        if (!gatePasses) {
          status = 'skipped';
        } else if (failFast && sawFailure) {
          status = 'cancelled';
        } else {
          const fault = faultHook ? faultHook(jobKey, matrixVals, job) : null;
          if (fault) {
            sawFailure = true;
            status = 'failure';
            const idx2 = Math.max(0, Math.min(steps.length - 1, fault.stepIndex ?? steps.length - 1));
            if (steps[idx2]) { steps[idx2].fail = true; steps[idx2].failMessage = fault.message; }
            // steps after the failing one never ran
            steps = steps.map((s, i) => i > idx2 ? { ...s, kind: s.kind, skippedAfterFailure: true } : s);
          }
        }

        combosResults.push({ matrixVals, status, steps, evalCtx });
      });

      const overallJobStatus = combosResults.some(c => c.status === 'failure') ? 'failure'
        : combosResults.some(c => c.status === 'cancelled') ? 'cancelled'
        : combosResults.every(c => c.status === 'skipped') ? 'skipped'
        : 'success';
      statusByJob[jobKey] = overallJobStatus;
      outputsByJob[jobKey] = job.outputs || {};

      combosResults.forEach((c, idx) => {
        nodes.push({
          id: combos.length > 1 ? `${jobKey}__${idx}` : jobKey,
          jobKey,
          level: levelIdx,
          label: job.name || jobKey,
          matrixLabel: c.matrixVals ? Object.entries(c.matrixVals).map(([k, v]) => `${k}: ${v}`).join(', ') : null,
          needs: needKeys,
          status: c.status,
          steps: c.steps,
          environment: job.environment ? (typeof job.environment === 'string' ? job.environment : job.environment.name) : null,
          runsOn: job['runs-on'],
          ctx: c.evalCtx,
          ifExpr: job.if !== undefined ? String(job.if) : null,
        });
      });
    }
  });

  const overallStatus = nodes.length === 0 ? 'empty'
    : nodes.some(n => n.status === 'failure') ? 'failure'
    : nodes.every(n => n.status === 'skipped') ? 'skipped'
    : 'success';

  return { nodes, edges, overallStatus, cyclic, levelCount: levels.length };
}

function buildNeedsCtx(needKeys, statusByJob, outputsByJob) {
  const out = {};
  for (const k of needKeys) out[k] = { result: statusByJob[k] || 'success', outputs: outputsByJob[k] || {} };
  return out;
}

module.exports = { expandMatrix, topoLevels, planRun };

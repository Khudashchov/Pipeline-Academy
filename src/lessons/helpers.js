// Shared helpers used by lesson check functions to inspect a parsed workflow object.

function Y(...lines) { return lines.join('\n'); }

function toArray(v) { if (v === undefined || v === null) return []; return Array.isArray(v) ? v : [v]; }

function getJobs(parsed) { return (parsed && typeof parsed === 'object' && parsed.jobs) || {}; }

function allSteps(parsed) {
  const jobs = getJobs(parsed);
  const out = [];
  Object.keys(jobs).forEach(jobKey => {
    toArray(jobs[jobKey] && jobs[jobKey].steps).forEach((step, index) => out.push({ jobKey, index, step }));
  });
  return out;
}

function stepsOf(parsed, jobKey) { const jobs = getJobs(parsed); return toArray(jobs[jobKey] && jobs[jobKey].steps); }

function anyStep(parsed, pred) { return allSteps(parsed).some(({ step }) => { try { return pred(step); } catch (e) { return false; } }); }

function stepInJob(parsed, jobKey, pred) { return stepsOf(parsed, jobKey).some(step => { try { return pred(step); } catch (e) { return false; } }); }

function usesMatches(step, re) { return !!step && typeof step.uses === 'string' && re.test(step.uses); }

function runIncludes(step, re) { return !!step && typeof step.run === 'string' && re.test(step.run); }

function anyStepUses(parsed, re) { return anyStep(parsed, s => usesMatches(s, re)); }

function anyStepRuns(parsed, re) { return anyStep(parsed, s => runIncludes(s, re)); }

function hasJob(parsed, jobKey) { return !!getJobs(parsed)[jobKey]; }

function job(parsed, jobKey) { return getJobs(parsed)[jobKey] || {}; }

function needsOf(parsed, jobKey) { return toArray(job(parsed, jobKey).needs); }

function anyRawLineMatches(raw, re) { return raw.split('\n').some(line => re.test(line)); }

if (typeof module !== 'undefined') {
  module.exports = { Y, toArray, getJobs, allSteps, stepsOf, anyStep, stepInJob, usesMatches, runIncludes, anyStepUses, anyStepRuns, hasJob, job, needsOf, anyRawLineMatches };
}

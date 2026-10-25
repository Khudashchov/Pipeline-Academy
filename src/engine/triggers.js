// Evaluates whether a workflow's `on:` block would fire for a simulated event. Supports the push /
// pull_request(_target) / schedule / workflow_dispatch / workflow_call shapes used across the lessons,
// including branch/tag/path filters and pull_request `types:`.

function globToRegExp(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*' && glob[i + 1] === '*') { re += '.*'; i++; }
    else if (c === '*') re += '[^/]*';
    else if (c === '?') re += '[^/]';
    else re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp('^' + re + '$');
}

function matchesAny(value, patterns) {
  if (!patterns) return undefined; // not configured -> caller decides default
  const list = Array.isArray(patterns) ? patterns : [patterns];
  return list.some(p => globToRegExp(String(p)).test(value));
}

function normalizeOn(onRaw) {
  if (onRaw == null) return {};
  if (typeof onRaw === 'string') return { [onRaw]: null };
  if (Array.isArray(onRaw)) { const o = {}; onRaw.forEach(k => { o[k] = null; }); return o; }
  return onRaw;
}

function evaluateTrigger(onRaw, event) {
  const on = normalizeOn(onRaw);
  const name = event.name;
  if (!(name in on)) return { fires: false, reason: `workflow has no "${name}" trigger configured` };
  const cfg = on[name] || {};

  if (name === 'push') {
    if (cfg['branches-ignore'] && matchesAny(event.refName, cfg['branches-ignore'])) return { fires: false, reason: `${event.refName} matches branches-ignore` };
    if (cfg.branches && !matchesAny(event.refName, cfg.branches)) return { fires: false, reason: `${event.refName} does not match branches filter` };
    if (cfg['tags-ignore'] && event.isTag && matchesAny(event.refName, cfg['tags-ignore'])) return { fires: false, reason: 'tag matches tags-ignore' };
    if (cfg.tags && event.isTag && !matchesAny(event.refName, cfg.tags)) return { fires: false, reason: 'tag does not match tags filter' };
    if (event.paths) {
      if (cfg['paths-ignore'] && event.paths.every(p => matchesAny(p, cfg['paths-ignore']))) return { fires: false, reason: 'all changed paths match paths-ignore' };
      if (cfg.paths && !event.paths.some(p => matchesAny(p, cfg.paths))) return { fires: false, reason: 'no changed path matches the paths filter' };
    }
    return { fires: true, reason: `push to ${event.refName} matches configured filters` };
  }

  if (name === 'pull_request' || name === 'pull_request_target') {
    const defaultTypes = ['opened', 'synchronize', 'reopened'];
    const types = cfg.types || defaultTypes;
    if (event.prAction && !types.includes(event.prAction)) return { fires: false, reason: `activity type "${event.prAction}" is not in types: [${types.join(', ')}]` };
    if (cfg['branches-ignore'] && matchesAny(event.refName, cfg['branches-ignore'])) return { fires: false, reason: `base branch ${event.refName} matches branches-ignore` };
    if (cfg.branches && !matchesAny(event.refName, cfg.branches)) return { fires: false, reason: `base branch ${event.refName} does not match branches filter` };
    if (event.paths) {
      if (cfg['paths-ignore'] && event.paths.every(p => matchesAny(p, cfg['paths-ignore']))) return { fires: false, reason: 'all changed paths match paths-ignore' };
      if (cfg.paths && !event.paths.some(p => matchesAny(p, cfg.paths))) return { fires: false, reason: 'no changed path matches the paths filter' };
    }
    return { fires: true, reason: `${name} (${event.prAction || 'opened'}) targeting ${event.refName} matches configured filters` };
  }

  if (name === 'schedule') return { fires: true, reason: 'scheduled trigger fired on cron' };
  if (name === 'workflow_dispatch') return { fires: true, reason: 'manually dispatched from the Actions tab' };
  if (name === 'workflow_call') return { fires: true, reason: 'invoked by a caller workflow' };
  return { fires: true, reason: `${name} event received` };
}

module.exports = { evaluateTrigger, globToRegExp };

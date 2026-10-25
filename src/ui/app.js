(function () {
  'use strict';

  /* ---------------- Storage helpers ---------------- */
  function safeGet(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
  function safeSet(key, val) { try { localStorage.setItem(key, val); } catch (e) {} }

  var PROGRESS_KEY = 'pipelineAcademy.progress.v1';
  var LAST_KEY = 'pipelineAcademy.last.v1';
  function codeKey(id) { return 'pipelineAcademy.code.v1.' + id; }

  var progress = new Set();
  try { progress = new Set(JSON.parse(safeGet(PROGRESS_KEY) || '[]')); } catch (e) { progress = new Set(); }

  /* ---------------- Flatten curriculum ---------------- */
  var ALL = [];
  MODULES.forEach(function (m, mi) {
    m.lessons.forEach(function (l, li) { ALL.push({ lesson: l, module: m, mi: mi, li: li }); });
  });
  function findEntry(id) { for (var i = 0; i < ALL.length; i++) if (ALL[i].lesson.id === id) return ALL[i]; return null; }
  function entryIndex(id) { for (var i = 0; i < ALL.length; i++) if (ALL[i].lesson.id === id) return i; return -1; }

  /* ---------------- Simulated repository context ---------------- */
  var DEFAULT_GITHUB = { repository: 'kpi-labs/orbit-api', actor: 'bohdan', sha: '9f1c3abddeadbeef9f1c3abddeadbeef9f1c3ab', run_number: 128, workflow: 'CI' };
  var DEFAULT_SECRETS = { DEPLOY_TOKEN: 'x', AWS_ROLE_ARN: 'x', AZURE_CLIENT_ID: 'x', AZURE_TENANT_ID: 'x', AZURE_SUBSCRIPTION_ID: 'x', GITHUB_TOKEN: 'x' };

  function buildContext(parsed, event) {
    return {
      github: {
        repository: DEFAULT_GITHUB.repository, actor: DEFAULT_GITHUB.actor, sha: DEFAULT_GITHUB.sha,
        run_number: DEFAULT_GITHUB.run_number, workflow: (parsed && parsed.name) || DEFAULT_GITHUB.workflow,
        ref: (event.isTag ? 'refs/tags/' : 'refs/heads/') + (event.refName || 'main'),
        ref_name: event.refName || 'main', base_ref: event.refName || 'main', event_name: event.name,
      },
      env: (parsed && parsed.env) || {},
      secrets: DEFAULT_SECRETS,
      vars: {},
    };
  }

  function genericFaultHook(scenario) {
    return function (jobKey, matrixVals, jobObj) {
      var ov = scenario && scenario.overrides;
      if (!ov) return null;
      if (ov.forceFail === jobKey) {
        var steps = jobObj.steps || [];
        var idx = steps.length - 1;
        var last = steps[idx] || {};
        var label = last.name || (last.run ? String(last.run).split('\n')[0] : 'step');
        return { stepIndex: idx, message: t('run.stepFailed', { step: label }) };
      }
      if (ov.forceFailMatrix && ov.forceFailMatrix.jobKey === jobKey && matrixVals) {
        var match = ov.forceFailMatrix.match;
        var hit = Object.keys(match).every(function (k) { return String(matrixVals[k]) === String(match[k]); });
        if (hit) {
          var steps2 = jobObj.steps || [];
          return { stepIndex: steps2.length - 1, message: ov.forceFailMatrix.message || 'Step failed.' };
        }
      }
      return null;
    };
  }

  /* ---------------- Lesson check API ---------------- */
  function buildApi(rawText) {
    var parsed = null, parses = true, parseError = null;
    try { parsed = jsyaml.load(rawText); if (parsed == null || typeof parsed !== 'object') parsed = {}; }
    catch (e) { parses = false; parsed = {}; parseError = e; }
    var api = {
      raw: rawText, parsed: parsed, parses: parses, parseError: parseError,
      toArray: toArray,
      hasJob: function (k) { return hasJob(parsed, k); },
      job: function (k) { return job(parsed, k); },
      needsOf: function (k) { return needsOf(parsed, k); },
      stepsOf: function (k) { return stepsOf(parsed, k); },
      stepInJob: function (k, pred) { return stepInJob(parsed, k, pred); },
      anyStepUses: function (re) { return anyStepUses(parsed, re); },
      anyStepRuns: function (re) { return anyStepRuns(parsed, re); },
      usesMatches: usesMatches,
      runMatches: runIncludes,
      countStepRuns: function (re) {
        return allSteps(parsed).reduce(function (n, s) {
          if (typeof s.step.run !== 'string') return n;
          var m = s.step.run.match(re);
          return n + (m ? m.length : 0);
        }, 0);
      },
      anyRawLineMatches: function (re) { return anyRawLineMatches(rawText, re); },
      evalIf: function (jobKey, extraCtx) {
        extraCtx = extraCtx || {};
        var j = job(parsed, jobKey);
        var expr = j.if !== undefined ? j.if : 'success()';
        var ctx = Object.assign({ github: {}, env: {}, secrets: {}, matrix: {}, needs: {}, __jobStatus: 'success' }, extraCtx);
        return !!evaluateExpression(String(expr), ctx);
      },
    };
    return api;
  }

  /* ---------------- Small utilities ---------------- */
  function escapeHtml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function delay(ms) { return new Promise(function (res) { setTimeout(res, ms); }); }
  function debounce(fn, ms) { var t; return function () { var args = arguments, ctx = this; clearTimeout(t); t = setTimeout(function () { fn.apply(ctx, args); }, ms); }; }

  /* ---------------- App state ---------------- */
  var currentId = null;
  var currentScenarioId = null;
  var runToken = 0;
  var hintsRevealed = 0;
  var resetArmed = false, solutionArmed = false;
  var pendingApprovals = Object.create(null);

  var mainEl = document.getElementById('main');
  var sidebarEl = document.getElementById('sidebar');
  var progressFillEl = document.getElementById('progressFill');
  var progressLabelEl = document.getElementById('progressLabel');
  var layoutEl = document.getElementById('layout');

  function scenariosFor(lesson) {
    return (lesson.scenarios && lesson.scenarios.length) ? lesson.scenarios : [{ id: 'default', label: 'Push to main', event: { name: 'push', refName: 'main' } }];
  }

  function scenarioLabel(lesson, s) {
    if (!lesson.scenarios || !lesson.scenarios.length) return t('run.defaultScenario');
    return localized(lesson, 'scenarios', s.id) || s.label;
  }

  function triggerReason(trig) { return trig.code ? t('trig.' + trig.code, trig.params) : trig.reason; }

  /* ---------------- Static page chrome ---------------- */
  var langBtn = document.getElementById('langToggle');
  function renderChrome() {
    document.title = t('doc.title');
    document.getElementById('sidebarToggle').innerHTML = t('top.modules');
    document.getElementById('labNote').textContent = t('labNote');
    langBtn.textContent = t('top.langSwitch');
    langBtn.title = t('top.langSwitchTitle');
  }
  langBtn.addEventListener('click', function () {
    setLang(getLang() === 'uk' ? 'en' : 'uk');
    runToken++;
    renderChrome();
    renderLesson(currentId);
  });

  /* ---------------- Sidebar ---------------- */
  function renderSidebar() {
    var html = '';
    MODULES.forEach(function (m, mi) {
      html += '<div class="module-group"><div class="module-head"><span class="module-num">' + (mi) + '</span><span>' + escapeHtml(localized(m, 'title')) + '</span></div>';
      m.lessons.forEach(function (l) {
        var done = progress.has(l.id);
        var active = l.id === currentId;
        html += '<button type="button" class="lesson-link' + (done ? ' done' : '') + (active ? ' active' : '') + '" data-lesson="' + l.id + '">' +
          '<span class="dot">' + (done ? '✓' : '') + '</span><span class="label">' + escapeHtml(localized(l, 'title')) + '</span></button>';
      });
      html += '</div>';
    });
    sidebarEl.innerHTML = html;
    sidebarEl.querySelectorAll('.lesson-link').forEach(function (btn) {
      btn.addEventListener('click', function () { navigate(btn.getAttribute('data-lesson')); closeMobileSidebar(); });
    });
    var activeBtn = sidebarEl.querySelector('.lesson-link.active');
    if (activeBtn && activeBtn.scrollIntoView) activeBtn.scrollIntoView({ block: 'nearest' });
  }

  function updateProgressUI() {
    var pct = Math.round((progress.size / ALL.length) * 100);
    progressFillEl.style.width = pct + '%';
    progressLabelEl.textContent = progress.size + ' / ' + ALL.length;
  }

  function closeMobileSidebar() { layoutEl.classList.remove('sidebar-open'); }

  /* ---------------- Lesson rendering ---------------- */
  function renderLesson(id) {
    var entry = findEntry(id);
    if (!entry) { entry = ALL[0]; id = entry.lesson.id; }
    currentId = id;
    hintsRevealed = 0; resetArmed = false; solutionArmed = false;
    var lesson = entry.lesson, mod = entry.module;
    var scenarios = scenariosFor(lesson);
    currentScenarioId = scenarios[0].id;

    safeSet(LAST_KEY, id);
    try { history.replaceState(null, '', '#' + id); } catch (e) {}

    var tipHtml = lesson.tip ? '<p class="tip">' + localized(lesson, 'tip') + '</p>' : '';
    var scenarioChips = scenarios.map(function (s, i) {
      return '<button type="button" class="chip' + (i === 0 ? ' active' : '') + '" data-scenario="' + s.id + '">' + escapeHtml(scenarioLabel(lesson, s)) + '</button>';
    }).join('');

    mainEl.innerHTML =
      '<div class="lesson-eyebrow">' + t('lesson.eyebrow', { mi: entry.mi, module: escapeHtml(localized(mod, 'title')), li: entry.li + 1 }) + '</div>' +
      '<h1 class="lesson-title">' + escapeHtml(localized(lesson, 'title')) + '</h1>' +
      '<div class="mission-banner"><span class="mission-label">' + t('lesson.mission') + '</span><span class="mission-text">' + escapeHtml(localized(lesson, 'objective')) + '</span></div>' +
      '<div class="lesson-intro">' + localized(lesson, 'intro') + tipHtml + '</div>' +
      '<div class="workbench">' +
        '<div class="pane editor-pane">' +
          '<div class="pane-header"><span>workflow.yml</span><div class="editor-actions">' +
            '<button class="btn btn-ghost btn-sm" id="hintBtn" type="button">' + t('editor.hint') + '</button>' +
            '<button class="btn btn-ghost btn-sm" id="resetBtn" type="button">' + t('editor.reset') + '</button>' +
            '<button class="btn btn-ghost btn-sm" id="solutionBtn" type="button">' + t('editor.solution') + '</button>' +
          '</div></div>' +
          '<div class="editor-wrap">' +
            '<div class="editor-gutter" id="editorGutter"></div>' +
            '<div class="editor-stage" id="editorStage">' +
              '<pre class="editor-highlight" id="editorHighlight" aria-hidden="true"></pre>' +
              '<textarea class="editor-input" id="editorInput" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" wrap="off"></textarea>' +
            '</div>' +
          '</div>' +
          '<div id="errorStrip"></div>' +
          '<div class="hint-box" id="hintBox" hidden></div>' +
        '</div>' +
        '<div class="pane run-pane">' +
          '<div class="pane-header"><span>' + t('run.pane') + '</span></div>' +
          '<div class="run-pane-body">' +
            (scenarios.length > 1 ? '<div class="scenario-row" id="scenarioRow">' + scenarioChips + '</div>' : '') +
            '<button class="btn btn-accent btn-run" id="runBtn" type="button">' + t('run.button') + '</button>' +
            '<div class="run-output" id="runOutput"><div class="run-empty">' + t('run.empty') + '</div></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="checklist-panel">' +
        '<div class="pane-header"><span>' + t('check.title') + '</span><span class="checklist-count" id="checklistCount"></span></div>' +
        '<ul class="checklist" id="checklist"></ul>' +
        '<div class="lesson-complete" id="lessonComplete" hidden><span class="lesson-complete-text">' + t('check.complete') + '</span><button class="btn btn-accent" id="nextBtn" type="button">' + t('check.next') + '</button></div>' +
      '</div>';

    mainEl.scrollTop = 0; window.scrollTo(0, 0);

    var editorInput = document.getElementById('editorInput');
    var saved = safeGet(codeKey(id));
    editorInput.value = saved != null ? saved : lesson.starter;

    wireEditor(lesson);
    wireScenarioRow();
    wireActions(lesson);
    syncEditorVisuals();
    resetEditorScroll();
    runChecklist();
    renderSidebar();
  }

  /* ---------------- Editor ---------------- */
  function syncEditorVisuals() {
    var input = document.getElementById('editorInput');
    var hi = document.getElementById('editorHighlight');
    var gutter = document.getElementById('editorGutter');
    hi.innerHTML = highlightYaml(input.value) + '\n';
    var lineCount = input.value.split('\n').length;
    var nums = [];
    for (var i = 1; i <= lineCount; i++) nums.push(i);
    gutter.textContent = nums.join('\n');
  }

  // Whenever the editor's value is replaced wholesale (switching lessons, Reset, Reveal solution),
  // the caret otherwise lands wherever the browser's value-assignment left it -- usually the end of
  // the file -- which scrolls the pane there too. Force it back to a clean top-left resting state.
  function resetEditorScroll() {
    var input = document.getElementById('editorInput');
    var hi = document.getElementById('editorHighlight');
    var gutter = document.getElementById('editorGutter');
    if (!input) return;
    input.setSelectionRange(0, 0);
    input.scrollTop = 0; input.scrollLeft = 0;
    if (hi) hi.style.transform = 'translate(0px,0px)';
    if (gutter) gutter.scrollTop = 0;
  }

  function wireEditor(lesson) {
    var input = document.getElementById('editorInput');
    var hi = document.getElementById('editorHighlight');
    var gutter = document.getElementById('editorGutter');
    var stage = document.getElementById('editorStage');

    input.addEventListener('input', function () {
      syncEditorVisuals();
      safeSet(codeKey(lesson.id), input.value);
      debouncedChecklist();
    });
    input.addEventListener('scroll', function () {
      hi.style.transform = 'translate(' + (-input.scrollLeft) + 'px,' + (-input.scrollTop) + 'px)';
      gutter.scrollTop = input.scrollTop;
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Tab') {
        e.preventDefault();
        var s = input.selectionStart, en = input.selectionEnd;
        input.setRangeText('  ', s, en, 'end');
        syncEditorVisuals();
        safeSet(codeKey(lesson.id), input.value);
        debouncedChecklist();
      }
    });
  }

  var debouncedChecklist = debounce(function () { runChecklist(); }, 220);

  /* ---------------- Checklist ---------------- */
  function runChecklist() {
    var entry = findEntry(currentId);
    var lesson = entry.lesson;
    var input = document.getElementById('editorInput');
    if (!input) return;
    var api = buildApi(input.value);
    var errorStrip = document.getElementById('errorStrip');
    if (!api.parses) {
      var msg = api.parseError && api.parseError.message ? api.parseError.message.split('\n')[0] : t('editor.unparseable');
      errorStrip.innerHTML = '<span>&#9888;</span><span>' + t('editor.syntaxError', { msg: escapeHtml(msg) }) + '</span>';
    } else {
      errorStrip.innerHTML = '';
    }
    var results = lesson.checks.map(function (c, i) {
      var pass = false;
      try { pass = !!c.test(api); } catch (e) { pass = false; }
      return { label: localized(lesson, 'checks', i), pass: pass };
    });
    var listEl = document.getElementById('checklist');
    listEl.innerHTML = results.map(function (r) {
      return '<li class="' + (r.pass ? 'pass' : 'fail') + '"><span class="mk">' + (r.pass ? '✓' : '') + '</span><span>' + r.label + '</span></li>';
    }).join('');
    var passCount = results.filter(function (r) { return r.pass; }).length;
    document.getElementById('checklistCount').textContent = passCount + ' / ' + results.length;

    var allPass = api.parses && passCount === results.length && results.length > 0;
    var completeBox = document.getElementById('lessonComplete');
    if (allPass) {
      completeBox.hidden = false;
      if (!progress.has(lesson.id)) {
        progress.add(lesson.id);
        safeSet(PROGRESS_KEY, JSON.stringify(Array.from(progress)));
        updateProgressUI();
        renderSidebar();
      }
      var nextBtn = document.getElementById('nextBtn');
      var idx = entryIndex(lesson.id);
      var next = ALL[idx + 1];
      if (next) {
        nextBtn.hidden = false;
        nextBtn.textContent = t('check.next');
        nextBtn.onclick = function () { navigate(next.lesson.id); };
      } else {
        nextBtn.hidden = true;
        completeBox.querySelector('.lesson-complete-text').textContent = t('check.finished');
      }
    } else {
      completeBox.hidden = true;
    }
  }

  /* ---------------- Hint / Reset / Solution ---------------- */
  function wireActions(lesson) {
    var hintBtn = document.getElementById('hintBtn');
    var hintBox = document.getElementById('hintBox');
    hintBtn.addEventListener('click', function () {
      if (!lesson.hints || !lesson.hints.length) return;
      if (hintsRevealed < lesson.hints.length) hintsRevealed++;
      hintBox.hidden = false;
      hintBox.innerHTML = '<ol>' + lesson.hints.slice(0, hintsRevealed).map(function (h, i) { return '<li>' + localized(lesson, 'hints', i) + '</li>'; }).join('') + '</ol>' +
        (hintsRevealed < lesson.hints.length ? '' : '<div style="color:var(--muted);font-size:12px;">' + t('editor.allHints') + '</div>');
      hintBtn.textContent = hintsRevealed < lesson.hints.length ? t('editor.anotherHint') : t('editor.noMoreHints');
    });

    var resetBtn = document.getElementById('resetBtn');
    resetBtn.addEventListener('click', function () {
      if (!resetArmed) {
        resetArmed = true;
        resetBtn.textContent = t('editor.resetConfirm');
        setTimeout(function () { resetArmed = false; resetBtn.textContent = t('editor.reset'); }, 3000);
        return;
      }
      var input = document.getElementById('editorInput');
      input.value = lesson.starter;
      safeSet(codeKey(lesson.id), input.value);
      syncEditorVisuals();
      resetEditorScroll();
      runChecklist();
      resetArmed = false; resetBtn.textContent = t('editor.reset');
    });

    var solutionBtn = document.getElementById('solutionBtn');
    solutionBtn.addEventListener('click', function () {
      if (!solutionArmed) {
        solutionArmed = true;
        solutionBtn.textContent = t('editor.solutionConfirm');
        setTimeout(function () { solutionArmed = false; solutionBtn.textContent = t('editor.solution'); }, 3000);
        return;
      }
      var input = document.getElementById('editorInput');
      input.value = lesson.solution;
      safeSet(codeKey(lesson.id), input.value);
      syncEditorVisuals();
      resetEditorScroll();
      runChecklist();
      solutionArmed = false; solutionBtn.textContent = t('editor.solution');
    });

    document.getElementById('runBtn').addEventListener('click', function () { doRun(lesson); });
  }

  function wireScenarioRow() {
    var row = document.getElementById('scenarioRow');
    if (!row) return;
    row.querySelectorAll('.chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        row.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        currentScenarioId = chip.getAttribute('data-scenario');
      });
    });
  }

  /* ---------------- Run simulation ---------------- */
  function stepGlyph(status) {
    if (status === 'done') return '✓';
    if (status === 'failed') return '✗';
    if (status === 'running') return '●';
    if (status === 'skipped') return '—';
    return '·';
  }

  function renderNodeSkeleton(node) {
    var stepsHtml = node.steps.map(function (s) {
      return '<li data-step="1" class="pending"><span class="mk">' + stepGlyph('pending') + '</span><span class="t">' + escapeHtml(s.name) + '</span></li>';
    }).join('');
    return '<div class="dag-node" data-status="pending" data-node="' + node.id + '">' +
      '<div class="dag-node-head"><span class="dag-node-name">' + escapeHtml(node.label) + '</span><span class="status-pill pending">' + t('status.queued') + '</span></div>' +
      (node.matrixLabel ? '<div class="dag-node-matrix">' + escapeHtml(node.matrixLabel) + '</div>' : '') +
      '<ul class="step-list">' + stepsHtml + '</ul>' +
      '<div class="approve-slot"></div>' +
    '</div>';
  }

  function renderDagSkeleton(plan) {
    var byLevel = {};
    plan.nodes.forEach(function (n) { (byLevel[n.level] = byLevel[n.level] || []).push(n); });
    var levelKeys = Object.keys(byLevel).map(Number).sort(function (a, b) { return a - b; });
    var html = '<div class="dag" id="dagRoot"><div id="dagBanner"></div>';
    levelKeys.forEach(function (lvl, i) {
      if (i > 0) html += '<div class="dag-arrow">' + t('run.then') + '</div>';
      html += '<div class="dag-level">' + byLevel[lvl].map(renderNodeSkeleton).join('') + '</div>';
    });
    html += '</div><div class="console" id="consoleEl"></div>';
    return html;
  }

  function appendLog(consoleEl, text, cls) {
    var div = document.createElement('div');
    div.className = 'line ' + (cls || '');
    div.textContent = text;
    consoleEl.appendChild(div);
    consoleEl.scrollTop = consoleEl.scrollHeight;
  }

  function setNodeStatus(outputEl, node, status, pillText) {
    var el = outputEl.querySelector('[data-node="' + node.id + '"]');
    if (!el) return;
    el.setAttribute('data-status', status);
    var pill = el.querySelector('.status-pill');
    pill.className = 'status-pill ' + status;
    pill.textContent = pillText || status;
  }

  function skipReason(node) {
    if (node.ifExpr) return t('run.skipIf', { expr: node.ifExpr });
    return t('run.skipNeeds');
  }

  async function animateNode(outputEl, consoleEl, node, scenario, myToken) {
    if (runToken !== myToken) return;
    var el = outputEl.querySelector('[data-node="' + node.id + '"]');
    if (!el) return;

    if (node.status === 'skipped') {
      setNodeStatus(outputEl, node, 'skipped', t('status.skipped'));
      el.querySelectorAll('.step-list li').forEach(function (li) { li.className = 'skipped'; li.querySelector('.mk').textContent = stepGlyph('skipped'); });
      appendLog(consoleEl, t('run.jobSkipped', { job: node.label, reason: skipReason(node) }), 'dim');
      return;
    }
    if (node.status === 'cancelled') {
      setNodeStatus(outputEl, node, 'cancelled', t('status.cancelled'));
      el.querySelectorAll('.step-list li').forEach(function (li) { li.className = 'skipped'; li.querySelector('.mk').textContent = stepGlyph('skipped'); });
      appendLog(consoleEl, t('run.jobCancelled', { job: node.label }), 'dim');
      return;
    }

    setNodeStatus(outputEl, node, 'running', t('status.running'));
    appendLog(consoleEl, t('run.jobStart', { job: node.label + (node.matrixLabel ? ' (' + node.matrixLabel + ')' : '') }), 'sys');

    var stepLis = el.querySelectorAll('.step-list li');
    var failed = false;
    for (var i = 0; i < node.steps.length; i++) {
      if (runToken !== myToken) return;
      var step = node.steps[i];
      var li = stepLis[i];
      if (failed || step.skippedAfterFailure) { li.className = 'skipped'; li.querySelector('.mk').textContent = stepGlyph('skipped'); continue; }
      li.className = 'running'; li.querySelector('.mk').textContent = stepGlyph('running');
      await delay(260);
      if (runToken !== myToken) return;
      var cmdText = step.kind === 'uses' ? ('Run ' + (step.raw.uses || '')) : interpolate(step.raw.run || '', node.ctx || {});
      appendLog(consoleEl, '$ ' + cmdText, 'cmd');
      if (step.fail) {
        appendLog(consoleEl, 'Error: ' + step.failMessage, 'err');
        li.className = 'failed'; li.querySelector('.mk').textContent = stepGlyph('failed');
        failed = true;
      } else {
        appendLog(consoleEl, canned(step), 'ok');
        li.className = 'done'; li.querySelector('.mk').textContent = stepGlyph('done');
      }
    }

    if (failed) { setNodeStatus(outputEl, node, 'failure', t('status.failed')); return; }

    if (node.environment && scenario.overrides && scenario.overrides.protectedEnvironments && scenario.overrides.protectedEnvironments.indexOf(node.environment) !== -1) {
      setNodeStatus(outputEl, node, 'waiting', t('status.approval'));
      appendLog(consoleEl, t('run.waiting', { env: node.environment }), 'sys');
      var slot = el.querySelector('.approve-slot');
      slot.innerHTML = '<div class="approve-row"><span>' + t('run.environment') + ' <strong>' + escapeHtml(node.environment) + '</strong></span><button class="btn btn-accent btn-sm" type="button">' + t('run.approve') + '</button></div>';
      await new Promise(function (resolve) {
        slot.querySelector('button').addEventListener('click', function () { slot.innerHTML = ''; resolve(); }, { once: true });
      });
      if (runToken !== myToken) return;
      appendLog(consoleEl, t('run.approved', { env: node.environment }), 'sys');
    }

    setNodeStatus(outputEl, node, 'success', t('status.success'));
  }

  function canned(step) {
    if (step.kind === 'uses') {
      var u = String(step.raw.uses || '');
      if (/checkout/.test(u)) return 'Cloning into \'.\'... done.';
      if (/setup-node/.test(u)) return 'Node.js installed, added to PATH.';
      if (/cache/.test(u)) return 'Cache restored from key match.';
      if (/upload-artifact/.test(u)) return 'Artifact uploaded successfully.';
      if (/download-artifact/.test(u)) return 'Artifact downloaded successfully.';
      if (/login-action/.test(u)) return 'Login Succeeded.';
      if (/build-push-action/.test(u)) return 'Image built and pushed.';
      if (/configure-aws-credentials/.test(u)) return 'Assumed role via OIDC. Credentials configured.';
      if (/azure\/login/.test(u)) return 'Login successful via federated credential.';
      return 'Completed successfully.';
    }
    return 'Process completed with exit code 0.';
  }

  async function doRun(lesson) {
    var input = document.getElementById('editorInput');
    var api = buildApi(input.value);
    var outputEl = document.getElementById('runOutput');
    var myToken = ++runToken;

    if (!api.parses) {
      var msg = api.parseError && api.parseError.message ? api.parseError.message : t('run.noParse');
      outputEl.innerHTML = '<div class="trigger-skip"><strong>' + t('run.cantRun') + '</strong>' + escapeHtml(msg.split('\n')[0]) + '</div>';
      return;
    }

    var scenarios = scenariosFor(lesson);
    var scenario = scenarios.filter(function (s) { return s.id === currentScenarioId; })[0] || scenarios[0];
    var event = scenario.event || { name: 'push', refName: 'main' };
    var trig = evaluateTrigger(api.parsed.on, event);
    if (!trig.fires) {
      outputEl.innerHTML = '<div class="trigger-skip"><strong>' + t('run.didNotRun') + '</strong>' + escapeHtml(triggerReason(trig)) + '</div>';
      return;
    }

    var ctx = buildContext(api.parsed, event);
    var plan;
    try { plan = planRun(api.parsed, ctx, genericFaultHook(scenario)); }
    catch (e) { outputEl.innerHTML = '<div class="trigger-skip"><strong>' + t('run.noGraph') + '</strong>' + escapeHtml(e.message) + '</div>'; return; }

    if (plan.nodes.length === 0) {
      outputEl.innerHTML = '<div class="trigger-skip"><strong>' + t('run.noJobs') + '</strong>' + t('run.noJobsHint') + '</div>';
      return;
    }

    outputEl.innerHTML = renderDagSkeleton(plan);
    var consoleEl = document.getElementById('consoleEl');
    appendLog(consoleEl, '# ' + triggerReason(trig), 'sys');

    var byLevel = {};
    plan.nodes.forEach(function (n) { (byLevel[n.level] = byLevel[n.level] || []).push(n); });
    var levelKeys = Object.keys(byLevel).map(Number).sort(function (a, b) { return a - b; });

    var supersededFired = false, supersededCancel = false;
    if (scenario.overrides && scenario.overrides.simulateSupersededRun) {
      setTimeout(function () {
        if (runToken !== myToken || supersededFired) return;
        supersededFired = true;
        var cancelInProgress = !!(api.parsed.concurrency && api.parsed.concurrency['cancel-in-progress'] === true);
        supersededCancel = cancelInProgress;
        var banner = document.getElementById('dagBanner');
        if (banner) {
          banner.innerHTML = '<div class="run-banner skip" style="margin-bottom:10px;">' + t('run.superseded') +
            (cancelInProgress ? t('run.supersededCancel') : t('run.supersededRace')) + '</div>';
        }
        appendLog(consoleEl, cancelInProgress ? t('run.logCancel') : t('run.logRace'), 'sys');
      }, 1300);
    }

    for (var li = 0; li < levelKeys.length; li++) {
      if (runToken !== myToken) return;
      var nodesHere = byLevel[levelKeys[li]];
      if (supersededCancel) {
        nodesHere.forEach(function (n) { n.status = 'cancelled'; });
      }
      await Promise.all(nodesHere.map(function (n) { return animateNode(outputEl, consoleEl, n, scenario, myToken); }));
      await delay(150);
    }
    if (runToken !== myToken) return;

    var finalStatuses = plan.nodes.map(function (n) {
      var el = outputEl.querySelector('[data-node="' + n.id + '"]');
      return el ? el.getAttribute('data-status') : n.status;
    });
    var overall = finalStatuses.indexOf('failure') !== -1 ? 'failure'
      : finalStatuses.indexOf('cancelled') !== -1 && finalStatuses.every(function (s) { return s === 'cancelled' || s === 'skipped'; }) ? 'cancelled'
      : finalStatuses.every(function (s) { return s === 'skipped'; }) ? 'skip'
      : 'success';
    var banner = document.getElementById('dagBanner');
    var bannerText = overall === 'success' ? t('run.success') : overall === 'failure' ? t('run.failure') : overall === 'cancelled' ? t('run.cancelled') : t('run.allSkipped');
    if (banner) banner.insertAdjacentHTML('beforeend', '<div class="run-banner ' + overall + '">' + bannerText + '</div>');
  }

  /* ---------------- Boot ---------------- */
  function navigate(id) { renderLesson(id); }

  function initialLessonId() {
    var hash = (location.hash || '').replace(/^#/, '');
    if (hash && findEntry(hash)) return hash;
    var last = safeGet(LAST_KEY);
    if (last && findEntry(last)) return last;
    return ALL[0].lesson.id;
  }

  document.getElementById('sidebarToggle').addEventListener('click', function () { layoutEl.classList.toggle('sidebar-open'); });
  document.getElementById('sidebarScrim').addEventListener('click', closeMobileSidebar);

  setLang(detectLang());
  renderChrome();
  updateProgressUI();
  renderLesson(initialLessonId());
})();

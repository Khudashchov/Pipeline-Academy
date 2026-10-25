// UI string catalog and language helpers. Lesson prose lives in lessons.js (English) and
// lessons.uk.js (Ukrainian overlay); everything else the page says comes from STRINGS below.
// Placeholders look like {name} and are filled from the params object passed to t().

const LANGS = ['en', 'uk'];
const LANG_KEY = 'pipelineAcademy.lang.v1';

const STRINGS = {
  en: {
    'doc.title': 'Pipeline Academy',
    'top.modules': '&#9776; Modules',
    'top.langSwitch': 'УКР',
    'top.langSwitchTitle': 'Перемкнути на українську',
    'labNote': 'Pipeline Academy is a simulation: it parses real YAML and follows GitHub Actions\' real trigger, dependency, matrix, and expression rules, but no code actually runs and no repository is touched. Progress is saved in this browser only.',
    'lesson.eyebrow': 'Module {mi} &middot; {module} &middot; Lesson {li}',
    'lesson.mission': 'Mission',
    'editor.hint': 'Hint',
    'editor.anotherHint': 'Another hint',
    'editor.noMoreHints': 'No more hints',
    'editor.allHints': 'That\'s every hint for this one.',
    'editor.reset': 'Reset',
    'editor.resetConfirm': 'Click again to reset',
    'editor.solution': 'Reveal solution',
    'editor.solutionConfirm': 'Click again to reveal',
    'editor.syntaxError': 'YAML syntax error: {msg}',
    'editor.unparseable': 'The file could not be parsed.',
    'run.pane': 'Simulate a run',
    'run.button': '&#9654; Run pipeline',
    'run.empty': 'Click Run to see what GitHub Actions would actually do with this file.',
    'run.defaultScenario': 'Push to main',
    'run.cantRun': 'Can\'t run — YAML syntax error.',
    'run.noParse': 'The file does not parse.',
    'run.didNotRun': 'Workflow did not run.',
    'run.noGraph': 'Could not build the job graph.',
    'run.noJobs': 'Workflow triggers, but defines no jobs yet.',
    'run.noJobsHint': 'Add at least one job under <code>jobs:</code>.',
    'run.then': '↓ then',
    'run.success': '✓ Run completed successfully.',
    'run.failure': '✗ Run failed.',
    'run.cancelled': '⛔ Run cancelled.',
    'run.allSkipped': '⏭ Every job was skipped.',
    'run.superseded': '⚡ A newer commit landed on the same branch while this run was still going',
    'run.supersededCancel': ' — cancelling the rest of this run.',
    'run.supersededRace': ' — and because cancel-in-progress isn’t set, both runs are now racing.',
    'run.logCancel': 'A newer run superseded this one. Cancelling remaining jobs.',
    'run.logRace': 'Warning: a second run has started for the same ref. No cancellation configured.',
    'run.approve': 'Approve',
    'run.environment': 'Environment:',
    'run.waiting': '⏸  Waiting for approval to deploy to {env}…',
    'run.approved': '✓  Deployment to {env} approved',
    'run.jobStart': '▶  Job: {job}',
    'run.jobSkipped': '⏭  {job} skipped — {reason}',
    'run.jobCancelled': '⛔  {job} cancelled',
    'run.skipIf': 'if: {expr} evaluated to false.',
    'run.skipNeeds': 'A required job did not succeed.',
    'run.stepFailed': '{step} exited with a non-zero status.',
    'status.queued': 'queued',
    'status.running': 'running',
    'status.success': 'success',
    'status.failed': 'failed',
    'status.skipped': 'skipped',
    'status.cancelled': 'cancelled',
    'status.approval': 'needs approval',
    'check.title': 'Mission checklist',
    'check.complete': 'Mission complete.',
    'check.next': 'Next lesson →',
    'check.finished': 'Mission complete — you’ve finished the whole curriculum.',
    'trig.noTrigger': 'workflow has no "{name}" trigger configured',
    'trig.branchIgnored': '{ref} matches branches-ignore',
    'trig.branchNoMatch': '{ref} does not match branches filter',
    'trig.tagIgnored': 'tag matches tags-ignore',
    'trig.tagNoMatch': 'tag does not match tags filter',
    'trig.pathsIgnored': 'all changed paths match paths-ignore',
    'trig.pathsNoMatch': 'no changed path matches the paths filter',
    'trig.pushMatch': 'push to {ref} matches configured filters',
    'trig.typeNotListed': 'activity type "{action}" is not in types: [{types}]',
    'trig.baseIgnored': 'base branch {ref} matches branches-ignore',
    'trig.baseNoMatch': 'base branch {ref} does not match branches filter',
    'trig.prMatch': '{name} ({action}) targeting {ref} matches configured filters',
    'trig.schedule': 'scheduled trigger fired on cron',
    'trig.dispatch': 'manually dispatched from the Actions tab',
    'trig.call': 'invoked by a caller workflow',
    'trig.other': '{name} event received',
  },
  uk: {
    'doc.title': 'Pipeline Academy',
    'top.modules': '&#9776; Модулі',
    'top.langSwitch': 'ENG',
    'top.langSwitchTitle': 'Switch to English',
    'labNote': 'Pipeline Academy — це симуляція: вона по-справжньому розбирає YAML і дотримується реальних правил GitHub Actions щодо тригерів, залежностей, матриць і виразів, але жоден код насправді не виконується і жоден репозиторій не змінюється. Прогрес зберігається лише в цьому браузері.',
    'lesson.eyebrow': 'Модуль {mi} &middot; {module} &middot; Урок {li}',
    'lesson.mission': 'Місія',
    'editor.hint': 'Підказка',
    'editor.anotherHint': 'Ще підказка',
    'editor.noMoreHints': 'Підказок більше немає',
    'editor.allHints': 'Це всі підказки до цього уроку.',
    'editor.reset': 'Скинути',
    'editor.resetConfirm': 'Натисни ще раз, щоб скинути',
    'editor.solution': 'Показати розв’язок',
    'editor.solutionConfirm': 'Натисни ще раз, щоб показати',
    'editor.syntaxError': 'Синтаксична помилка YAML: {msg}',
    'editor.unparseable': 'Не вдалося розібрати файл.',
    'run.pane': 'Симуляція запуску',
    'run.button': '&#9654; Запустити пайплайн',
    'run.empty': 'Натисни «Запустити», щоб побачити, що GitHub Actions насправді зробить із цим файлом.',
    'run.defaultScenario': 'Пуш у main',
    'run.cantRun': 'Запуск неможливий — синтаксична помилка YAML.',
    'run.noParse': 'Файл не вдається розібрати.',
    'run.didNotRun': 'Воркфлоу не запустився.',
    'run.noGraph': 'Не вдалося побудувати граф джоб.',
    'run.noJobs': 'Воркфлоу спрацьовує, але ще не має жодної джоби.',
    'run.noJobsHint': 'Додай хоча б одну джобу в <code>jobs:</code>.',
    'run.then': '↓ далі',
    'run.success': '✓ Запуск успішно завершено.',
    'run.failure': '✗ Запуск завершився помилкою.',
    'run.cancelled': '⛔ Запуск скасовано.',
    'run.allSkipped': '⏭ Усі джоби пропущено.',
    'run.superseded': '⚡ Поки цей запуск ще тривав, у ту саму гілку прилетів новіший коміт',
    'run.supersededCancel': ' — решту цього запуску скасовано.',
    'run.supersededRace': ' — і оскільки cancel-in-progress не задано, тепер обидва запуски змагаються між собою.',
    'run.logCancel': 'Новіший запуск витіснив цей. Скасовуємо решту джоб.',
    'run.logRace': 'Попередження: для того самого ref стартував другий запуск. Скасування не налаштовано.',
    'run.approve': 'Схвалити',
    'run.environment': 'Середовище:',
    'run.waiting': '⏸  Очікуємо схвалення деплою в {env}…',
    'run.approved': '✓  Деплой у {env} схвалено',
    'run.jobStart': '▶  Джоба: {job}',
    'run.jobSkipped': '⏭  {job} пропущено — {reason}',
    'run.jobCancelled': '⛔  {job} скасовано',
    'run.skipIf': 'if: {expr} дав false.',
    'run.skipNeeds': 'Одна з обов’язкових джоб не завершилася успішно.',
    'run.stepFailed': '{step} завершився з ненульовим кодом.',
    'status.queued': 'у черзі',
    'status.running': 'виконується',
    'status.success': 'успіх',
    'status.failed': 'помилка',
    'status.skipped': 'пропущено',
    'status.cancelled': 'скасовано',
    'status.approval': 'потрібне схвалення',
    'check.title': 'Чекліст місії',
    'check.complete': 'Місію виконано.',
    'check.next': 'Наступний урок →',
    'check.finished': 'Місію виконано — ти пройшов увесь курс.',
    'trig.noTrigger': 'у воркфлоу не налаштовано тригер "{name}"',
    'trig.branchIgnored': '{ref} збігається з branches-ignore',
    'trig.branchNoMatch': '{ref} не відповідає фільтру branches',
    'trig.tagIgnored': 'тег збігається з tags-ignore',
    'trig.tagNoMatch': 'тег не відповідає фільтру tags',
    'trig.pathsIgnored': 'усі змінені шляхи збігаються з paths-ignore',
    'trig.pathsNoMatch': 'жоден змінений шлях не відповідає фільтру paths',
    'trig.pushMatch': 'пуш у {ref} відповідає налаштованим фільтрам',
    'trig.typeNotListed': 'тип активності "{action}" відсутній у types: [{types}]',
    'trig.baseIgnored': 'базова гілка {ref} збігається з branches-ignore',
    'trig.baseNoMatch': 'базова гілка {ref} не відповідає фільтру branches',
    'trig.prMatch': '{name} ({action}) у {ref} відповідає налаштованим фільтрам',
    'trig.schedule': 'тригер за розкладом спрацював за cron',
    'trig.dispatch': 'запущено вручну з вкладки Actions',
    'trig.call': 'викликано іншим воркфлоу',
    'trig.other': 'отримано подію {name}',
  },
};

function detectLang() {
  let saved = null;
  try { saved = localStorage.getItem(LANG_KEY); } catch (e) {}
  if (LANGS.indexOf(saved) !== -1) return saved;
  const nav = (typeof navigator !== 'undefined' && (navigator.languages || [navigator.language])) || [];
  for (let i = 0; i < nav.length; i++) if (/^uk\b/i.test(nav[i] || '')) return 'uk';
  return 'en';
}

let currentLang = 'en';

function setLang(lang) {
  if (LANGS.indexOf(lang) === -1) lang = 'en';
  currentLang = lang;
  try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
  if (typeof document !== 'undefined') document.documentElement.lang = lang;
}

function getLang() { return currentLang; }

function t(key, params) {
  const table = STRINGS[currentLang] || STRINGS.en;
  let s = table[key] != null ? table[key] : (STRINGS.en[key] != null ? STRINGS.en[key] : key);
  if (params) s = s.replace(/\{(\w+)\}/g, (m, k) => (params[k] != null ? String(params[k]) : m));
  return s;
}

// Returns a lesson/module field in the current language, falling back to English. `index` picks
// one entry out of an array field (hints, checks); for `scenarios` it is the scenario id.
function localized(item, field, index) {
  const en = item[field];
  const ov = currentLang === 'uk' && typeof LESSONS_UK !== 'undefined' ? LESSONS_UK[item.id] : null;
  if (field === 'checks') {
    const v = ov && ov.checks && ov.checks[index];
    return v != null ? v : en[index].label;
  }
  if (field === 'scenarios') {
    const v = ov && ov.scenarios && ov.scenarios[index];
    return v != null ? v : null;
  }
  let v = ov ? ov[field] : null;
  if (index != null) { v = v && v[index]; return v != null ? v : en[index]; }
  if (Array.isArray(v)) v = v.join('\n');
  return v != null ? v : en;
}

if (typeof module !== 'undefined') module.exports = { STRINGS, LANGS, t, setLang, getLang, localized };

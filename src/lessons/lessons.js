// Full curriculum data: modules -> lessons. Pure data + small check functions; no DOM, no imports
// beyond the Y() line-join helper, so this file can be tested head-less with Node and then pasted
// verbatim into the published page's inline <script>.

function Y(...lines) { return lines.join('\n'); }

const MODULES = [
{
  id: 'm0', title: 'Orientation', blurb: 'What a pipeline even is, before you touch any YAML.',
  lessons: [
    {
      id: 'm0-l1', title: 'Meet the Pipeline',
      objective: 'Give the job a runner to execute on, then watch it go.',
      intro: Y(
        '<p>Every GitHub Actions pipeline starts from one file: a <code>.yml</code> file inside <code>.github/workflows/</code>. GitHub watches your repository for events &mdash; a push, a pull request, a schedule &mdash; and when one matches a workflow\'s <code>on:</code> block, it spins up a fresh virtual machine, checks out your code, and runs the <code>steps:</code> you wrote, in order, top to bottom.</p>',
        '<p>That\'s the whole trick. No daemons, no servers to babysit &mdash; just a YAML file describing what should happen and when. This lab will have you write dozens of these files, starting from nothing and ending at the kind of pipeline a senior engineer ships to production.</p>',
        '<p class="tip"><strong>This lesson:</strong> the workflow below is almost ready. It just doesn\'t say <em>where</em> to run &mdash; every job needs a <code>runs-on:</code> target, naming the virtual machine image GitHub should boot.</p>'
      ),
      starter: Y(
        'name: Hello Pipeline',
        'on:',
        '  push:',
        '    branches: [main]',
        'jobs:',
        '  build:',
        '    steps:',
        '      - name: Say hello',
        '        run: echo "Hello, pipeline!"'
      ),
      solution: Y(
        'name: Hello Pipeline',
        'on:',
        '  push:',
        '    branches: [main]',
        'jobs:',
        '  build:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - name: Say hello',
        '        run: echo "Hello, pipeline!"'
      ),
      hints: [
        'Every job needs a <code>runs-on:</code> line directly under its name, at the same indent level as <code>steps:</code>.',
        'The standard choice is <code>runs-on: ubuntu-latest</code> &mdash; a fresh Ubuntu VM GitHub provides for free on public repos.'
      ],
      checks: [
        { label: 'The <code>build</code> job has a <code>runs-on</code> target', test: api => !!api.job('build')['runs-on'] },
      ],
    },
  ],
},
{
  id: 'm1', title: 'Anatomy of a Workflow', blurb: 'YAML syntax and the skeleton every workflow shares.',
  lessons: [
    {
      id: 'm1-l1', title: 'YAML Syntax Bootcamp',
      objective: 'Fix the broken file so it parses, then confirm the pipeline underneath still does its job.',
      intro: Y(
        '<p>YAML is whitespace-sensitive and unforgiving about exactly one thing: it never allows tab characters for indentation, only spaces. A single stray tab, invisible in most editors, will fail the entire workflow before a single job runs.</p>',
        '<p>The file below has that exact bug. Your editor shows it as a reddish gap because the tab doesn\'t line up like the spaces around it &mdash; that\'s your tell.</p>',
        '<p class="tip"><strong>Senior habit:</strong> configure your editor to show whitespace characters and convert tabs to spaces automatically. It\'s the single most common reason a brand-new workflow fails with a cryptic parser error on the very first commit.</p>'
      ),
      starter: Y(
        'name: Build And Test',
        'on:',
        '  push:',
        '    branches: [main]',
        'jobs:',
        '  build:',
        '\t  runs-on: ubuntu-latest',
        '    steps:',
        '      - name: Checkout',
        '        uses: actions/checkout@v4',
        '      - name: Run tests',
        '        run: npm test'
      ),
      solution: Y(
        'name: Build And Test',
        'on:',
        '  push:',
        '    branches: [main]',
        'jobs:',
        '  build:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - name: Checkout',
        '        uses: actions/checkout@v4',
        '      - name: Run tests',
        '        run: npm test'
      ),
      hints: [
        'The parser error names a line number and a column &mdash; jump straight to it.',
        'Delete the whole indent on the <code>runs-on:</code> line and retype it using only spaces, matching the two-space pattern used elsewhere in the file.'
      ],
      checks: [
        { label: 'The file parses as valid YAML', test: api => api.parses },
        { label: '<code>build</code> runs on <code>ubuntu-latest</code>', test: api => api.parses && api.job('build')['runs-on'] === 'ubuntu-latest' },
        { label: 'Still checks out the code and runs tests', test: api => api.parses && api.anyStepUses(/actions\/checkout@v4/) && api.anyStepRuns(/npm test/) },
      ],
    },
    {
      id: 'm1-l2', title: 'Anatomy of workflow.yml',
      objective: 'Build the four pillars every workflow needs, from a near-empty file.',
      intro: Y(
        '<p>Strip any GitHub Actions file to its skeleton and you always find the same four pieces: <code>name</code> (what shows up in the Actions tab), <code>on</code> (the trigger), <code>jobs</code> (one or more units of work, each with its own VM), and inside each job, <code>steps</code> (the ordered list of things that VM actually does).</p>',
        '<div class="ref-box"><div class="ref-title">The skeleton</div><pre class="ref-code">name: &lt;string&gt;\non: &lt;event&gt;\njobs:\n  &lt;job-id&gt;:\n    runs-on: &lt;runner image&gt;\n    steps:\n      - run: &lt;shell command&gt;</pre></div>',
        '<p>Fill in every blank below to complete your first workflow from scratch.</p>'
      ),
      starter: Y(
        '# Fill in every blank: a name, a trigger, a runner, and a step that prints a greeting.',
        'name:',
        'on:',
        'jobs:',
        '  greet:',
        '    runs-on:',
        '    steps:',
        '      - name: Greeting',
        '        run:'
      ),
      solution: Y(
        'name: Greeting Workflow',
        'on: push',
        'jobs:',
        '  greet:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - name: Greeting',
        '        run: echo "Welcome to CI/CD"'
      ),
      hints: [
        '<code>on:</code> can be as short as a single word, e.g. <code>on: push</code> &mdash; no nested block required.',
        'A run step just needs a shell command after <code>run:</code>, like <code>run: echo "hi"</code>.'
      ],
      checks: [
        { label: 'Workflow has a <code>name</code>', test: api => api.parses && typeof api.parsed.name === 'string' && api.parsed.name.trim().length > 0 },
        { label: 'Workflow has a trigger under <code>on</code>', test: api => api.parses && !!api.parsed.on },
        { label: '<code>greet</code> has a <code>runs-on</code> target', test: api => api.parses && !!api.job('greet')['runs-on'] },
        { label: '<code>greet</code> has a step that runs a command', test: api => api.parses && api.stepInJob('greet', s => typeof s.run === 'string' && s.run.trim().length > 0) },
      ],
    },
  ],
},
{
  id: 'm2', title: 'Triggers', blurb: 'Deciding exactly when a pipeline should run.',
  lessons: [
    {
      id: 'm2-l1', title: 'Push & Pull Request Triggers',
      objective: 'Run CI on every push to main, and on every pull request targeting main.',
      intro: Y(
        '<p>This workflow is currently watching the wrong branch, and it never reacts to pull requests at all &mdash; so nobody sees results until after they\'ve already merged. Point <code>push</code> at <code>main</code>, and add a <code>pull_request</code> trigger scoped to the same branch.</p>',
        '<p class="tip">Try the scenario switcher on the right before and after you fix it &mdash; it tells you, for a given simulated event, whether this exact file would even start a run.</p>'
      ),
      starter: Y(
        'name: CI',
        'on:',
        '  push:',
        '    branches: [develop]',
        'jobs:',
        '  build:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - uses: actions/checkout@v4',
        '      - run: npm ci && npm test'
      ),
      solution: Y(
        'name: CI',
        'on:',
        '  push:',
        '    branches: [main]',
        '  pull_request:',
        '    branches: [main]',
        'jobs:',
        '  build:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - uses: actions/checkout@v4',
        '      - run: npm ci && npm test'
      ),
      hints: [
        'Change <code>develop</code> to <code>main</code> under <code>push.branches</code>.',
        'Add a sibling key to <code>push</code>, indented the same way: <code>pull_request:</code> with its own <code>branches: [main]</code>.'
      ],
      checks: [
        { label: 'Triggers on push to <code>main</code>', test: api => api.parses && api.toArray(api.parsed.on?.push?.branches).includes('main') },
        { label: 'Triggers on pull requests into <code>main</code>', test: api => api.parses && !!api.parsed.on?.pull_request && api.toArray(api.parsed.on.pull_request.branches).includes('main') },
      ],
      scenarios: [
        { id: 'push-main', label: 'Push to main', event: { name: 'push', refName: 'main' } },
        { id: 'push-feature', label: 'Push to a feature branch', event: { name: 'push', refName: 'feature/login' } },
        { id: 'pr-main', label: 'Pull request into main', event: { name: 'pull_request', refName: 'main', prAction: 'opened' } },
      ],
    },
    {
      id: 'm2-l2', title: 'Scheduled & Manual Runs',
      objective: 'Add a nightly cron schedule, and let a human preview the job with a manual input.',
      intro: Y(
        '<p>Not every pipeline reacts to code changes. <code>schedule:</code> fires on a cron expression (five fields: minute, hour, day-of-month, month, day-of-week, always in UTC); <code>workflow_dispatch:</code> adds a &ldquo;Run workflow&rdquo; button in the Actions tab, and can accept typed <code>inputs</code> so a human can pass options in at launch time.</p>',
        '<p class="tip"><strong>Senior habit:</strong> destructive or expensive scheduled jobs almost always ship with a <code>dry_run</code> boolean input, defaulting to <code>true</code>, so a human can preview the blast radius before the real thing runs unattended at 3am.</p>'
      ),
      starter: Y(
        'name: Nightly Maintenance',
        'on:',
        '  workflow_dispatch:',
        'jobs:',
        '  cleanup:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - run: echo "Cleaning up stale branches"'
      ),
      solution: Y(
        'name: Nightly Maintenance',
        'on:',
        '  schedule:',
        '    - cron: \'0 3 * * *\'',
        '  workflow_dispatch:',
        '    inputs:',
        '      dry_run:',
        '        description: \'Preview without deleting anything\'',
        '        type: boolean',
        '        default: true',
        'jobs:',
        '  cleanup:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - run: echo "Cleaning up stale branches"'
      ),
      hints: [
        'Add a <code>schedule:</code> list under <code>on</code>, one item with a <code>cron:</code> string &mdash; <code>\'0 3 * * *\'</code> means 03:00 UTC every day.',
        'Under <code>workflow_dispatch:</code>, add <code>inputs:</code>, then a <code>dry_run</code> input with <code>type: boolean</code> and <code>default: true</code>.'
      ],
      checks: [
        { label: 'Has a nightly cron schedule', test: api => api.parses && Array.isArray(api.parsed.on?.schedule) && /^\S+\s+\S+\s+\S+\s+\S+\s+\S+$/.test(String(api.parsed.on.schedule[0]?.cron || '')) },
        { label: 'Manual run accepts a <code>dry_run</code> input', test: api => api.parses && !!api.parsed.on?.workflow_dispatch?.inputs?.dry_run },
      ],
      scenarios: [
        { id: 'sched', label: 'Nightly schedule fires', event: { name: 'schedule' } },
        { id: 'manual', label: 'Someone clicks "Run workflow"', event: { name: 'workflow_dispatch' } },
        { id: 'push', label: 'Someone pushes code', event: { name: 'push', refName: 'main' } },
      ],
    },
    {
      id: 'm2-l3', title: 'Picking the Right Activity Types',
      objective: 'Re-run checks when a draft PR becomes ready, and skip CI for documentation-only changes.',
      intro: Y(
        '<p><code>pull_request</code> actually fires for many different <em>activity types</em> &mdash; opened, synchronize (new commits pushed), reopened, and others. Left unset, GitHub defaults to just <code>[opened, synchronize, reopened]</code>, which silently misses the moment a draft PR is marked ready for review.</p>',
        '<p>Meanwhile, <code>paths-ignore</code> (or its opposite, <code>paths</code>) lets you skip an entire pipeline run when the only files that changed can\'t affect it &mdash; documentation is the classic example.</p>'
      ),
      starter: Y(
        'name: PR Checks',
        'on:',
        '  pull_request:',
        '    branches: [main]',
        'jobs:',
        '  build:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - uses: actions/checkout@v4',
        '      - run: npm ci && npm test'
      ),
      solution: Y(
        'name: PR Checks',
        'on:',
        '  pull_request:',
        '    branches: [main]',
        '    types: [opened, synchronize, reopened, ready_for_review]',
        '    paths-ignore:',
        '      - \'**.md\'',
        '      - \'docs/**\'',
        'jobs:',
        '  build:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - uses: actions/checkout@v4',
        '      - run: npm ci && npm test'
      ),
      hints: [
        'Add <code>types: [opened, synchronize, reopened, ready_for_review]</code> under <code>pull_request</code>, alongside <code>branches</code>.',
        'Add a <code>paths-ignore</code> list with glob patterns like <code>\'**.md\'</code> and <code>\'docs/**\'</code>.'
      ],
      checks: [
        { label: 'Re-checks a draft PR marked ready for review', test: api => api.parses && api.toArray(api.parsed.on?.pull_request?.types).includes('ready_for_review') },
        { label: 'Skips documentation-only changes', test: api => {
          if (!api.parses) return false;
          const patterns = api.toArray(api.parsed.on?.pull_request?.['paths-ignore']).map(String);
          return patterns.some(p => /\.md/i.test(p)) && patterns.some(p => /docs/i.test(p));
        } },
      ],
      scenarios: [
        { id: 'opened', label: 'PR opened', event: { name: 'pull_request', refName: 'main', prAction: 'opened' } },
        { id: 'ready', label: 'Draft marked ready for review', event: { name: 'pull_request', refName: 'main', prAction: 'ready_for_review' } },
        { id: 'docs', label: 'PR only touches README.md', event: { name: 'pull_request', refName: 'main', prAction: 'opened', paths: ['README.md'] } },
      ],
    },
  ],
},
{
  id: 'm3', title: 'Jobs, Steps & Runners', blurb: 'Structuring work across one or many virtual machines.',
  lessons: [
    {
      id: 'm3-l1', title: 'Parallel Jobs & runs-on',
      objective: 'Split one slow sequential job into two independent jobs that run at the same time.',
      intro: Y(
        '<p>Every <code>job</code> gets its own fresh virtual machine, and by default, jobs with no relationship to each other run <strong>in parallel</strong>, not in sequence. Right now, lint and test are crammed into one job, so test waits for lint to finish for no reason &mdash; wasted wall-clock time on every single run.</p>'
      ),
      starter: Y(
        'name: Checks',
        'on:',
        '  push:',
        '    branches: [main]',
        'jobs:',
        '  checks:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - uses: actions/checkout@v4',
        '      - name: Lint',
        '        run: npm run lint',
        '      - name: Test',
        '        run: npm test'
      ),
      solution: Y(
        'name: Checks',
        'on:',
        '  push:',
        '    branches: [main]',
        'jobs:',
        '  lint:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - uses: actions/checkout@v4',
        '      - run: npm run lint',
        '  test:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - uses: actions/checkout@v4',
        '      - run: npm test'
      ),
      hints: [
        'Replace the single <code>checks:</code> job with two sibling jobs, <code>lint:</code> and <code>test:</code>, each indented directly under <code>jobs:</code>.',
        'Each new job needs its own <code>runs-on</code> and its own <code>actions/checkout@v4</code> &mdash; VMs don\'t share a filesystem.'
      ],
      checks: [
        { label: 'Separate <code>lint</code> and <code>test</code> jobs exist', test: api => api.parses && api.hasJob('lint') && api.hasJob('test') },
        { label: 'Both jobs have a runner and stay independent', test: api => api.parses && !!api.job('lint')['runs-on'] && !!api.job('test')['runs-on'] && api.needsOf('lint').length === 0 && api.needsOf('test').length === 0 },
        { label: 'Lint still lints, test still tests', test: api => api.parses && api.stepInJob('lint', s => api.runMatches(s, /lint/)) && api.stepInJob('test', s => api.runMatches(s, /test/)) },
      ],
    },
    {
      id: 'm3-l2', title: 'Sequencing with needs:',
      objective: 'Make deploy wait for both lint and test to succeed first.',
      intro: Y(
        '<p>Parallel jobs are fast, but not every job should start immediately &mdash; <code>needs:</code> declares a dependency, telling GitHub Actions to hold a job back until the jobs it needs have finished successfully. Right now <code>deploy</code> races ahead with no regard for whether the code even passes its tests.</p>',
        '<div class="ref-box"><div class="ref-title">Syntax</div><pre class="ref-code">deploy:\n  needs: [lint, test]</pre></div>'
      ),
      starter: Y(
        'name: Checks And Deploy',
        'on:',
        '  push:',
        '    branches: [main]',
        'jobs:',
        '  lint:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - run: npm run lint',
        '  test:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - run: npm test',
        '  deploy:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - run: ./deploy.sh'
      ),
      solution: Y(
        'name: Checks And Deploy',
        'on:',
        '  push:',
        '    branches: [main]',
        'jobs:',
        '  lint:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - run: npm run lint',
        '  test:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - run: npm test',
        '  deploy:',
        '    needs: [lint, test]',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - run: ./deploy.sh'
      ),
      hints: ['Add <code>needs: [lint, test]</code> to the <code>deploy</code> job, indented the same as its <code>runs-on</code>.'],
      checks: [
        { label: '<code>deploy</code> needs both <code>lint</code> and <code>test</code>', test: api => api.parses && api.needsOf('deploy').slice().sort().join(',') === 'lint,test' },
      ],
    },
    {
      id: 'm3-l3', title: 'Passing Data with Job Outputs',
      objective: 'Expose a computed version string from build, and consume it in deploy.',
      intro: Y(
        '<p>Jobs run on separate machines, so they can\'t share variables directly &mdash; but they can share small strings deliberately, through <strong>outputs</strong>. A step first writes a value to <code>$GITHUB_OUTPUT</code>; the job then re-exposes that step\'s output as one of its own <code>outputs</code>; any job that <code>needs</code> it can then read <code>needs.&lt;job&gt;.outputs.&lt;name&gt;</code>.</p>',
        '<div class="ref-box"><div class="ref-title">The chain</div><pre class="ref-code">steps.&lt;step-id&gt;.outputs.&lt;name&gt;  &rarr;  job.outputs.&lt;name&gt;  &rarr;  needs.&lt;job&gt;.outputs.&lt;name&gt;</pre></div>'
      ),
      starter: Y(
        'name: Versioned Deploy',
        'on:',
        '  push:',
        '    branches: [main]',
        'jobs:',
        '  build:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - uses: actions/checkout@v4',
        '      - name: Compute version',
        '        id: ver',
        '        run: echo "value=1.4.0-$(git rev-parse --short HEAD)" >> "$GITHUB_OUTPUT"',
        '  deploy:',
        '    needs: build',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - name: Deploy',
        '        run: ./deploy.sh'
      ),
      solution: Y(
        'name: Versioned Deploy',
        'on:',
        '  push:',
        '    branches: [main]',
        'jobs:',
        '  build:',
        '    runs-on: ubuntu-latest',
        '    outputs:',
        '      version: ${{ steps.ver.outputs.value }}',
        '    steps:',
        '      - uses: actions/checkout@v4',
        '      - name: Compute version',
        '        id: ver',
        '        run: echo "value=1.4.0-$(git rev-parse --short HEAD)" >> "$GITHUB_OUTPUT"',
        '  deploy:',
        '    needs: build',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - name: Deploy',
        '        run: ./deploy.sh ${{ needs.build.outputs.version }}'
      ),
      hints: [
        'Add an <code>outputs:</code> block to <code>build</code>, same indent as <code>steps:</code>, mapping <code>version</code> to <code>${{ steps.ver.outputs.value }}</code>.',
        'In <code>deploy</code>, pass the version into the deploy script: <code>run: ./deploy.sh ${{ needs.build.outputs.version }}</code>.'
      ],
      checks: [
        { label: '<code>build</code> exposes its computed version', test: api => api.parses && typeof api.job('build').outputs?.version === 'string' && /steps\.ver\.outputs\.value/.test(api.job('build').outputs.version) },
        { label: '<code>deploy</code> reads it back', test: api => api.parses && api.stepInJob('deploy', s => api.runMatches(s, /needs\.build\.outputs\.version/)) },
      ],
    },
  ],
},
{
  id: 'm4', title: 'Using Actions', blurb: 'The marketplace, with: inputs, and version pinning.',
  lessons: [
    {
      id: 'm4-l1', title: 'Using Marketplace Actions',
      objective: 'Check out the repository and set up the right Node.js version before building.',
      intro: Y(
        '<p><code>uses:</code> pulls in a prebuilt, shareable step from the GitHub Marketplace instead of hand-writing shell commands. Two you\'ll use in nearly every workflow: <code>actions/checkout</code>, which clones your repository onto the runner (without it, there\'s no code to build!), and <code>actions/setup-node</code>, which installs a specific Node.js version via its <code>with:</code> inputs.</p>',
        '<p class="tip">This job currently skips checkout entirely &mdash; a surprisingly common first mistake, since the error it produces (&ldquo;no such file or directory&rdquo;) doesn\'t obviously point back to a missing checkout step.</p>'
      ),
      starter: Y(
        'name: Build',
        'on:',
        '  push:',
        '    branches: [main]',
        'jobs:',
        '  build:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - name: Build the project',
        '        run: node ./build.js'
      ),
      solution: Y(
        'name: Build',
        'on:',
        '  push:',
        '    branches: [main]',
        'jobs:',
        '  build:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - name: Checkout',
        '        uses: actions/checkout@v4',
        '      - name: Set up Node.js',
        '        uses: actions/setup-node@v4',
        '        with:',
        '          node-version: \'20\'',
        '      - name: Build the project',
        '        run: node ./build.js'
      ),
      hints: [
        'Add <code>- uses: actions/checkout@v4</code> as the very first step.',
        'Add <code>actions/setup-node@v4</code> next, with a <code>with: { node-version: \'20\' }</code> block, before the build step.'
      ],
      checks: [
        { label: 'First step checks out the repository', test: api => { const steps = api.stepsOf('build'); return api.parses && steps[0] && api.usesMatches(steps[0], /actions\/checkout@v4/); } },
        { label: 'Sets up Node.js 20 before building', test: api => api.parses && api.stepInJob('build', s => api.usesMatches(s, /actions\/setup-node@v4/) && /20/.test(String(s.with?.['node-version'] || ''))) },
      ],
    },
    {
      id: 'm4-l2', title: 'Pinning Action Versions',
      objective: 'Stop tracking a floating branch for every action &mdash; pin to released versions.',
      intro: Y(
        '<p>An action reference after the <code>@</code> can point to a tag (<code>@v4</code>), a branch (<code>@main</code>), or a commit SHA. A branch reference is a moving target: the maintainer can push new, different code to it at any time, and your pipeline will silently start running something you never reviewed.</p>',
        '<p class="tip">Tags can technically move too, but in practice reputable actions treat a version tag as immutable once published. The gold standard &mdash; pinning to an exact commit SHA &mdash; is coming up in the security module.</p>'
      ),
      starter: Y(
        'name: Build',
        'on:',
        '  push:',
        '    branches: [main]',
        'jobs:',
        '  build:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - uses: actions/checkout@main',
        '      - uses: some-ci-org/deploy-action@master',
        '      - run: npm ci && npm test'
      ),
      solution: Y(
        'name: Build',
        'on:',
        '  push:',
        '    branches: [main]',
        'jobs:',
        '  build:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - uses: actions/checkout@v4',
        '      - uses: some-ci-org/deploy-action@v3',
        '      - run: npm ci && npm test'
      ),
      hints: ['Replace <code>@main</code> and <code>@master</code> with released version tags, like <code>@v4</code> and <code>@v3</code>.'],
      checks: [
        { label: 'No action still tracks a floating branch', test: api => api.parses && !api.anyStepUses(/@(main|master)$/) },
        { label: 'checkout is pinned to a version tag', test: api => api.parses && api.anyStepUses(/actions\/checkout@v\d/) },
        { label: 'deploy-action is pinned to a version tag', test: api => api.parses && api.anyStepUses(/deploy-action@v\d/) },
      ],
    },
  ],
},
{
  id: 'm5', title: 'Variables, Env & Secrets', blurb: 'Expressions, environment variables, and never leaking a token.',
  lessons: [
    {
      id: 'm5-l1', title: 'Environment Variables & Expressions',
      objective: 'Define the API URL once, and reference it everywhere with an expression.',
      intro: Y(
        '<p><code>${{ }}</code> is the expression syntax that runs through every part of a workflow file. The simplest use: define a variable once under <code>env:</code>, then read it anywhere with <code>${{ env.NAME }}</code> &mdash; at the workflow, job, or even single-step level.</p>',
        '<p>Right now the same URL is typed out twice. If it ever changes, that\'s two places to remember &mdash; or, more realistically, one place someone forgets.</p>'
      ),
      starter: Y(
        'name: Smoke Test',
        'on:',
        '  push:',
        '    branches: [main]',
        'jobs:',
        '  ping:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - name: Check health',
        '        run: curl -f https://api.orbit.dev/health',
        '      - name: Check version endpoint',
        '        run: curl -f https://api.orbit.dev/version'
      ),
      solution: Y(
        'name: Smoke Test',
        'on:',
        '  push:',
        '    branches: [main]',
        'env:',
        '  API_URL: https://api.orbit.dev',
        'jobs:',
        '  ping:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - name: Check health',
        '        run: curl -f ${{ env.API_URL }}/health',
        '      - name: Check version endpoint',
        '        run: curl -f ${{ env.API_URL }}/version'
      ),
      hints: [
        'Add a top-level <code>env:</code> block with <code>API_URL: https://api.orbit.dev</code>.',
        'Replace both hardcoded URLs with <code>${{ env.API_URL }}</code>.'
      ],
      checks: [
        { label: '<code>API_URL</code> is defined once, in <code>env</code>', test: api => api.parses && typeof api.parsed.env?.API_URL === 'string' },
        { label: 'Both steps reference <code>${{ env.API_URL }}</code>', test: api => api.parses && api.anyStepRuns(/\$\{\{\s*env\.API_URL\s*\}\}/g) && api.countStepRuns(/\$\{\{\s*env\.API_URL\s*\}\}/g) >= 2 },
      ],
    },
    {
      id: 'm5-l2', title: 'Secrets & GITHUB_TOKEN',
      objective: 'Replace a hardcoded token with a secret reference &mdash; before it leaks.',
      intro: Y(
        '<p>Never write a real credential directly into a workflow file. Even in a private repository, it ends up in git history forever, visible to anyone with read access, and copy-pastable into any fork. Instead, store it once as a repository secret, then reference it with <code>${{ secrets.NAME }}</code> &mdash; GitHub automatically masks the value anywhere it would appear in a log.</p>',
        '<p class="tip">GitHub\'s own push-protection and most security scanners specifically look for patterns like <code>ghp_</code> (a personal access token) committed in plain text &mdash; which is exactly what\'s hiding in the step below.</p>'
      ),
      starter: Y(
        'name: Deploy',
        'on:',
        '  push:',
        '    branches: [main]',
        'jobs:',
        '  deploy:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - name: Notify deploy service',
        '        run: \'curl -H "Authorization: Bearer ghp_1234567890abcdef1234" https://deploy.orbit.dev/trigger\''
      ),
      solution: Y(
        'name: Deploy',
        'on:',
        '  push:',
        '    branches: [main]',
        'jobs:',
        '  deploy:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - name: Notify deploy service',
        '        run: \'curl -H "Authorization: Bearer ${{ secrets.DEPLOY_TOKEN }}" https://deploy.orbit.dev/trigger\''
      ),
      hints: ['Replace the literal <code>ghp_&hellip;</code> string with <code>${{ secrets.DEPLOY_TOKEN }}</code> &mdash; the secret already exists in this lab\'s simulated repository settings.'],
      checks: [
        { label: 'No hardcoded token left in the file', test: api => api.parses && !api.anyRawLineMatches(/ghp_[A-Za-z0-9]{10,}/) },
        { label: 'Uses <code>secrets.DEPLOY_TOKEN</code> instead', test: api => api.parses && api.anyStepRuns(/secrets\.DEPLOY_TOKEN/) },
      ],
    },
  ],
},
{
  id: 'm6', title: 'Conditionals & Expressions', blurb: 'Teaching a pipeline to react to its own status.',
  lessons: [
    {
      id: 'm6-l1', title: 'if: and Job Status Functions',
      objective: 'Send a failure notification only when tests actually fail.',
      intro: Y(
        '<p><code>if:</code> gates whether a job (or a single step) runs at all. Combined with status functions &mdash; <code>success()</code>, <code>failure()</code>, <code>cancelled()</code>, <code>always()</code> &mdash; it lets a pipeline react to its own outcome: run a step only after something upstream broke, or always clean up no matter what happened.</p>',
        '<div class="ref-box"><div class="ref-title">The default you never see</div><pre class="ref-code">if: success()   # implied on every job unless you write your own if:</pre></div>'
      ),
      starter: Y(
        'name: CI',
        'on:',
        '  push:',
        '    branches: [main]',
        'jobs:',
        '  test:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - run: npm test',
        '  notify:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - run: ./notify-slack.sh "something happened"'
      ),
      solution: Y(
        'name: CI',
        'on:',
        '  push:',
        '    branches: [main]',
        'jobs:',
        '  test:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - run: npm test',
        '  notify:',
        '    needs: test',
        '    if: failure()',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - run: ./notify-slack.sh "tests failed"'
      ),
      hints: [
        'Add <code>needs: test</code> to <code>notify</code> &mdash; it has to depend on <code>test</code> before it can react to its outcome.',
        'Add <code>if: failure()</code> directly below <code>needs:</code>.'
      ],
      checks: [
        { label: '<code>notify</code> depends on <code>test</code>', test: api => api.parses && api.needsOf('notify').includes('test') },
        { label: '<code>notify</code> only runs when tests fail', test: api => api.parses && typeof api.job('notify').if === 'string' && api.evalIf('notify', { __jobStatus: 'failure' }) === true && api.evalIf('notify', { __jobStatus: 'success' }) === false },
      ],
      scenarios: [
        { id: 'pass', label: 'Tests pass', event: { name: 'push', refName: 'main' } },
        { id: 'fail', label: 'Tests fail', event: { name: 'push', refName: 'main' }, overrides: { forceFail: 'test' } },
      ],
    },
    {
      id: 'm6-l2', title: 'Branching Logic with Expressions',
      objective: 'Only deploy on a direct push to main &mdash; never from a pull request or another branch.',
      intro: Y(
        '<p>Expressions can combine context values with <code>&amp;&amp;</code>, <code>||</code>, and comparisons. A deploy job almost always needs more than one condition true at once: the right event, <em>and</em> the right branch.</p>',
        '<div class="ref-box"><div class="ref-title">Useful context</div><pre class="ref-code">github.event_name   # "push", "pull_request", "schedule", ...\ngithub.ref_name     # "main", "feature/login", ...</pre></div>'
      ),
      starter: Y(
        'name: Deploy',
        'on:',
        '  push:',
        '  pull_request:',
        '    branches: [main]',
        'jobs:',
        '  build:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - run: npm run build',
        '  deploy:',
        '    needs: build',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - run: ./deploy.sh'
      ),
      solution: Y(
        'name: Deploy',
        'on:',
        '  push:',
        '  pull_request:',
        '    branches: [main]',
        'jobs:',
        '  build:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - run: npm run build',
        '  deploy:',
        '    needs: build',
        '    if: github.event_name == \'push\' && github.ref_name == \'main\'',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - run: ./deploy.sh'
      ),
      hints: ['Add <code>if: github.event_name == \'push\' && github.ref_name == \'main\'</code> to the <code>deploy</code> job.'],
      checks: [
        { label: 'Deploys on a push to main', test: api => api.parses && api.evalIf('deploy', { github: { event_name: 'push', ref_name: 'main' } }) === true },
        { label: 'Skips a push to another branch', test: api => api.parses && api.evalIf('deploy', { github: { event_name: 'push', ref_name: 'feature-x' } }) === false },
        { label: 'Skips pull requests entirely', test: api => api.parses && api.evalIf('deploy', { github: { event_name: 'pull_request', ref_name: 'main' } }) === false },
      ],
      scenarios: [
        { id: 'push-main', label: 'Push to main', event: { name: 'push', refName: 'main' } },
        { id: 'push-other', label: 'Push to another branch', event: { name: 'push', refName: 'feature-x' } },
        { id: 'pr', label: 'Pull request into main', event: { name: 'pull_request', refName: 'main', prAction: 'opened' } },
      ],
    },
  ],
},
{
  id: 'm7', title: 'Matrix Builds', blurb: 'Testing many configurations without copy-pasting jobs.',
  lessons: [
    {
      id: 'm7-l1', title: 'Matrix Testing Basics',
      objective: 'Test against Node 16, 18, and 20 instead of just one version.',
      intro: Y(
        '<p><code>strategy.matrix</code> turns one job definition into many parallel runs, one per combination of values. It\'s how you test &ldquo;does this work on every Node version we claim to support&rdquo; without writing the same job three times.</p>',
        '<div class="ref-box"><div class="ref-title">Reading a value back</div><pre class="ref-code">strategy:\n  matrix:\n    node: [16, 18, 20]\nsteps:\n  - uses: actions/setup-node@v4\n    with:\n      node-version: ${{ matrix.node }}</pre></div>'
      ),
      starter: Y(
        'name: Test',
        'on:',
        '  push:',
        '    branches: [main]',
        'jobs:',
        '  test:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - uses: actions/checkout@v4',
        '      - uses: actions/setup-node@v4',
        '        with:',
        '          node-version: \'18\'',
        '      - run: npm ci && npm test'
      ),
      solution: Y(
        'name: Test',
        'on:',
        '  push:',
        '    branches: [main]',
        'jobs:',
        '  test:',
        '    runs-on: ubuntu-latest',
        '    strategy:',
        '      matrix:',
        '        node: [16, 18, 20]',
        '    steps:',
        '      - uses: actions/checkout@v4',
        '      - uses: actions/setup-node@v4',
        '        with:',
        '          node-version: ${{ matrix.node }}',
        '      - run: npm ci && npm test'
      ),
      hints: [
        'Add a <code>strategy: { matrix: { node: [16, 18, 20] } }</code> block to the <code>test</code> job.',
        'Change <code>node-version</code> from the literal <code>\'18\'</code> to <code>${{ matrix.node }}</code>.'
      ],
      checks: [
        { label: 'Matrix covers at least 3 Node versions', test: api => api.parses && Array.isArray(api.job('test').strategy?.matrix?.node) && api.job('test').strategy.matrix.node.length >= 3 },
        { label: 'setup-node reads the version from the matrix', test: api => api.parses && api.stepInJob('test', s => api.usesMatches(s, /setup-node/) && /matrix\.node/.test(String(s.with?.['node-version'] || ''))) },
      ],
    },
    {
      id: 'm7-l2', title: 'include/exclude & fail-fast',
      objective: 'Exclude a known-broken combination, and stop one flaky OS from hiding every other result.',
      intro: Y(
        '<p>A matrix can cross multiple dimensions at once &mdash; <code>os</code> and <code>node</code> together produce every combination, which can add up fast (3 &times; 3 = 9 runners here). <code>exclude</code> removes specific combinations that don\'t make sense (a native dependency that simply doesn\'t build on old Node on Windows, say).</p>',
        '<p>Separately: by default, <code>fail-fast</code> is <code>true</code>, which means the moment <em>any</em> matrix combination fails, GitHub Actions cancels every other still-running combination in that matrix. That\'s great for saving compute on a real break &mdash; and terrible when you\'re trying to see <em>which</em> combinations actually fail, since you only ever see the first one.</p>'
      ),
      starter: Y(
        'name: Cross-Platform Test',
        'on:',
        '  push:',
        '    branches: [main]',
        'jobs:',
        '  test:',
        '    runs-on: ${{ matrix.os }}',
        '    strategy:',
        '      matrix:',
        '        os: [ubuntu-latest, windows-latest, macos-latest]',
        '        node: [16, 18, 20]',
        '    steps:',
        '      - uses: actions/checkout@v4',
        '      - run: npm ci && npm test'
      ),
      solution: Y(
        'name: Cross-Platform Test',
        'on:',
        '  push:',
        '    branches: [main]',
        'jobs:',
        '  test:',
        '    runs-on: ${{ matrix.os }}',
        '    strategy:',
        '      fail-fast: false',
        '      matrix:',
        '        os: [ubuntu-latest, windows-latest, macos-latest]',
        '        node: [16, 18, 20]',
        '        exclude:',
        '          - os: windows-latest',
        '            node: 16',
        '    steps:',
        '      - uses: actions/checkout@v4',
        '      - run: npm ci && npm test'
      ),
      hints: [
        'Add <code>exclude:</code> under <code>matrix</code>, with one item: <code>os: windows-latest</code> and <code>node: 16</code>.',
        'Add <code>fail-fast: false</code> directly under <code>strategy</code>, as a sibling of <code>matrix</code>.'
      ],
      checks: [
        { label: 'Excludes the broken Windows + Node 16 combination', test: api => {
          if (!api.parses) return false;
          const ex = api.job('test').strategy?.matrix?.exclude;
          return Array.isArray(ex) && ex.some(e => String(e.os) === 'windows-latest' && String(e.node) === '16');
        } },
        { label: 'A single flaky combination no longer hides the rest', test: api => api.parses && api.job('test').strategy?.['fail-fast'] === false },
      ],
      scenarios: [
        { id: 'flake', label: 'Node 18 fails its tests', event: { name: 'push', refName: 'main' }, overrides: { forceFailMatrix: { jobKey: 'test', match: { node: 18 }, message: 'Assertion failed: expected 200, got 500' } } },
      ],
    },
  ],
},
{
  id: 'm8', title: 'Caching & Artifacts', blurb: 'Speeding up runs and passing build output between jobs.',
  lessons: [
    {
      id: 'm8-l1', title: 'Caching Dependencies',
      objective: 'Cache node_modules so every run isn\'t a cold install.',
      intro: Y(
        '<p><code>actions/cache</code> saves a directory between runs, keyed by a string you control &mdash; usually a hash of the lockfile, via the <code>hashFiles()</code> function. If the lockfile hasn\'t changed, the next run restores dependencies straight from cache instead of re-downloading the entire registry.</p>',
        '<div class="ref-box"><div class="ref-title">The standard pattern</div><pre class="ref-code">- uses: actions/cache@v4\n  with:\n    path: node_modules\n    key: ${{ runner.os }}-modules-${{ hashFiles(\'**/package-lock.json\') }}</pre></div>'
      ),
      starter: Y(
        'name: Build',
        'on:',
        '  push:',
        '    branches: [main]',
        'jobs:',
        '  build:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - uses: actions/checkout@v4',
        '      - run: npm ci',
        '      - run: npm run build'
      ),
      solution: Y(
        'name: Build',
        'on:',
        '  push:',
        '    branches: [main]',
        'jobs:',
        '  build:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - uses: actions/checkout@v4',
        '      - uses: actions/cache@v4',
        '        with:',
        '          path: node_modules',
        '          key: ${{ runner.os }}-modules-${{ hashFiles(\'**/package-lock.json\') }}',
        '      - run: npm ci',
        '      - run: npm run build'
      ),
      hints: ['Add an <code>actions/cache@v4</code> step before <code>npm ci</code>, caching <code>node_modules</code> with a key built from <code>hashFiles(\'**/package-lock.json\')</code>.'],
      checks: [
        { label: 'Caches dependencies before installing', test: api => { const idx = api.stepsOf('build').findIndex(s => api.usesMatches(s, /actions\/cache@v4/)); const installIdx = api.stepsOf('build').findIndex(s => api.runMatches(s, /npm ci/)); return api.parses && idx !== -1 && installIdx !== -1 && idx < installIdx; } },
        { label: 'Cache key is based on the lockfile hash', test: api => api.parses && api.stepInJob('build', s => api.usesMatches(s, /actions\/cache@v4/) && /hashFiles\(/.test(String(s.with?.key || ''))) },
      ],
    },
    {
      id: 'm8-l2', title: 'Artifacts Between Jobs',
      objective: 'Hand the compiled dist/ folder from build to deploy &mdash; they run on different machines.',
      intro: Y(
        '<p>Caching speeds up repeated work within similar runs; <strong>artifacts</strong> move files between <em>different jobs in the same run</em>. <code>build</code> and <code>deploy</code> each get a brand-new, empty virtual machine &mdash; whatever <code>build</code> compiled doesn\'t exist for <code>deploy</code> unless it\'s explicitly uploaded and downloaded.</p>'
      ),
      starter: Y(
        'name: Build And Deploy',
        'on:',
        '  push:',
        '    branches: [main]',
        'jobs:',
        '  build:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - uses: actions/checkout@v4',
        '      - run: npm run build',
        '  deploy:',
        '    needs: build',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - run: ./publish.sh dist/'
      ),
      solution: Y(
        'name: Build And Deploy',
        'on:',
        '  push:',
        '    branches: [main]',
        'jobs:',
        '  build:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - uses: actions/checkout@v4',
        '      - run: npm run build',
        '      - uses: actions/upload-artifact@v4',
        '        with:',
        '          name: dist',
        '          path: dist/',
        '  deploy:',
        '    needs: build',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - uses: actions/download-artifact@v4',
        '        with:',
        '          name: dist',
        '          path: dist/',
        '      - run: ./publish.sh dist/'
      ),
      hints: [
        'In <code>build</code>, add an <code>actions/upload-artifact@v4</code> step after the build, with <code>name: dist</code> and <code>path: dist/</code>.',
        'In <code>deploy</code>, add an <code>actions/download-artifact@v4</code> step before publishing, matching the same <code>name</code>.'
      ],
      checks: [
        { label: '<code>build</code> uploads the dist folder', test: api => api.parses && api.stepInJob('build', s => api.usesMatches(s, /actions\/upload-artifact@v4/) && /dist/.test(String(s.with?.path || ''))) },
        { label: '<code>deploy</code> downloads it back', test: api => api.parses && api.stepInJob('deploy', s => api.usesMatches(s, /actions\/download-artifact@v4/)) },
      ],
    },
  ],
},
{
  id: 'm9', title: 'Reusability', blurb: 'Writing CI logic once and calling it from everywhere.',
  lessons: [
    {
      id: 'm9-l1', title: 'Reusable Workflows',
      objective: 'Turn a one-off workflow into a library other workflows can call.',
      intro: Y(
        '<p>A <strong>reusable workflow</strong> is just a normal workflow file whose trigger is <code>workflow_call</code> instead of <code>push</code> or <code>pull_request</code>. Other workflows can then <code>uses:</code> it by path, exactly like calling a marketplace action, passing data in through declared <code>inputs</code>.</p>',
        '<p>This is a senior staple for avoiding fifteen near-identical copies of the same deploy logic scattered across a monorepo &mdash; write it once, as a reusable workflow, and call it from each service\'s own thin workflow.</p>'
      ),
      starter: Y(
        'name: Deploy Service',
        'on:',
        '  push:',
        '    branches: [main]',
        'jobs:',
        '  deploy:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - run: ./deploy.sh ${{ inputs.environment }}'
      ),
      solution: Y(
        'name: Deploy Service',
        'on:',
        '  workflow_call:',
        '    inputs:',
        '      environment:',
        '        required: true',
        '        type: string',
        'jobs:',
        '  deploy:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - run: ./deploy.sh ${{ inputs.environment }}'
      ),
      hints: ['Replace the <code>push</code> trigger with <code>workflow_call</code>, declaring one required <code>environment</code> input of <code>type: string</code>.'],
      checks: [
        { label: 'Triggered by <code>workflow_call</code>, not a direct push', test: api => api.parses && !!api.parsed.on?.workflow_call && !api.parsed.on.push },
        { label: 'Declares a required <code>environment</code> input', test: api => api.parses && !!api.parsed.on?.workflow_call?.inputs?.environment?.required },
      ],
      tip: 'The caller side looks like: <code>uses: ./.github/workflows/deploy-service.yml</code> with <code>with: { environment: production }</code> and, if it needs them, <code>secrets: inherit</code>.',
    },
    {
      id: 'm9-l2', title: 'Composite Actions',
      objective: 'Fix a composite action so it actually declares what shell to run its steps in.',
      intro: Y(
        '<p>A <strong>composite action</strong> packages a handful of ordinary steps into one reusable step, defined in its own <code>action.yml</code> &mdash; useful for a short sequence (like &ldquo;checkout, install, and lint&rdquo;) you want to drop into many workflows as a single line. Its own top-level shape is different from a workflow file: <code>runs.using: composite</code>, then a <code>steps</code> list.</p>',
        '<p class="tip"><strong>The gotcha:</strong> unlike a step inside a normal job, every <code>run</code> step inside a composite action must declare its own <code>shell:</code> &mdash; GitHub Actions won\'t infer one, and leaving it out is a hard error.</p>'
      ),
      starter: Y(
        'name: Lint And Format Check',
        'description: Runs lint and format checks as one reusable step',
        'runs:',
        '  steps:',
        '    - run: npm run lint',
        '    - run: npm run format:check'
      ),
      solution: Y(
        'name: Lint And Format Check',
        'description: Runs lint and format checks as one reusable step',
        'runs:',
        '  using: composite',
        '  steps:',
        '    - run: npm run lint',
        '      shell: bash',
        '    - run: npm run format:check',
        '      shell: bash'
      ),
      hints: [
        'Add <code>using: composite</code> under <code>runs:</code>, above <code>steps:</code>.',
        'Add <code>shell: bash</code> to every <code>run</code> step &mdash; it\'s required, not optional, in a composite action.'
      ],
      checks: [
        { label: 'Declared as a composite action', test: api => api.parses && api.parsed.runs?.using === 'composite' },
        { label: 'Every run step declares its shell', test: api => api.parses && api.toArray(api.parsed.runs?.steps).every(s => !s.run || !!s.shell) },
      ],
    },
  ],
},
{
  id: 'm10', title: 'Environments & Deployment Gates', blurb: 'Putting a human, or a queue, between code and production.',
  lessons: [
    {
      id: 'm10-l1', title: 'Environments & Manual Approval',
      objective: 'Require a human to approve before this job can touch production.',
      intro: Y(
        '<p>An <code>environment:</code> links a job to a named target configured in repository settings. On its own it\'s just a label &mdash; but once that environment has a <strong>protection rule</strong> (required reviewers, say), any job targeting it pauses and waits for a human to click Approve before it continues, no matter how fast the pipeline otherwise runs.</p>'
      ),
      starter: Y(
        'name: Release',
        'on:',
        '  push:',
        '    branches: [main]',
        'jobs:',
        '  deploy:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - run: ./deploy.sh production'
      ),
      solution: Y(
        'name: Release',
        'on:',
        '  push:',
        '    branches: [main]',
        'jobs:',
        '  deploy:',
        '    runs-on: ubuntu-latest',
        '    environment: production',
        '    steps:',
        '      - run: ./deploy.sh production'
      ),
      hints: ['Add <code>environment: production</code> to the <code>deploy</code> job, at the same indent as <code>runs-on</code>.'],
      checks: [
        { label: '<code>deploy</code> targets the <code>production</code> environment', test: api => { const e = api.job('deploy').environment; return api.parses && (e === 'production' || e?.name === 'production'); } },
      ],
      scenarios: [{ id: 'default', label: 'Push to main', event: { name: 'push', refName: 'main' }, overrides: { protectedEnvironments: ['production'] } }],
    },
    {
      id: 'm10-l2', title: 'Concurrency Control',
      objective: 'Stop two overlapping deploys to the same branch from racing each other.',
      intro: Y(
        '<p>Push twice in quick succession and, by default, GitHub Actions happily starts two full, independent runs &mdash; which can finish out of order and leave production on an older commit than the one someone thinks they just shipped. <code>concurrency</code> groups runs by a key you choose; when <code>cancel-in-progress</code> is true, a new run in the same group cancels whatever\'s still in flight.</p>'
      ),
      starter: Y(
        'name: Release',
        'on:',
        '  push:',
        '    branches: [main]',
        'jobs:',
        '  deploy:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - run: ./deploy.sh production'
      ),
      solution: Y(
        'name: Release',
        'on:',
        '  push:',
        '    branches: [main]',
        'concurrency:',
        '  group: ${{ github.workflow }}-${{ github.ref }}',
        '  cancel-in-progress: true',
        'jobs:',
        '  deploy:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - run: ./deploy.sh production'
      ),
      hints: ['Add a top-level <code>concurrency:</code> block with <code>group: ${{ github.workflow }}-${{ github.ref }}</code> and <code>cancel-in-progress: true</code>.'],
      checks: [
        { label: 'Groups runs by workflow and branch', test: api => api.parses && typeof api.parsed.concurrency?.group === 'string' && /github\.(workflow|ref)/.test(api.parsed.concurrency.group) },
        { label: 'Cancels superseded runs', test: api => api.parses && api.parsed.concurrency?.['cancel-in-progress'] === true },
      ],
      scenarios: [{ id: 'race', label: 'A newer push arrives mid-deploy', event: { name: 'push', refName: 'main' }, overrides: { simulateSupersededRun: true } }],
    },
  ],
},
{
  id: 'm11', title: 'Containers & Docker', blurb: 'Building images and spinning up service dependencies.',
  lessons: [
    {
      id: 'm11-l1', title: 'Building & Pushing a Docker Image',
      objective: 'Log in to the registry and actually publish the image you build.',
      intro: Y(
        '<p>Building an image on the runner is only half the job &mdash; without pushing it to a registry, the image vanishes the moment the runner is torn down. The standard pair: <code>docker/login-action</code> authenticates to a registry (here, GitHub Container Registry, <code>ghcr.io</code>, using the automatic <code>GITHUB_TOKEN</code>), then <code>docker/build-push-action</code> builds <em>and</em> pushes in one step when <code>push: true</code>.</p>'
      ),
      starter: Y(
        'name: Docker Build',
        'on:',
        '  push:',
        '    branches: [main]',
        'jobs:',
        '  build:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - uses: actions/checkout@v4',
        '      - name: Build image',
        '        run: docker build -t orbit-api .'
      ),
      solution: Y(
        'name: Docker Build',
        'on:',
        '  push:',
        '    branches: [main]',
        'jobs:',
        '  build:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - uses: actions/checkout@v4',
        '      - name: Log in to GHCR',
        '        uses: docker/login-action@v3',
        '        with:',
        '          registry: ghcr.io',
        '          username: ${{ github.actor }}',
        '          password: ${{ secrets.GITHUB_TOKEN }}',
        '      - name: Build and push image',
        '        uses: docker/build-push-action@v6',
        '        with:',
        '          push: true',
        '          tags: ghcr.io/${{ github.repository }}:latest'
      ),
      hints: [
        'Add a <code>docker/login-action@v3</code> step with <code>registry: ghcr.io</code>, <code>username: ${{ github.actor }}</code>, and <code>password: ${{ secrets.GITHUB_TOKEN }}</code>.',
        'Replace the raw <code>docker build</code> command with <code>docker/build-push-action@v6</code>, setting <code>push: true</code> and a <code>tags:</code> pointing at <code>ghcr.io</code>.'
      ],
      checks: [
        { label: 'Logs in to GHCR', test: api => api.parses && api.stepInJob('build', s => api.usesMatches(s, /docker\/login-action@v\d/) && /ghcr\.io/.test(String(s.with?.registry || ''))) },
        { label: 'Actually pushes the built image', test: api => api.parses && api.stepInJob('build', s => api.usesMatches(s, /docker\/build-push-action@v\d/) && s.with?.push === true) },
      ],
    },
    {
      id: 'm11-l2', title: 'Service Containers for Testing',
      objective: 'Give the integration test suite a real database to talk to.',
      intro: Y(
        '<p>Integration tests that need a real database don\'t have one by default on a bare runner. <code>services:</code> spins up an extra container alongside your job &mdash; reachable over <code>localhost</code> at the port you map &mdash; for exactly the lifetime of that job, then tears it down automatically.</p>'
      ),
      starter: Y(
        'name: Integration Tests',
        'on:',
        '  push:',
        '    branches: [main]',
        'jobs:',
        '  test:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - uses: actions/checkout@v4',
        '      - run: npm run test:integration'
      ),
      solution: Y(
        'name: Integration Tests',
        'on:',
        '  push:',
        '    branches: [main]',
        'jobs:',
        '  test:',
        '    runs-on: ubuntu-latest',
        '    services:',
        '      postgres:',
        '        image: postgres:16',
        '        env:',
        '          POSTGRES_PASSWORD: test',
        '        ports:',
        '          - 5432:5432',
        '    steps:',
        '      - uses: actions/checkout@v4',
        '      - run: npm run test:integration'
      ),
      hints: ['Add a <code>services:</code> block to the <code>test</code> job with a <code>postgres</code> service, <code>image: postgres:16</code>, and <code>ports: [5432:5432]</code>.'],
      checks: [
        { label: 'Runs a Postgres service container', test: api => api.parses && /postgres/i.test(String(api.job('test').services?.postgres?.image || '')) },
        { label: 'Exposes it on the standard port', test: api => api.parses && api.toArray(api.job('test').services?.postgres?.ports).some(p => String(p).includes('5432')) },
      ],
    },
  ],
},
{
  id: 'm12', title: 'Cloud Deployment', blurb: 'Reaching AWS and Azure without ever storing a long-lived key.',
  lessons: [
    {
      id: 'm12-l1', title: 'Deploying to AWS with OIDC',
      objective: 'Replace a hardcoded AWS access key with a short-lived OIDC-assumed role.',
      intro: Y(
        '<p>Long-lived AWS access keys stored as secrets are a standing liability &mdash; if they ever leak, they work until someone notices and manually revokes them. OpenID Connect (OIDC) lets GitHub Actions request a short-lived token straight from AWS, scoped to one job, valid for minutes, with no stored key at all.</p>',
        '<div class="ref-box"><div class="ref-title">What it takes</div><pre class="ref-code">permissions:\n  id-token: write   # lets THIS job request an OIDC token\n\n- uses: aws-actions/configure-aws-credentials@v4\n  with:\n    role-to-assume: ${{ secrets.AWS_ROLE_ARN }}\n    aws-region: us-east-1</pre></div>'
      ),
      starter: Y(
        'name: Deploy to AWS',
        'on:',
        '  push:',
        '    branches: [main]',
        'jobs:',
        '  deploy:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - uses: aws-actions/configure-aws-credentials@v4',
        '        with:',
        '          aws-access-key-id: AKIAABCDEFGHIJKLMNOP',
        '          aws-secret-access-key: ${{ secrets.AWS_SECRET }}',
        '          aws-region: us-east-1',
        '      - run: aws s3 sync ./dist s3://orbit-web-prod'
      ),
      solution: Y(
        'name: Deploy to AWS',
        'on:',
        '  push:',
        '    branches: [main]',
        'jobs:',
        '  deploy:',
        '    runs-on: ubuntu-latest',
        '    permissions:',
        '      id-token: write',
        '      contents: read',
        '    steps:',
        '      - uses: aws-actions/configure-aws-credentials@v4',
        '        with:',
        '          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}',
        '          aws-region: us-east-1',
        '      - run: aws s3 sync ./dist s3://orbit-web-prod'
      ),
      hints: [
        'Add <code>permissions: { id-token: write, contents: read }</code> to the <code>deploy</code> job.',
        'Replace the hardcoded <code>aws-access-key-id</code> and <code>aws-secret-access-key</code> with a single <code>role-to-assume: ${{ secrets.AWS_ROLE_ARN }}</code>.'
      ],
      checks: [
        { label: 'No hardcoded AWS access key remains', test: api => api.parses && !api.anyRawLineMatches(/AKIA[0-9A-Z]{10,}/) },
        { label: 'Requests an OIDC token for this job', test: api => api.parses && (api.job('deploy').permissions?.['id-token'] === 'write' || api.parsed.permissions?.['id-token'] === 'write') },
        { label: 'Assumes a role instead of using static keys', test: api => api.parses && api.stepInJob('deploy', s => api.usesMatches(s, /configure-aws-credentials@v\d/) && /secrets\./.test(String(s.with?.['role-to-assume'] || ''))) },
      ],
    },
    {
      id: 'm12-l2', title: 'Deploying to Azure with OIDC',
      objective: 'Swap a hardcoded Azure client secret for federated, keyless login.',
      intro: Y(
        '<p>Azure\'s equivalent pattern uses <code>azure/login</code> with three identifiers &mdash; <code>client-id</code>, <code>tenant-id</code>, <code>subscription-id</code> &mdash; and, with federated credentials configured on the Azure side, no password or client secret ever has to exist as a GitHub secret at all.</p>'
      ),
      starter: Y(
        'name: Deploy to Azure',
        'on:',
        '  push:',
        '    branches: [main]',
        'jobs:',
        '  deploy:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - uses: azure/login@v2',
        '        with:',
        '          creds: \'{"clientSecret":"super-secret-password123"}\'',
        '      - run: az webapp deploy --name orbit-web'
      ),
      solution: Y(
        'name: Deploy to Azure',
        'on:',
        '  push:',
        '    branches: [main]',
        'jobs:',
        '  deploy:',
        '    runs-on: ubuntu-latest',
        '    permissions:',
        '      id-token: write',
        '      contents: read',
        '    steps:',
        '      - uses: azure/login@v2',
        '        with:',
        '          client-id: ${{ secrets.AZURE_CLIENT_ID }}',
        '          tenant-id: ${{ secrets.AZURE_TENANT_ID }}',
        '          subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}',
        '      - run: az webapp deploy --name orbit-web'
      ),
      hints: [
        'Add <code>permissions: { id-token: write, contents: read }</code> to the job.',
        'Replace the <code>creds:</code> input with <code>client-id</code>, <code>tenant-id</code>, and <code>subscription-id</code>, each reading from a secret.'
      ],
      checks: [
        { label: 'No hardcoded client secret remains', test: api => api.parses && !api.anyRawLineMatches(/clientSecret/i) },
        { label: 'Requests an OIDC token for this job', test: api => api.parses && (api.job('deploy').permissions?.['id-token'] === 'write' || api.parsed.permissions?.['id-token'] === 'write') },
        { label: 'Logs in with federated identifiers, not a password', test: api => api.parses && api.stepInJob('deploy', s => api.usesMatches(s, /azure\/login@v\d/) && /\$\{\{/.test(String(s.with?.['client-id'] || '')) && /\$\{\{/.test(String(s.with?.['tenant-id'] || ''))) },
      ],
    },
  ],
},
{
  id: 'm13', title: 'Monorepos & Scale', blurb: 'Keeping CI fast and organized as the repository grows.',
  lessons: [
    {
      id: 'm13-l1', title: 'Path Filters for Monorepos',
      objective: 'Only run this pipeline when the API service, or shared code it depends on, actually changes.',
      intro: Y(
        '<p>In a monorepo holding several services, a workflow that triggers on every push &mdash; regardless of which service changed &mdash; wastes runners on work that can\'t possibly be affected, and buries real signal under noise. <code>paths:</code> scopes the trigger to just the directories that matter.</p>'
      ),
      starter: Y(
        'name: API CI',
        'on:',
        '  push:',
        '    branches: [main]',
        'jobs:',
        '  test:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - uses: actions/checkout@v4',
        '      - run: npm --prefix services/api test'
      ),
      solution: Y(
        'name: API CI',
        'on:',
        '  push:',
        '    branches: [main]',
        '    paths:',
        '      - \'services/api/**\'',
        '      - \'packages/shared/**\'',
        'jobs:',
        '  test:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - uses: actions/checkout@v4',
        '      - run: npm --prefix services/api test'
      ),
      hints: ['Add a <code>paths:</code> list under <code>push</code>, including both <code>\'services/api/**\'</code> and <code>\'packages/shared/**\'</code>.'],
      checks: [
        { label: 'Scoped to the API service', test: api => api.parses && api.toArray(api.parsed.on?.push?.paths).some(p => /services\/api/.test(String(p))) },
        { label: 'Still reacts to shared-package changes', test: api => api.parses && api.toArray(api.parsed.on?.push?.paths).some(p => /packages\/shared/.test(String(p))) },
      ],
      scenarios: [
        { id: 'api', label: 'API files changed', event: { name: 'push', refName: 'main', paths: ['services/api/handler.js'] } },
        { id: 'shared', label: 'Shared package changed', event: { name: 'push', refName: 'main', paths: ['packages/shared/utils.js'] } },
        { id: 'web', label: 'Only the web app changed', event: { name: 'push', refName: 'main', paths: ['services/web/index.tsx'] } },
      ],
    },
    {
      id: 'm13-l2', title: 'Organizing Workflows at Scale',
      objective: 'Replace three copy-pasted jobs with one matrix that calls a shared, per-service workflow.',
      intro: Y(
        '<p>Copy-pasting a job per service works for two services. It stops working at ten. The senior pattern: drive a <code>matrix</code> over the list of services, and have each matrix entry call one shared reusable workflow, passing just which service it\'s building.</p>'
      ),
      starter: Y(
        'name: All Services CI',
        'on:',
        '  push:',
        '    branches: [main]',
        'jobs:',
        '  api:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - run: ./ci.sh api',
        '  web:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - run: ./ci.sh web',
        '  worker:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - run: ./ci.sh worker'
      ),
      solution: Y(
        'name: All Services CI',
        'on:',
        '  push:',
        '    branches: [main]',
        'jobs:',
        '  ci:',
        '    strategy:',
        '      matrix:',
        '        service: [api, web, worker]',
        '    uses: ./.github/workflows/service-ci.yml',
        '    with:',
        '      service: ${{ matrix.service }}'
      ),
      hints: [
        'Collapse the three jobs into one, <code>ci:</code>, with <code>strategy.matrix.service: [api, web, worker]</code>.',
        'Point it at the shared file with <code>uses: ./.github/workflows/service-ci.yml</code> and pass <code>with: { service: ${{ matrix.service }} }</code>.'
      ],
      checks: [
        { label: 'One matrix drives every service', test: api => api.parses && Array.isArray(api.job('ci').strategy?.matrix?.service) && api.job('ci').strategy.matrix.service.length >= 3 },
        { label: 'Calls a single shared workflow per service', test: api => api.parses && typeof api.job('ci').uses === 'string' && /\.github\/workflows\/.+\.ya?ml$/.test(api.job('ci').uses) && /matrix\.service/.test(JSON.stringify(api.job('ci').with || {})) },
      ],
    },
  ],
},
{
  id: 'm14', title: 'Security Hardening', blurb: 'The habits that separate a working pipeline from a safe one.',
  lessons: [
    {
      id: 'm14-l1', title: 'Least-Privilege Permissions',
      objective: 'Lock the default token down to read-only, then grant just the one job that needs more.',
      intro: Y(
        '<p>Every run gets an automatic <code>GITHUB_TOKEN</code>, scoped by default according to your organization\'s settings &mdash; which, on many repositories, means broad read <em>and write</em> access to the whole repository for every job, whether it needs it or not. Explicitly setting <code>permissions:</code> at the top of the file overrides that default to the minimum necessary, and individual jobs can still request more where they genuinely need it.</p>'
      ),
      starter: Y(
        'name: PR Automation',
        'on:',
        '  pull_request:',
        '    branches: [main]',
        'jobs:',
        '  test:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - run: npm test',
        '  comment:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - run: ./post-coverage-comment.sh'
      ),
      solution: Y(
        'name: PR Automation',
        'on:',
        '  pull_request:',
        '    branches: [main]',
        'permissions:',
        '  contents: read',
        'jobs:',
        '  test:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - run: npm test',
        '  comment:',
        '    runs-on: ubuntu-latest',
        '    permissions:',
        '      pull-requests: write',
        '    steps:',
        '      - run: ./post-coverage-comment.sh'
      ),
      hints: [
        'Add a top-level <code>permissions: { contents: read }</code> block.',
        'On the <code>comment</code> job specifically, add its own <code>permissions: { pull-requests: write }</code> &mdash; job-level permissions add to, not replace, the baseline.'
      ],
      checks: [
        { label: 'Default token is read-only by default', test: api => api.parses && api.parsed.permissions?.contents === 'read' },
        { label: '<code>comment</code> gets only the extra scope it needs', test: api => api.parses && api.job('comment').permissions?.['pull-requests'] === 'write' },
      ],
    },
    {
      id: 'm14-l2', title: 'Pin Third-Party Actions to a SHA',
      objective: 'Pin a third-party action to its exact commit, not a tag the publisher could move.',
      intro: Y(
        '<p>A version tag is a pointer a publisher\'s account can repoint at any time &mdash; including, in a supply-chain compromise, by an attacker who gains access to that account. A commit SHA can\'t be silently swapped: it names one exact, immutable snapshot of the code that will run with your repository\'s secrets.</p>',
        '<p class="tip">Teams that do this still keep a human-readable version number as a trailing comment, so nobody has to decode a 40-character hex string to know what they\'re running.</p>'
      ),
      starter: Y(
        'name: Changed Files',
        'on:',
        '  pull_request:',
        '    branches: [main]',
        'jobs:',
        '  diff:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - uses: actions/checkout@v4',
        '      - uses: tj-actions/changed-files@v44',
        '        id: changed'
      ),
      solution: Y(
        'name: Changed Files',
        'on:',
        '  pull_request:',
        '    branches: [main]',
        'jobs:',
        '  diff:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - uses: actions/checkout@v4',
        '      - uses: tj-actions/changed-files@a1b40a2d2b8513184d926b5e62e07cbee8c1c1a0 # v44.5.1',
        '        id: changed'
      ),
      hints: ['Replace <code>@v44</code> with <code>@a1b40a2d2b8513184d926b5e62e07cbee8c1c1a0</code>, and add <code># v44.5.1</code> afterward as a readable comment.'],
      checks: [
        { label: 'Pinned to a full 40-character commit SHA', test: api => api.parses && api.anyStepUses(/tj-actions\/changed-files@[0-9a-f]{40}/) },
      ],
    },
    {
      id: 'm14-l3', title: 'Avoiding pull_request_target Footguns',
      objective: 'Stop running untrusted fork code in a context that has access to repository secrets.',
      intro: Y(
        '<p><code>pull_request_target</code> runs with the <em>base</em> repository\'s permissions and secrets &mdash; unlike plain <code>pull_request</code>, which runs with no secret access when the PR comes from a fork. That makes <code>pull_request_target</code> dangerous the moment a job also checks out and executes the PR\'s own code: a malicious fork can submit a PR whose test script simply exfiltrates every secret the job can see.</p>',
        '<p>This job doesn\'t actually need any secret &mdash; it only builds and tests. The fix is to trigger it on plain <code>pull_request</code> instead, where that whole class of attack doesn\'t apply.</p>'
      ),
      starter: Y(
        'name: PR Build',
        'on:',
        '  pull_request_target:',
        '    branches: [main]',
        'jobs:',
        '  build:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - uses: actions/checkout@v4',
        '        with:',
        '          ref: ${{ github.event.pull_request.head.sha }}',
        '      - run: npm ci && npm test'
      ),
      solution: Y(
        'name: PR Build',
        'on:',
        '  pull_request:',
        '    branches: [main]',
        'jobs:',
        '  build:',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - uses: actions/checkout@v4',
        '        with:',
        '          ref: ${{ github.event.pull_request.head.sha }}',
        '      - run: npm ci && npm test'
      ),
      hints: ['Change <code>pull_request_target</code> to <code>pull_request</code> &mdash; nothing else about this job needs to change.'],
      checks: [
        { label: 'No longer uses the privileged trigger', test: api => api.parses && !api.parsed.on?.pull_request_target },
        { label: 'Uses the safe trigger instead', test: api => api.parses && !!api.parsed.on?.pull_request },
      ],
    },
  ],
},
{
  id: 'm15', title: 'Capstone', blurb: 'Everything you\'ve learned, in one pipeline.',
  lessons: [
    {
      id: 'm15-l1', title: 'Capstone: Ship It Like a Senior',
      objective: 'Build a complete release pipeline from a blank file, meeting every requirement below.',
      intro: Y(
        '<p>No more fill-in-the-blank &mdash; this is a blank file and a specification. Everything from the last fifteen modules shows up somewhere in it. Work through the checklist on the right one item at a time; it maps directly onto the requirements below.</p>',
        '<div class="ref-box"><div class="ref-title">Specification</div><ol class="spec-list">',
        '<li>Trigger on push to <code>main</code>, and allow a manual run too.</li>',
        '<li>Lock the default token to <code>contents: read</code> at the workflow level.</li>',
        '<li>Cancel a superseded run of the same branch automatically.</li>',
        '<li>A <code>test</code> job: checkout, matrix across Node 18 and 20, cached installs, then lint and test.</li>',
        '<li>A <code>build-image</code> job, needing <code>test</code>, that logs in and pushes a Docker image to GHCR &mdash; but only on <code>main</code>.</li>',
        '<li>A <code>deploy</code> job, needing <code>build-image</code>, gated behind the <code>production</code> environment, that assumes an AWS role over OIDC with no hardcoded credentials &mdash; only on <code>main</code>.</li>',
        '</ol></div>'
      ),
      starter: Y(
        '# Release Pipeline — build this from the specification in the briefing.',
        'name: Release Pipeline',
        'on: {}',
        'jobs: {}'
      ),
      solution: Y(
        'name: Release Pipeline',
        'on:',
        '  push:',
        '    branches: [main]',
        '  workflow_dispatch:',
        'permissions:',
        '  contents: read',
        'concurrency:',
        '  group: ${{ github.workflow }}-${{ github.ref }}',
        '  cancel-in-progress: true',
        'jobs:',
        '  test:',
        '    runs-on: ubuntu-latest',
        '    strategy:',
        '      matrix:',
        '        node: [18, 20]',
        '    steps:',
        '      - uses: actions/checkout@v4',
        '      - uses: actions/setup-node@v4',
        '        with:',
        '          node-version: ${{ matrix.node }}',
        '      - uses: actions/cache@v4',
        '        with:',
        '          path: node_modules',
        '          key: ${{ runner.os }}-modules-${{ hashFiles(\'**/package-lock.json\') }}',
        '      - run: npm ci',
        '      - run: npm run lint',
        '      - run: npm test',
        '  build-image:',
        '    needs: test',
        '    if: github.ref_name == \'main\'',
        '    runs-on: ubuntu-latest',
        '    steps:',
        '      - uses: actions/checkout@v4',
        '      - uses: docker/login-action@v3',
        '        with:',
        '          registry: ghcr.io',
        '          username: ${{ github.actor }}',
        '          password: ${{ secrets.GITHUB_TOKEN }}',
        '      - uses: docker/build-push-action@v6',
        '        with:',
        '          push: true',
        '          tags: ghcr.io/${{ github.repository }}:${{ github.sha }}',
        '  deploy:',
        '    needs: build-image',
        '    if: github.ref_name == \'main\'',
        '    runs-on: ubuntu-latest',
        '    environment: production',
        '    permissions:',
        '      id-token: write',
        '      contents: read',
        '    steps:',
        '      - uses: aws-actions/configure-aws-credentials@v4',
        '        with:',
        '          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}',
        '          aws-region: us-east-1',
        '      - run: aws ecs update-service --cluster orbit --service api --force-new-deployment'
      ),
      hints: [
        'Build it one requirement at a time, top to bottom &mdash; <code>on</code> and <code>permissions</code> and <code>concurrency</code> first, since nothing else depends on them.',
        'Every piece here was its own earlier lesson: triggers (M2), needs (M3), matrix+cache (M7&ndash;M8), Docker (M11), environments+OIDC (M10&amp;M12). Revisit one if you\'re stuck on its syntax.',
        'Remember the <code>if:</code> on both <code>build-image</code> and <code>deploy</code> &mdash; without it, a manual dispatch from a branch other than main would still try to ship.'
      ],
      checks: [
        { label: 'Triggers on push to main and manual dispatch', test: api => api.parses && api.toArray(api.parsed.on?.push?.branches).includes('main') && api.parsed.on?.workflow_dispatch !== undefined },
        { label: 'Default token locked to read-only', test: api => api.parses && api.parsed.permissions?.contents === 'read' },
        { label: 'Cancels superseded runs of the same branch', test: api => api.parses && typeof api.parsed.concurrency?.group === 'string' && /github\.ref/.test(api.parsed.concurrency.group) && api.parsed.concurrency?.['cancel-in-progress'] === true },
        { label: '<code>test</code> runs a Node matrix with caching', test: api => api.parses && api.hasJob('test') && Array.isArray(api.job('test').strategy?.matrix?.node) && api.job('test').strategy.matrix.node.length >= 2 && api.stepInJob('test', s => api.usesMatches(s, /actions\/cache@v\d/)) },
        { label: '<code>test</code> checks out, lints, and tests', test: api => api.parses && api.stepInJob('test', s => api.usesMatches(s, /actions\/checkout@v\d/)) && api.stepInJob('test', s => api.runMatches(s, /lint/)) && api.stepInJob('test', s => api.runMatches(s, /test/)) },
        { label: '<code>build-image</code> needs <code>test</code> and only runs on main', test: api => api.parses && api.hasJob('build-image') && api.needsOf('build-image').includes('test') && api.evalIf('build-image', { github: { ref_name: 'main' } }) === true && api.evalIf('build-image', { github: { ref_name: 'feature-x' } }) === false },
        { label: '<code>build-image</code> pushes to GHCR', test: api => api.parses && api.stepInJob('build-image', s => api.usesMatches(s, /docker\/login-action@v\d/)) && api.stepInJob('build-image', s => api.usesMatches(s, /docker\/build-push-action@v\d/) && s.with?.push === true) },
        { label: '<code>deploy</code> needs <code>build-image</code>, gated by the production environment', test: api => { if (!api.parses || !api.hasJob('deploy')) return false; const e = api.job('deploy').environment; return api.needsOf('deploy').includes('build-image') && (e === 'production' || e?.name === 'production'); } },
        { label: '<code>deploy</code> uses OIDC, not static AWS keys', test: api => api.parses && api.hasJob('deploy') && (api.job('deploy').permissions?.['id-token'] === 'write') && api.stepInJob('deploy', s => api.usesMatches(s, /configure-aws-credentials@v\d/) && /secrets\./.test(String(s.with?.['role-to-assume'] || ''))) && !api.anyRawLineMatches(/AKIA[0-9A-Z]{10,}/) },
      ],
      scenarios: [
        { id: 'main', label: 'Push to main', event: { name: 'push', refName: 'main' }, overrides: { protectedEnvironments: ['production'] } },
        { id: 'feature', label: 'Manually dispatched from a feature branch', event: { name: 'workflow_dispatch', refName: 'feature-x' }, overrides: { protectedEnvironments: ['production'] } },
        { id: 'manual', label: 'Manually dispatched from main', event: { name: 'workflow_dispatch', refName: 'main' }, overrides: { protectedEnvironments: ['production'] } },
      ],
    },
  ],
},
];

if (typeof module !== 'undefined') module.exports = { MODULES, Y };

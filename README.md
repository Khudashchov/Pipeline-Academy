# Pipeline Academy

An interactive, [learngitbranching](https://learngitbranching.js.org/)-style course that teaches
developers GitHub Actions CI/CD from zero knowledge of YAML to the patterns senior engineers use
in production: triggers, job graphs, matrix builds, caching, reusable workflows, environments and
approval gates, Docker, deploying to AWS/Azure via OIDC, monorepo path filters, and security
hardening — ending in a capstone that combines all of it into one pipeline.

Each lesson gives you a real `.yml` file with a genuine gap or bug to fix in a syntax-highlighted
editor, grades your file against a mission checklist, and lets you simulate a run: the engine
parses your YAML for real, builds the actual job dependency graph, expands matrices, evaluates your
`if:` expressions and trigger filters, and animates the pipeline — including interactive moments
like approving a deployment to a protected environment.

**[Live page](pipeline-academy.html)** — a single self-contained HTML file, no build step required
to use it; just open it in a browser.

## How it's built

```
src/
  engine/    expr.js, triggers.js, scheduler.js   — the GitHub Actions simulation
  lessons/   lessons.js, helpers.js                — the curriculum and its grading helpers
  ui/        app.js, highlight.js, style.css       — the browser interface
scripts/     build.js                              — bundles src/ into pipeline-academy.html
test/        *.test.js                             — unit and curriculum tests
```

- `engine/expr.js` — a small parser/evaluator for the subset of GitHub Actions' `${{ }}` expression syntax
  used in `if:` conditions (`success()`, `failure()`, `contains()`, comparisons, `&&`/`||`, context
  paths like `github.ref_name` or `needs.build.outputs.x`).
- `engine/triggers.js` — evaluates whether a workflow's `on:` block would fire for a simulated event
  (push/pull_request branch & path filters, PR activity types, schedule, workflow_dispatch).
- `engine/scheduler.js` — builds the job dependency graph from `needs:`, expands `strategy.matrix`
  (including `include`/`exclude`/`fail-fast`), and plans a full run's outcome per job.
- `lessons/helpers.js` — small inspection helpers used by each lesson's grading checks.
- `ui/highlight.js` — a lightweight line-based YAML syntax highlighter for the editor.
- `lessons/lessons.js` — the curriculum: 33 lessons across 16 modules, each with intro content, starter/
  solution YAML, hints, and a set of grading checks.
- `ui/app.js` — the UI: editor, sidebar navigation, checklist grading, and the run/animation engine.
- `ui/style.css` — the design system (an industrial "pipeline signage" palette, IBM Plex Sans/Mono).
- `scripts/build.js` — concatenates the modules above into the single published `pipeline-academy.html`.

## Development

```sh
npm install        # installs js-yaml, used by the test suite (the page itself loads it from a CDN)
npm test           # runs the unit tests for the expression evaluator, trigger logic, scheduler,
                    # and verifies every lesson's solution actually satisfies its own checklist
npm run build       # rebuilds pipeline-academy.html from the source modules
```

Edit the source modules in `src/` (not `pipeline-academy.html` directly — it's generated), run `npm test`,
then `npm run build`.

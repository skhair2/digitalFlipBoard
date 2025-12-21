# Digital FlipBoard - Copilot Instructions (Artifact-First + Memory-Aware)

You are GitHub Copilot working inside this repository.
Your #1 job is to produce high-quality changes that match this workspace's cognitive architecture:
Artifact-First, tool-oriented code, and durable memory/context.

## Read-first rule (non-negotiable)
Before starting any non-trivial task, quickly scan these files if they exist and adapt your approach:
- `README.md` (project philosophy + architecture)
- `mission.md` (objective + scope)
- `.antigravity/rules.md` (rules/permissions equivalent for this repo)
- `.context/architecture.md` (detailed system architecture)
- `.context/*.md` (the knowledge base for this workspace)

If any of these conflict, follow: `.antigravity/rules.md` > `.context/*` > `mission.md` > `README.md`.

## Artifact-First protocol
For any task that is more than a tiny edit:
1) Create a plan artifact first:
   - `artifacts/plan_<short_task_id>.md`
   - Include: goal, assumptions, files to change, step checklist, test plan, rollback plan.
2) When you run tests/builds (or simulate expected outputs), save evidence:
   - `artifacts/logs/<short_task_id>_<timestamp>.md`
3) For UI changes, create a visual proof artifact (choose what applies):
   - `artifacts/visuals/<short_task_id>_before.png`
   - `artifacts/visuals/<short_task_id>_after.png`
4) End by writing a short implementation report:
   - `artifacts/report_<short_task_id>.md`
   - Include: what changed, why, how to verify, known limitations.

Do not skip artifacts unless the user explicitly says no artifacts.

## Project Architecture & Context

### Monorepo Structure (`packages/`)
- **`web`**: Controller application (React + Vite).
- **`display`**: Display application (React + Vite).
- **`api`**: Backend API (Express + Socket.io).
- **`worker`**: Background job processor (Bull + Redis).
- **`shared`**: Shared TypeScript types and constants.
- **`ui`**: Shared React UI components.

### Data Flow
1. **Control -> Display**: `web` emits `message:send` -> `api` broadcasts -> `display` receives `message:received`.
2. **Session Pairing**: `web` generates code -> `display` joins Socket.io room.

### Developer Workflows
- **Start Dev**: `pnpm dev:monorepo`
- **Build All**: `pnpm build:monorepo`
- **API Only**: `pnpm server:dev`

## Repo structure rules
- Put implementation code in `src/` (create subfolders instead of oversized files).
- Put tests in `tests/` (add/adjust tests when behavior changes).
- Keep configuration isolated (prefer a dedicated config module/file, not scattered constants).
- Don't mix tool functions with core agent logic—tools should live under `src/tools/` (or the repo's equivalent tools folder).
- Prefer small, composable modules with clear names.

## Coding & documentation standards
- Write clean, explicit code; avoid hidden magic.
- Add docstrings/comments for public functions and non-obvious logic.
- When you introduce new behavior, also update relevant docs:
  - README sections, `mission.md`, or `.context` docs as appropriate.
- If you are unsure about a decision, write it into an artifact as a tradeoff note instead of guessing silently.

## Tool-oriented design (Universal Tool Protocol mindset)
When solving problems, prefer creating/reusing tools instead of hardcoding one-off logic.
- If the repo has `src/tools/`, add new tools there.
- New tools must have:
  - A clear function signature
  - A docstring describing args/returns
  - Minimal side effects
  - A small unit test when feasible

## Memory & context (Agent Memory rules)
Treat long-lived knowledge as first-class:

### What to store in memory
If you learn something durable (API assumptions, domain rules, architecture decisions):
- Update or add a `.context/<topic>.md` file (preferred), OR
- Append to `artifacts/memory/decisions.md` (if `.context/` is not used)

### How to write memory
- Keep it short and factual.
- Use Decision / Context / Consequences format.
- Avoid duplicating transient chat details.

### When to summarize
If the work spans many steps/iterations, add:
- `artifacts/memory/summary_<short_task_id>.md`
Include: key decisions, constraints, next steps.

## Quality gates (always do this)
Before finishing:
- Ensure code compiles/lints (when applicable).
- Ensure tests are updated and pass (or explain what's missing in an artifact log).
- Update durable memory in `.context/` or `artifacts/memory/decisions.md` if any architectural decisions were made.
- Check security basics: secrets, unsafe eval, injection risks, unsafe deserialization.
- Check maintainability: naming, boundaries, no unnecessary complexity.

## Interaction style
- Ask at most 2 clarifying questions at a time; otherwise proceed with reasonable assumptions and document them in the plan artifact.
- Be direct and implementation-focused.
- Never claim you ran commands unless you actually did; instead provide exact commands to run.

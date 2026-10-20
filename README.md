# Donezo

**Intelligent Task Scheduling and Productivity Management System**  
Plan smarter. Get things done.

Donezo is a complete local full-stack application: a responsive React interface, an Express REST service, persistent task/dependency/activity data, and independently tested custom ADS implementations. It ships with an explainable dependency-aware scheduler rather than a simulated recommendation screen.

## Run locally

Requirements: Node.js 20 or newer.

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:4173`. Vite proxies `/api` to the service at `http://127.0.0.1:4000`.

For a production build:

```bash
npm run build
npm start
```

Then open `http://127.0.0.1:4000`.

## Verification

```bash
npm test
npm run typecheck
npm run build
```

Tests cover heap ordering and ties, graph mutations/cycles/topological order, stack, queue reuse, linked-list traversal, scheduler eligibility and ordering, REST CRUD, validation, cycle rejection, persistence effects, schedule invalidation, activity, and undo.

## What is implemented

- Dashboard with live metrics, scheduler focus, deadlines, chart, and dependency alerts.
- Task CRUD, details, completion/reopen validation, search, filters, sorting, tags, categories, deadlines, and estimates.
- Drag-and-drop Kanban with server-authoritative blocked-task handling.
- Interactive React Flow dependency map with pan, zoom, minimap, node inspection, add/remove links, and cycle rejection.
- Custom max-heap scheduler with step-by-step eligible-set, heap snapshot, score, and rationale.
- Persistent activity history and safe session-scoped undo.
- Light/dark themes, device-persisted settings, responsive navigation, keyboard focus, and reduced-motion behavior.
- Seed data on first run only; subsequent state survives refreshes and service restarts in `data/store.json`.

## Architecture and academic documentation

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for rules, modules, complexity, traceability, component view, API surface, assumptions, and limitations.

## Known limitations

- This environment-independent build uses an atomic local JSON repository instead of PostgreSQL/Prisma. The repository boundary is isolated for replacement, but it is not suitable for concurrent multi-process production deployments.
- Authentication and multi-user isolation are intentionally out of scope; the UI identifies local single-user mode.
- Undo is in-memory for the current server session, while its resulting reversal and audit event are persisted.
- Automated browser E2E is not included; integration tests verify the API and business rules, while the responsive UI is designed for manual desktop/mobile inspection.

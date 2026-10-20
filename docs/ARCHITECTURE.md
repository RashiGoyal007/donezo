# Donezo architecture and traceability

## Problem and objectives

Donezo is a single-user productivity system that stores tasks, enforces an acyclic dependency graph, and explains a valid work order. Its stakeholders are students, individual contributors, instructors assessing ADS/SE outcomes, and maintainers.

## Component view

```text
React UI ──fetch──> Express REST API ──> business rules ──> JSON repository
   │                       │                    │
   └── renders trace <──── scheduler <── graph + binary max-heap
                           mutations <── FIFO command queue
                           undo      <── LIFO snapshot stack
                           activity  <── linked-list mirror + persisted events
```

The shared algorithms have no React, HTTP, or persistence dependency. The database boundary is isolated in `server/store.ts`; it can be replaced with a Prisma/PostgreSQL adapter without changing UI or scheduling code.

## Business rules and policies

- An edge `A → B` means B depends on A. Self edges, duplicates, missing tasks, and cycles are rejected server-side.
- Completion is rejected until every direct prerequisite is completed. Reopening immediately changes downstream readiness.
- A generated plan is a simulation; it never mutates task status. Relevant mutations mark it stale.
- Eligible tasks enter a custom max-heap. Score = priority weight + deadline urgency + bounded age. The created timestamp provides deterministic tie-breaking.
- Deleting a task atomically removes every incident dependency.
- Undo is deliberately session-scoped. It restores the last reversible snapshot; the restored state is persisted and an undo event is recorded.

## Complexity

| Structure/operation | Time | Space | Product role |
|---|---:|---:|---|
| Directed graph add vertex/edge | O(1), plus O(V+E) cycle check | O(V+E) | Dependency validity |
| Topological validation | O(V+E) | O(V) | Schedule precondition |
| Binary heap insert/extract | O(log V) | O(V) | Eligible-task ranking |
| Stack push/pop/peek | O(1) | O(n) | Session undo |
| Head-index queue enqueue/dequeue | O(1) | O(n) | Ordered commands / Kahn traversal |
| Linked-list append/traverse | O(1) / O(n) | O(n) | In-memory activity sequence |
| Full scheduler | O((V+E) log V) worst case | O(V+E) | Explainable plan |

## Requirements traceability

| Requirement | Implementation | Verification |
|---|---|---|
| Task CRUD and persistence | `server/app.ts`, `server/store.ts`, Tasks UI | `tests/api.test.ts` |
| Cycle prevention | `DirectedGraph.addEdge`, dependency endpoint | structure + API tests |
| Valid intelligent schedule | `shared/scheduler.ts` | scheduler tests |
| ADS structures | `shared/structures.ts` | `tests/structures.test.ts` |
| Explainability | schedule steps and Scheduler trace panel | scheduler assertions + UI |
| Interactive dependencies | React Flow canvas and dependency API | API cycle tests |
| Themes/reduced motion | design tokens and Settings | manual visual verification |
| Activity/undo | persisted events and session stack | API integration test |

## Non-functional requirements

- Strict TypeScript, centralized validation, consistent JSON errors, keyboard focus styles, reduced-motion support, responsive layouts, centralized palette tokens, and server-authoritative rules.
- No authentication is claimed. The deployment target is a local single-user academic demonstration.
- JSON is the default persistence adapter to keep setup deterministic. PostgreSQL/Prisma is the intended production replacement and remains a documented limitation.

## REST API

`GET/POST /api/tasks`, `GET/PATCH/DELETE /api/tasks/:id`, `POST /api/tasks/:id/complete`, `POST /api/tasks/:id/reopen`, `GET/POST /api/dependencies`, `DELETE /api/dependencies/:id`, `POST /api/schedule/generate`, `GET /api/schedule/current`, `GET /api/activity`, and `POST /api/undo`.

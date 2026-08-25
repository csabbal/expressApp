# Design: Task failure tracking

## Context

Students attempt task instances (e.g. `AdditionInMoreSteps`, `SubtractionInMoreSteps`
documents, grouped under a `TaskType`). There is currently no record kept when a
student fails to solve one. This spec adds a new `[BUSINESS]` resource, `TaskFailure`
(learning DB group, following the `TaskType` pattern), that records: which user
failed, which task, which task type, optionally why (an error message), how many
times, and the first/last time it happened.

This is intentionally minimal — a write path plus basic reads. Analytics ("which
type is hardest for user X") is future work built on top of this data; it is not
part of this spec.

## Goals

- `POST /api/taskFailure` records a failure. Called once per failed attempt; the
  underlying storage upserts so repeat failures of the same task by the same user
  accumulate onto one record instead of creating duplicates.
- `GET /api/taskFailure/all`, `GET /api/taskFailure/list`, `GET /api/taskFailure/:id`
  to read records back (mirroring `TaskType`'s equivalent routes).
- `DELETE /api/taskFailure/:id` to remove a record (mirroring `TaskType`'s delete
  route).

## Out of scope

- Any aggregation/reporting endpoint ("hardest type per user", counts across users,
  etc.) — this spec only stores the raw data those would read.
- Any FK validation of `taskId` or `taskTypeName` against their source collections
  (task instances, `TaskType`). Task kinds vary and new ones get added over time;
  validating would couple this generic tracker to specific task entities. Both are
  stored as opaque, caller-supplied values.
- Tests (no spec file exists for `taskTypeService` either — same explicit
  decision carried over from the TaskType image work).
- Any change to `TaskType`, `AdditionInMoreSteps`, `SubtractionInMoreSteps`, or any
  other existing entity.

## Data model

New Mongoose model, `learning` connection group, collection `taskFailures`.

`src/types/TaskFailure.ts`:

```ts
import { IEntity } from "./repositories"

export interface TaskFailureEntity extends IEntity {
    userId: string,
    taskId: string,
    taskTypeName: string,
    errorMessage: string | null,
    count: number,
    firstFailedAt: Date,
    lastFailedAt: Date
}

export interface listRequestParams {
    filter?: string,
    limit?: number,
    offset?: number,
    sort?: string[]
}
```

One document per `(userId, taskId)` pair:

| field | type | notes |
|---|---|---|
| `id` | string | uuid, like every other entity |
| `userId` | string | taken from the JWT (`req.user.id`), never client-supplied |
| `taskId` | string | opaque id of the task instance attempted (an `AdditionInMoreSteps` id, a `SubtractionInMoreSteps` id, etc.) — no FK validation |
| `taskTypeName` | string | the task's `TaskType` name (e.g. `"additionInMoreSteps"`), duplicated here so filtering/reading doesn't require a join; caller-supplied, not looked up server-side |
| `errorMessage` | string \| null | optional; overwritten on every failure, so it always reflects the most recent one |
| `count` | number | starts at 1, incremented on every failure of the same `(userId, taskId)` pair |
| `firstFailedAt` | Date | set once, on first failure |
| `lastFailedAt` | Date | updated on every failure |

`taskId` alone is the uniqueness key together with `userId` — `taskTypeName` is
duplicated data about that same task, not part of the identity of the record.

## Changes

### `src/entities/TaskFailure.schema.ts`

Standard Mongoose schema, all fields `required: true` except `errorMessage`
(`required: false, default: null`), matching `TaskType.schema.ts`'s style.
`getConnection('learning').model<TaskFailureEntity>('TaskFailure', TaskFailureSchema, 'taskFailures')`.

### `src/repositories/TaskFailure.repository.ts`

```ts
import { TaskFailureEntity } from '../types/TaskFailure'
import { Repository } from './Repository'

export class TaskFailureRepository<T extends TaskFailureEntity = TaskFailureEntity> extends Repository<T> {}
```

No custom methods — the base `Repository`'s `find`/`findOne`/`create`/`updateOne`/
`deleteOne`/`findWithParams` cover everything needed; the upsert logic lives in the
service (see below).

### `src/services/taskFailureService.ts`

Singleton, constructed with `taskFailureRepository`, following `TaskTypeService`'s
shape. Methods:

- `recordFailure(userId, taskId, taskTypeName, errorMessage?)`:
  `findOne({ userId, taskId })` — if found, `updateOne({ userId, taskId }, { count: existing.count + 1, lastFailedAt: now, errorMessage: errorMessage ?? null, taskTypeName })`; if not found, `create({ id: uuidv4(), userId, taskId, taskTypeName, errorMessage: errorMessage ?? null, count: 1, firstFailedAt: now, lastFailedAt: now })`. Two queries, not atomic — same level of race-safety as every other repository in this codebase (none use atomic upserts), so no new mechanism is introduced here.
- `getAll()`, `getList(queryParams)`, `getById(id)`, `delete(id)` — identical in
  shape to their `TaskTypeService` counterparts (`getById`/`delete` throw
  `NotFoundError` when missing).

### `src/controllers/taskFailureController.ts`

- `recordFailure(req, res, next)`: reads `{ taskId, taskTypeName, errorMessage }` from `req.body`, `userId` from `(req as AppRequest).user.id`, calls `taskFailureService.recordFailure(...)`, responds `200` with the resulting record. (200, not 201, since this is an upsert — the same request may be creating or updating depending on whether the pair already exists.)
- `getAll`, `getList`, `getById`, `delete` — identical in shape to `TaskTypeController`'s counterparts.

### `src/routes/taskFailure.ts`

All routes tagged `[Learning]` in Swagger, reusing the existing `learning`
component (no new permission component):

```
POST   /api/taskFailure        learning/write   recordFailure
GET    /api/taskFailure/all    learning/read    getAll
GET    /api/taskFailure/list   learning/read    getList
GET    /api/taskFailure/:id    learning/read    getById
DELETE /api/taskFailure/:id    learning/delete  delete
```

Swagger docs match the style/verbosity already used in `taskType.ts` for the
equivalent routes.

### Extension points

Wire the new model/repository/service/route into the existing extension points,
the same way `TaskType` is wired in:

- `src/repositories/index.ts` — construct `TaskFailureRepository` inside the
  `LEARNING_DB_TYPE === 'mongo'` branch, alongside `TaskType`/`AdditionInMoreSteps`/
  `SubtractionInMoreSteps`.
- `src/types/repositories.ts` — add `ITaskFailureRepository` and a `TaskFailure?`
  entry on `IRepositories`.
- `src/routes/index.ts` — mount the new router (`router.use('/taskFailure', taskFailureRouter)`).

## Permissions

Reuses the existing `learning`/`read`, `learning`/`write`, `learning`/`delete`
privileges already used by every other `taskType` route — no new permission
component.

## Error handling

- `POST` with a missing `taskId` → not explicitly validated by this spec (mirrors
  `TaskType`'s `create`, which also doesn't hand-validate its body — Mongoose's
  `required: true` on the schema surfaces a validation error on save if a required
  field is missing).
- `GET /:id` / `DELETE /:id` on an unknown id → `NotFoundError` (404), same as
  `TaskType`.

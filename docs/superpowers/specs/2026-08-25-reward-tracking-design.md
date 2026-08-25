# Design: Reward tracking

## Context

When a student solves a task, they should win a reward: a picture. The
reward pool is the same images already uploaded via `TaskType`'s image
upload endpoint (`POST /api/taskType/image/:id`, `File` records tagged
`category: 'taskType'` — see
[2026-08-21-tasktype-image-upload-design.md](2026-08-21-tasktype-image-upload-design.md)
as amended). This spec adds a new `[BUSINESS]` resource, `Reward`
(learning DB group, following the `TaskType`/`TaskFailure` pattern), that
records which user won which image, grants a random not-yet-won image on
request, and lets a user read back what they've won and what they could
still win.

## Goals

- `POST /api/reward` grants the calling user a random `File` from the
  `taskType`-category pool that they haven't already won, records the win,
  and returns the record.
- `GET /api/reward/won` returns the image ids the calling user has already
  won.
- `GET /api/reward/available` returns the image ids the calling user could
  still win (the `taskType`-category pool minus already-won).

## Out of scope

- Any admin/teacher view that queries another user's rewards — all three
  endpoints are scoped to the caller's own `userId` from the JWT.
- Update or delete of `Reward` records.
- FK validation of `category` against `TaskType`, or of `imageId` against
  `File` beyond what's needed to compute the pool at grant time — both are
  effectively opaque once stored, consistent with `TaskFailure`'s
  `taskTypeName` precedent.
- Any change to the generic `File` subsystem or to `TaskType`'s image
  upload/`GET /api/file` endpoints.
- Tests (no spec file exists for `taskFailureService` either — same
  explicit decision carried over).

## Data model

New Mongoose model, `learning` connection group, collection `rewards`.

`src/types/Reward.ts`:

```ts
import { IEntity } from "./repositories"

export interface RewardEntity extends IEntity {
    userId: string,
    imageId: string,
    category: string,
    startedAt: Date,
    wonAt: Date
}
```

| field | type | notes |
|---|---|---|
| `id` | string | uuid, like every other entity |
| `userId` | string | taken from the JWT (`req.user.id`), never client-supplied |
| `imageId` | string | id of the `File` granted — chosen server-side at random from the unwon `taskType`-category pool, not client-supplied |
| `category` | string | the task's category, caller-supplied (e.g. `"math"`) — opaque, no FK validation against `TaskType` |
| `startedAt` | Date | when the user started solving the task, caller-supplied |
| `wonAt` | Date | when the reward was granted, set server-side to "now" |

One row per `(userId, imageId)` — enforced at grant time by excluding
already-won images from the random pick (not a unique index; see Error
Handling for the accepted non-atomic race, same class as `TaskFailure`'s).

## Changes

### `src/entities/Reward.schema.ts`

Standard Mongoose schema, all fields `required: true` (nothing is optional
on this entity, unlike `TaskFailure.errorMessage`), matching
`TaskFailure.schema.ts`'s style.
`getConnection('learning').model<RewardEntity>('Reward', RewardSchema, 'rewards')`.

### `src/repositories/Reward.repository.ts`

```ts
import { RewardEntity } from '../types/Reward'
import { Repository } from './Repository'

export class RewardRepository<T extends RewardEntity = RewardEntity> extends Repository<T> {}
```

No custom methods — `find({ userId })` (base `Repository.find`) covers
both "this user's won images" and the dedup check at grant time.

### `src/services/rewardService.ts`

Singleton, constructed with `rewardRepository` and `FileService.getInstance()`
(same injection pattern `TaskTypeService` uses for image uploads). Methods:

- `grantReward(userId, category, startedAt)`:
  1. `fileService.getAllFiles('taskType')` → the full reward pool.
  2. `rewardRepository.find({ userId })` → this user's existing wins, mapped to a `Set` of won `imageId`s.
  3. Filter the pool to files not in that set → the unwon pool.
  4. If the unwon pool is empty, throw `NotFoundError('no reward available', 'no reward available')`.
  5. Pick one file at random from the unwon pool (`Math.floor(Math.random() * unwonPool.length)`).
  6. `rewardRepository.create({ id: uuidv4(), userId, imageId: picked.id, category, startedAt, wonAt: new Date() })`, return the created record.
- `getWonImageIds(userId)`: `rewardRepository.find({ userId })`, map to `imageId`, return `string[]`.
- `getAvailableImageIds(userId)`: same pool/won-set computation as steps 1-3 of `grantReward`, return the unwon pool's ids as `string[]`.

### `src/controllers/rewardController.ts`

- `grantReward(req, res, next)`: reads `{ category, startedAt }` from
  `req.body`, `userId` from `(req as AppRequest).user.id`. Validates
  before calling the service (mirrors `taskFailureController`'s
  validation, added after the `TaskFailure` final review caught the same
  class of bug):
  ```ts
  if (!_.isString(category) || _.isEmpty(category)) throw new BadRequestError('category is required')
  const parsedStartedAt = new Date(startedAt)
  if (_.isNaN(parsedStartedAt.getTime())) throw new BadRequestError('startedAt must be a valid date')
  ```
  Calls `rewardService.grantReward(userId, category, parsedStartedAt)`,
  responds `201` with the created record (a real create, not an upsert —
  unlike `TaskFailure`'s `200`).
- `getWon(req, res, next)`: `userId` from the JWT, calls
  `rewardService.getWonImageIds(userId)`, responds `200` with the
  `string[]`.
- `getAvailable(req, res, next)`: `userId` from the JWT, calls
  `rewardService.getAvailableImageIds(userId)`, responds `200` with the
  `string[]`.

### `src/routes/reward.ts`

All routes tagged `[Learning]` in Swagger, reusing the existing `learning`
component (no new permission component — unlike `TaskFailure`'s read
endpoints, these three are already scoped to the caller's own `userId`, so
there's no cross-user enumeration risk to gate against with a dedicated
privilege):

```
POST /api/reward           learning/write   grantReward
GET  /api/reward/won        learning/read    getWon
GET  /api/reward/available  learning/read    getAvailable
```

Swagger docs match the style/verbosity already used in `taskFailure.ts`
for the equivalent routes.

### Extension points

Wire the new model/repository/service/route into the existing extension
points, the same way `TaskFailure` is wired in:

- `src/repositories/index.ts` — construct `RewardRepository` inside the
  `LEARNING_DB_TYPE === 'mongo'` branch, alongside `TaskFailure`.
- `src/types/repositories.ts` — add `IRewardRepository` and a `Reward?`
  entry on `IRepositories`.
- `src/routes/index.ts` — mount the new router
  (`router.use('/reward', rewardRouter)`), and mention `Reward` in the
  `Learning` tag's description alongside `TaskFailure`.

## Permissions

Reuses the existing `learning`/`write` and `learning`/`read` privileges —
no new permission component or scoped privilege, since all three
endpoints are self-scoped to the caller's own `userId` from the JWT (the
concern that drove `TaskFailure`'s `failure-read` privilege — any reader
enumerating other users' data — doesn't apply here, because there is no
"read any user's rewards" code path to gate in the first place).

## Error handling

- `POST` with a missing/empty `category`, or a `startedAt` that isn't a
  parseable date → `BadRequestError` (400), validated in the controller
  before either value reaches the service.
- `POST` when the unwon pool is empty (the user has already won every
  `taskType`-category image) → `NotFoundError` (404).
- Grant-time uniqueness (no two rows for the same `(userId, imageId)`) is
  enforced by excluding already-won images from the random pick, not by a
  unique index — under concurrent `POST` requests from the same user, this
  is a non-atomic read-then-write, so a race could in principle grant a
  duplicate. This is the same class of accepted, non-atomic race as
  `TaskFailure`'s find-then-branch upsert: no new mechanism is introduced
  to close it, matching this codebase's existing lack of atomic upserts
  elsewhere.

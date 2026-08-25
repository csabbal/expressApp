# Reward Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `Reward` resource (learning DB group) that grants a student a random not-yet-won reward image when they solve a task, and lets them read back what they've won and what they could still win.

**Architecture:** A new entity following the exact layered pattern `TaskFailure` already uses (types → entity/schema → repository → service → controller → routes), wired into the same three extension-point files `TaskFailure` is wired into. The reward pool is the existing `File` records tagged `category: 'taskType'` (already populated by `TaskType`'s image upload endpoint) — no new image storage or catalog entity. `POST /api/reward` grants a random unwon image; `GET /api/reward/won` and `GET /api/reward/available` are both scoped to the caller's own `userId`.

**Tech Stack:** TypeScript, Express, Mongoose, Swagger JSDoc comments — no new libraries.

## Global Constraints

- `category` and `imageId` are opaque values on `Reward` — no FK validation against `TaskType` or `File` beyond what's needed to compute the pool at grant time.
- `userId` always comes from the JWT (`(req as AppRequest).user.id`), never from the request body.
- `POST /api/reward` is a real create (not an upsert like `TaskFailure`) — it responds `201`.
- All three endpoints are scoped to the caller's own `userId` — no admin/query-by-any-user capability, and consequently no new/scoped permission is needed: reuse plain `learning`/`write` and `learning`/`read` (unlike `TaskFailure`'s reads, which needed a dedicated `failure-read` privilege specifically because they exposed *other* users' data).
- No `getAll`/`getList`/`getById`/`delete` endpoints on this resource — only the three routes described above (YAGNI, matches explicit scope).
- No test files are being added for this change (explicit decision — `taskFailureService` has no spec file either).
- Swagger docs on the new routes must match the verbosity/style already used in `src/routes/taskFailure.ts`, tagged `[Learning]`.
- Verify each task with `npm run build` (webpack + ts-loader type-checks the whole project); the final task additionally requires `npm run lint`.

---

### Task 1: Add the `Reward` data model and wire it into the repository layer

**Files:**
- Create: `src/types/Reward.ts`
- Create: `src/entities/Reward.schema.ts`
- Create: `src/repositories/Reward.repository.ts`
- Modify: `src/types/repositories.ts`
- Modify: `src/repositories/index.ts`

**Interfaces:**
- Consumes: `IEntity`, `IRepository` from `src/types/repositories.ts` (already defined); `getConnection` from `src/providers/data` (already used by `src/entities/TaskFailure.schema.ts:3`); `Repository` base class from `src/repositories/Repository.ts` (already used by `src/repositories/TaskFailure.repository.ts`).
- Produces: `RewardEntity` type, `RewardModel` (Mongoose model), `RewardRepository` class, `IRewardRepository` interface, and the exported singleton `rewardRepository` — all consumed by Task 2's service.

- [ ] **Step 1: Create the `RewardEntity` type**

Create `src/types/Reward.ts`:

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

- [ ] **Step 2: Create the Mongoose schema**

Create `src/entities/Reward.schema.ts` (matching `src/entities/TaskFailure.schema.ts`'s style — every field is `required: true` here, there's no optional field like `TaskFailure.errorMessage`):

```ts
import mongoose from 'mongoose'
import { RewardEntity } from '../types/Reward'
import { getConnection } from '../providers/data'

/**
 * Initialization a mongoose schema to store rewards students have won
 */
const RewardSchema = new mongoose.Schema({
  id: {
    required: true,
    type: String
  },
  userId: {
    required: true,
    type: String
  },
  imageId: {
    required: true,
    type: String
  },
  category: {
    required: true,
    type: String
  },
  startedAt: {
    required: true,
    type: Date
  },
  wonAt: {
    required: true,
    type: Date
  }
})

export const RewardModel =
  getConnection('learning').model<RewardEntity>('Reward', RewardSchema, 'rewards')
```

- [ ] **Step 3: Create the repository**

Create `src/repositories/Reward.repository.ts` (matching `src/repositories/TaskFailure.repository.ts`):

```ts
import { RewardEntity } from '../types/Reward'
import { Repository } from './Repository'

export class RewardRepository<T extends RewardEntity = RewardEntity> extends Repository<T> {}
```

- [ ] **Step 4: Add `IRewardRepository` and register it on `IRepositories`**

In `src/types/repositories.ts`:

Add the import after the existing `TaskFailure` import (currently line 8):

```ts
import { TaskFailureEntity } from "./TaskFailure"
import { RewardEntity } from "./Reward"
```

Add the interface after `ITaskFailureRepository` (currently line 52):

```ts
export interface ITaskFailureRepository<T extends TaskFailureEntity=TaskFailureEntity> extends IRepository<T> {}
export interface IRewardRepository<T extends RewardEntity=RewardEntity> extends IRepository<T> {}
```

Update the `[BUSINESS]` comment block above `IRepositories` (currently lines 61-66) to also mention `Reward`, and add the field after `TaskFailure` (currently line 71):

```ts
    // ================================================================
    // [BUSINESS] Add your domain repository types here.
    // When bootstrapping a new app: remove Movie/TaskType/AdditionInMoreSteps/
    // SubtractionInMoreSteps below and add your own. TaskFailure/Reward are
    // real business logic (not example domain code) - keep them.
    // ================================================================
    Movie?: IMovieRepository<MovieEntity> // [EXAMPLE]
    TaskType?: ITaskTypeRepository<TaskTypeEntity> // [EXAMPLE]
    AdditionInMoreSteps?: IAdditionInMoreStepsRepository<AdditionInMoreStepsEntity> // [EXAMPLE]
    SubtractionInMoreSteps?: ISubtractionInMoreStepsRepository<SubtractionInMoreStepsEntity> // [EXAMPLE]
    TaskFailure?: ITaskFailureRepository<TaskFailureEntity>
    Reward?: IRewardRepository<RewardEntity>
}
```

- [ ] **Step 5: Construct and export `rewardRepository`**

In `src/repositories/index.ts`:

Add the model import after the `TaskFailureModel` import (currently line 10):

```ts
import { TaskFailureModel } from "../entities/TaskFailure.schema"
import { RewardModel } from "../entities/Reward.schema"
```

Add the repository-class import after the `TaskFailureRepository` import (currently line 19):

```ts
import { TaskFailureRepository } from "./TaskFailure.repository"
import { RewardRepository } from "./Reward.repository"
```

Update the `[BUSINESS]` comment block above the `MOVIE_DB_TYPE` switch (currently lines 54-60) to also mention `Reward`:

```ts
        // ================================================================
        // [BUSINESS] Register your domain repositories here.
        // When bootstrapping a new app: remove the movie/TaskType/
        // AdditionInMoreSteps/SubtractionInMoreSteps cases below and add your own.
        // TaskFailure/Reward (registered below, alongside the learning DB cases) are
        // real business logic (not example domain code) - keep them.
        // ================================================================
```

In the `LEARNING_DB_TYPE` switch's `mongo` case (currently lines 72-83), add the construction after the `TaskFailure` line:

```ts
        switch (process.env.LEARNING_DB_TYPE) {
            case 'mongo':
                this.repositories.TaskType = new TaskTypeRepository(TaskTypeModel)
                this.repositories.AdditionInMoreSteps =
                    new AdditionInMoreStepsRepository(AdditionInMoreStepsModel)
                this.repositories.SubtractionInMoreSteps =
                    new SubtractionInMoreStepsRepository(SubtractionInMoreStepsModel)
                this.repositories.TaskFailure = new TaskFailureRepository(TaskFailureModel)
                this.repositories.Reward = new RewardRepository(RewardModel)
                break
            default:
                throw new Error('learning database type is unknown')
        }
```

Add the export after the `taskFailureRepository` export (currently the last line, 107):

```ts
export const taskFailureRepository = repositories.TaskFailure
export const rewardRepository = repositories.Reward
```

- [ ] **Step 6: Verify it builds**

Run: `npm run build`
Expected: succeeds with no TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add src/types/Reward.ts src/entities/Reward.schema.ts src/repositories/Reward.repository.ts src/types/repositories.ts src/repositories/index.ts
git commit -m "$(cat <<'EOF'
[learning] - add Reward data model and repository

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Add `RewardService`

**Files:**
- Create: `src/services/rewardService.ts`

**Interfaces:**
- Consumes: `rewardRepository` from `src/repositories` (Task 1); `IRewardRepository` from `src/types/repositories.ts` (Task 1); `RewardEntity` from `src/types/Reward.ts` (Task 1); `FileService.getInstance()` and `fileService.getAllFiles(category?: string): Promise<FileEntity[]>` (already implemented in `src/services/fileService.ts`, same injection pattern `src/services/taskTypeService.ts` uses); `NotFoundError` from `src/utils/error/Error.ts`.
- Produces: singleton `RewardService.getInstance()` with `grantReward(userId: string, category: string, startedAt: Date): Promise<RewardEntity>`, `getWonImageIds(userId: string): Promise<string[]>`, `getAvailableImageIds(userId: string): Promise<string[]>` — all consumed by Task 3's controller.

- [ ] **Step 1: Create the service**

Create `src/services/rewardService.ts`:

```ts
import { FileEntity } from "../types/File"
import { RewardEntity } from "../types/Reward"
import { loggedMethod } from "../utils/logger/logger"
import { rewardRepository } from "../repositories"
import { IRewardRepository } from "../types/repositories"
import { NotFoundError } from "../utils/error/Error"
import { v4 as uuidv4 } from "uuid"
import { FileService } from "./fileService"

export class RewardService {
    protected static _instance: RewardService
    constructor(protected rewardRepository: IRewardRepository, protected fileService: FileService) { }

    /**
     * getInstance function provides that this class work as a singleton
     * @returns
    */
    static getInstance() {
        if (!this._instance) {
            this._instance = new RewardService(rewardRepository, FileService.getInstance())
        }
        return this._instance
    }

    /**
     * grantReward method picks one random 'taskType'-category file the given user hasn't
     * already won, records the win, and returns the created reward record
     * @param {string} userId
     * @param {string} category
     * @param {Date} startedAt
     * @returns {RewardEntity}
    */
    @loggedMethod('[RewardService] grantReward')
    public async grantReward(userId: string, category: string, startedAt: Date): Promise<RewardEntity> {
        const unwonPool = await this.getUnwonPool(userId)
        if (unwonPool.length === 0) throw new NotFoundError('no reward available', 'no reward available')

        const picked = unwonPool[Math.floor(Math.random() * unwonPool.length)]
        const reward = await this.rewardRepository.create({
            id: uuidv4(),
            userId,
            imageId: picked.id,
            category,
            startedAt,
            wonAt: new Date()
        } as RewardEntity)
        return reward
    }

    /**
     * getWonImageIds method returns the ids of every image the given user has already won
     * @param {string} userId
     * @returns {string[]}
    */
    @loggedMethod('[RewardService] getWonImageIds')
    public async getWonImageIds(userId: string): Promise<string[]> {
        const rewards = await this.rewardRepository.find({ userId })
        return rewards.map(reward => reward.imageId)
    }

    /**
     * getAvailableImageIds method returns the ids of every 'taskType'-category image the
     * given user has not won yet
     * @param {string} userId
     * @returns {string[]}
    */
    @loggedMethod('[RewardService] getAvailableImageIds')
    public async getAvailableImageIds(userId: string): Promise<string[]> {
        const unwonPool = await this.getUnwonPool(userId)
        return unwonPool.map(file => file.id)
    }

    /**
     * getUnwonPool method resolves the full 'taskType'-category file pool, then filters out
     * every image the given user has already won. Shared by grantReward and
     * getAvailableImageIds, which both need exactly this computation.
     * @param {string} userId
     * @returns {FileEntity[]}
    */
    private async getUnwonPool(userId: string): Promise<FileEntity[]> {
        const pool = await this.fileService.getAllFiles('taskType')
        const wonImageIds = new Set((await this.rewardRepository.find({ userId })).map(reward => reward.imageId))
        return pool.filter(file => !wonImageIds.has(file.id))
    }
}
```

- [ ] **Step 2: Verify it builds**

Run: `npm run build`
Expected: succeeds with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/services/rewardService.ts
git commit -m "$(cat <<'EOF'
[learning] - add RewardService

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Add `RewardController`

**Files:**
- Create: `src/controllers/rewardController.ts`

**Interfaces:**
- Consumes: `rewardService.grantReward(userId, category, startedAt)`, `.getWonImageIds(userId)`, `.getAvailableImageIds(userId)` (Task 2); `AppRequest` from `src/types/CustomExpress.ts` (already used in `src/controllers/taskFailureController.ts:7,42`); `BadRequestError` from `src/utils/error/Error.ts`.
- Produces: `rewardController.grantReward(req, res, next)`, `.getWon`, `.getAvailable` — bound as route handlers in Task 4.

- [ ] **Step 1: Create the controller**

Create `src/controllers/rewardController.ts` (validation mirrors `src/controllers/taskFailureController.ts:34-42`, added there after `TaskFailure`'s final review caught an unvalidated request-body field silently corrupting a record — same defensive pattern applies here):

```ts
import express from 'express'
import { RewardService } from '../services/rewardService'
import { RewardEntity } from '../types/Reward'
import { loggedMethod } from '../utils/logger/logger'
import _ from 'lodash'
import { BadRequestError } from '../utils/error/Error'
import { AppRequest } from '../types/CustomExpress'

/**
 * This class is about to provides all requests of the reward related endpoints via reward service
 */
export class RewardController {
    protected static _instance: RewardController

    constructor(private rewardService: RewardService) { }

    static getInstance(): RewardController {
        if (!this._instance) {
            this._instance = new RewardController(RewardService.getInstance())
        }
        return this._instance
    }

    /**
     * This controller method is about to call rewardService grantReward function with the
     * request body and the authenticated user's id, granting a random unwon reward image
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[RewardController] grantReward')
    public async grantReward(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const { category, startedAt } = req.body
            if (!_.isString(category) || _.isEmpty(category)) throw new BadRequestError('category is required')
            const parsedStartedAt = new Date(startedAt)
            if (_.isNaN(parsedStartedAt.getTime())) throw new BadRequestError('startedAt must be a valid date')

            const userId = (req as AppRequest).user.id
            const reward: RewardEntity = await this.rewardService.grantReward(userId, category, parsedStartedAt)
            res.status(201).json(reward)
        } catch (e) {
            next(e)
        }
    }

    /**
     * This controller method is about to call rewardService getWonImageIds function with the
     * authenticated user's id
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[RewardController] getWon')
    public async getWon(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const userId = (req as AppRequest).user.id
            const imageIds: string[] = await this.rewardService.getWonImageIds(userId)
            res.json(imageIds)
        } catch (e) {
            next(e)
        }
    }

    /**
     * This controller method is about to call rewardService getAvailableImageIds function with
     * the authenticated user's id
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[RewardController] getAvailable')
    public async getAvailable(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const userId = (req as AppRequest).user.id
            const imageIds: string[] = await this.rewardService.getAvailableImageIds(userId)
            res.json(imageIds)
        } catch (e) {
            next(e)
        }
    }
}
```

- [ ] **Step 2: Verify it builds**

Run: `npm run build`
Expected: succeeds with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/controllers/rewardController.ts
git commit -m "$(cat <<'EOF'
[learning] - add RewardController

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Add `reward` routes, wire into the app, and verify end-to-end

**Files:**
- Create: `src/routes/reward.ts`
- Modify: `src/routes/index.ts`

**Interfaces:**
- Consumes: `rewardController.grantReward`/`getWon`/`getAvailable` (Task 3); `requireJwt`, `jwtStrategyInstance.verifyPrivileges` (already imported/used identically in `src/routes/taskFailure.ts:3-4,11`).
- Produces: `POST /api/reward`, `GET /api/reward/won`, `GET /api/reward/available` — the endpoints the user actually calls.

- [ ] **Step 1: Create the routes file**

Create `src/routes/reward.ts` (mirroring `src/routes/taskFailure.ts`'s style and Swagger verbosity):

```ts
import express from 'express'
import { RewardController } from '../controllers/rewardController'
import { requireJwt } from '../providers/auth/passport'
import { jwtStrategyInstance } from '../providers/auth/jwtStrategy'

// get the current router instance
const router = express.Router()

// get the current reward controller instance
const rewardController = RewardController.getInstance()
const verifyPrivileges = jwtStrategyInstance.verifyPrivileges.bind(jwtStrategyInstance)

/**
 * @swagger
 * /api/reward:
 *   post:
 *     summary: Grant the authenticated user a random unwon reward image for solving a task
 *     description: >
 *       Picks one random File (category 'taskType') the user hasn't already won, records
 *       the win, and returns the created record. Responds 404 if every taskType-category
 *       image has already been won by this user.
 *     tags: [Learning]
 *     security:
 *        - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *                 description: the task's category
 *                 example: math
 *               startedAt:
 *                 type: string
 *                 format: date-time
 *                 description: when the user started solving the task
 *                 example: 2026-08-25T10:00:00.000Z
 *             required:
 *               - category
 *               - startedAt
 *     responses:
 *       201:
 *         description: the granted reward record
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 userId:
 *                   type: string
 *                 imageId:
 *                   type: string
 *                 category:
 *                   type: string
 *                 startedAt:
 *                   type: string
 *                   format: date-time
 *                 wonAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: category or startedAt missing or invalid
 *       404:
 *         description: no reward available - every taskType-category image already won
 */
router.post('/',
    requireJwt,
    verifyPrivileges([{ component: 'learning', privilege: 'write' }]),
    rewardController.grantReward.bind(rewardController)
)

/**
 * @swagger
 * /api/reward/won:
 *   get:
 *     summary: Retrieve the image ids the authenticated user has already won
 *     tags: [Learning]
 *     security:
 *        - BearerAuth: []
 *     responses:
 *       200:
 *         description: a list of won image ids
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 */
router.get('/won',
    requireJwt,
    verifyPrivileges([{ component: 'learning', privilege: 'read' }]),
    rewardController.getWon.bind(rewardController)
)

/**
 * @swagger
 * /api/reward/available:
 *   get:
 *     summary: Retrieve the image ids the authenticated user could still win
 *     tags: [Learning]
 *     security:
 *        - BearerAuth: []
 *     responses:
 *       200:
 *         description: a list of image ids not yet won by this user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 */
router.get('/available',
    requireJwt,
    verifyPrivileges([{ component: 'learning', privilege: 'read' }]),
    rewardController.getAvailable.bind(rewardController)
)

export default router
```

- [ ] **Step 2: Mount the router and update the Learning tag description**

In `src/routes/index.ts`, add the import alongside the other `[BUSINESS]` route imports (currently after line 11):

```ts
import taskFailureRouter from './taskFailure'
import rewardRouter from './reward'
```

Update the `Learning` tag's description (currently lines 57-58) to also mention `Reward`:

```ts
            { name: 'Learning', description: 'TaskType/AdditionInMoreSteps/SubtractionInMoreSteps ' +
                '(example)/TaskFailure/Reward - backed by the learning database' },
```

Update the `[BUSINESS]` comment block above the route mounts (currently lines 91-97) to also mention `reward`:

```ts
// ================================================================
// [BUSINESS] Register your domain routes here.
// When bootstrapping a new app: remove the movie/taskType/additionInMoreSteps/
// subtractionInMoreSteps imports at the top and the lines below, then add
// your own routes following the same pattern. taskFailure/reward are real
// business logic (not example domain code) - keep them.
// ================================================================
```

Add the mount line after the `taskFailureRouter` mount (currently line 102):

```ts
router.use('/movie', movieRouter) // [EXAMPLE]
router.use('/taskType', taskTypeRouter) // [EXAMPLE]
router.use('/additionInMoreSteps', additionInMoreStepsRouter) // [EXAMPLE]
router.use('/subtractionInMoreSteps', subtractionInMoreStepsRouter) // [EXAMPLE]
router.use('/taskFailure', taskFailureRouter)
router.use('/reward', rewardRouter)
```

- [ ] **Step 3: Verify it builds and lints**

Run: `npm run build && npm run lint`
Expected: both succeed with no errors (a pre-existing, unrelated `src/services/movieService.ts` lint error may remain — that's expected and out of scope; no `Reward*` file should produce any error).

- [ ] **Step 4: Manual smoke test**

Start the dev server (`docker compose -f docker-compose-development.yml up`, or run the built app directly per existing local setup), then, using a JWT for a user with `learning:write`/`learning:read` privileges (or `all`):

1. Ensure at least one `taskType`-category image exists in the pool: `POST /api/taskType` with a JSON body (`subject`, `name`, `description`, `rating`) to create a task type, note its `id`, then `POST /api/taskType/image/{id}` as `multipart/form-data` with an `image` file field. Confirm `201` with file metadata (`category: "taskType"`).
2. `POST /api/reward` with `{"category": "math", "startedAt": "2026-08-25T10:00:00.000Z"}`. Confirm `201`, and that the response's `imageId` matches the file id from step 1 (or one of the pool's ids, if more than one `taskType` image already exists in this environment), `category` echoes back `"math"`, `startedAt`/`wonAt` are populated.
3. `GET /api/reward/won` — confirm the array contains the `imageId` from step 2.
4. `GET /api/reward/available` — confirm the array does NOT contain the `imageId` from step 2.
5. `POST /api/reward` again with a valid body — confirm either a `201` with a *different* `imageId` (if the pool had a second unwon image), or a `404` "no reward available" (if the pool only had the one image from step 1). Either outcome is correct; just confirm no duplicate row for the same `imageId` was silently created (re-check `GET /api/reward/won` — it should have at most one entry per distinct `imageId`).
6. `POST /api/reward` with `{"startedAt": "2026-08-25T10:00:00.000Z"}` (missing `category`) — confirm `400`.
7. `POST /api/reward` with `{"category": "math", "startedAt": "not-a-date"}` — confirm `400`.
8. Check Swagger UI at `https://localhost:8000/api/docs` — confirm all three new routes appear under the `Learning` group with the documented request/response shapes.

Expected: all steps succeed as described. Clean up any leftover test data afterward (delete the `TaskType` created in step 1 via `DELETE /api/taskType/{id}` if desired — note this does not delete the underlying `File`/`Reward` records, which have no delete endpoint by design; leaving them in the dev database is acceptable, matching how prior smoke tests in this codebase have been cleaned up).

- [ ] **Step 5: Commit**

```bash
git add src/routes/reward.ts src/routes/index.ts
git commit -m "$(cat <<'EOF'
[learning] - add reward routes

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

# Task Failure Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `TaskFailure` resource (learning DB group) that records when a student fails a task: which user, which task, which task type name, an optional error message, how many times, and the first/last time it happened.

**Architecture:** A new entity following the exact layered pattern `TaskType` already uses (types → entity/schema → repository → service → controller → routes), wired into the same three extension points `TaskType` is wired into. One document per `(userId, taskId)` pair; `POST /api/taskFailure` upserts it (increment `count`, bump `lastFailedAt`, overwrite `errorMessage`/`taskTypeName`) instead of creating a new row per attempt.

**Tech Stack:** TypeScript, Express, Mongoose, Swagger JSDoc comments — no new libraries.

## Global Constraints

- `taskId` and `taskTypeName` are opaque, caller-supplied strings — no FK validation against any task-instance collection or against `TaskType`. Task kinds vary and new ones get added over time; validating would couple this generic tracker to specific task entities.
- `userId` always comes from the JWT (`(req as AppRequest).user.id`), never from the request body.
- `POST /api/taskFailure` is an upsert per `(userId, taskId)` pair, not a pure create — it responds `200`, not `201`.
- Reuses the existing `learning` permission component (`read`/`write`/`delete` privileges) — no new permission component.
- No test files are being added for this change (explicit decision — `taskTypeService` has no spec file either).
- Swagger docs on the new routes must match the verbosity/style already used in `src/routes/taskType.ts`, tagged `[Learning]`.
- Verify each task with `npm run build` (webpack + ts-loader type-checks the whole project) and `npm run lint`.

---

### Task 1: Add the `TaskFailure` data model and wire it into the repository layer

**Files:**
- Create: `src/types/TaskFailure.ts`
- Create: `src/entities/TaskFailure.schema.ts`
- Create: `src/repositories/TaskFailure.repository.ts`
- Modify: `src/types/repositories.ts`
- Modify: `src/repositories/index.ts`

**Interfaces:**
- Consumes: `IEntity`, `IRepository` from `src/types/repositories.ts` (already defined); `getConnection` from `src/providers/data` (already used by `src/entities/TaskType.schema.ts:3`); `Repository` base class from `src/repositories/Repository.ts` (already used by `src/repositories/TaskType.repository.ts`).
- Produces: `TaskFailureEntity` type, `TaskFailureModel` (Mongoose model), `TaskFailureRepository` class, `ITaskFailureRepository` interface, and the exported singleton `taskFailureRepository` — all consumed by Task 2's service.

- [ ] **Step 1: Create the `TaskFailureEntity` type**

Create `src/types/TaskFailure.ts`:

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

- [ ] **Step 2: Create the Mongoose schema**

Create `src/entities/TaskFailure.schema.ts` (matching `src/entities/TaskType.schema.ts`'s style):

```ts
import mongoose from 'mongoose'
import { TaskFailureEntity } from '../types/TaskFailure'
import { getConnection } from '../providers/data'

/**
 * Initialization a mongoose schema to store recorded task failures
 */
const TaskFailureSchema = new mongoose.Schema({
  id: {
    required: true,
    type: String
  },
  userId: {
    required: true,
    type: String
  },
  taskId: {
    required: true,
    type: String
  },
  taskTypeName: {
    required: true,
    type: String
  },
  errorMessage: {
    required: false,
    type: String,
    default: null
  },
  count: {
    required: true,
    type: Number
  },
  firstFailedAt: {
    required: true,
    type: Date
  },
  lastFailedAt: {
    required: true,
    type: Date
  }
})

export const TaskFailureModel =
  getConnection('learning').model<TaskFailureEntity>('TaskFailure', TaskFailureSchema, 'taskFailures')
```

- [ ] **Step 3: Create the repository**

Create `src/repositories/TaskFailure.repository.ts` (matching `src/repositories/TaskType.repository.ts`):

```ts
import { TaskFailureEntity } from '../types/TaskFailure'
import { Repository } from './Repository'

export class TaskFailureRepository<T extends TaskFailureEntity = TaskFailureEntity> extends Repository<T> {}
```

- [ ] **Step 4: Add `ITaskFailureRepository` and register it on `IRepositories`**

In `src/types/repositories.ts`:

Add the import after the existing `SubtractionInMoreSteps` import (currently line 7):

```ts
import { SubtractionInMoreStepsEntity } from "./SubtractionInMoreSteps"
import { TaskFailureEntity } from "./TaskFailure"
```

Add the interface after `ISubtractionInMoreStepsRepository` (currently lines 48-50):

```ts
export interface ISubtractionInMoreStepsRepository<
    T extends SubtractionInMoreStepsEntity=SubtractionInMoreStepsEntity
> extends IRepository<T> {}
export interface ITaskFailureRepository<T extends TaskFailureEntity=TaskFailureEntity> extends IRepository<T> {}
```

Add the field to `IRepositories`, after the `SubtractionInMoreSteps` field (currently line 67):

```ts
    Movie?: IMovieRepository<MovieEntity> // [EXAMPLE]
    TaskType?: ITaskTypeRepository<TaskTypeEntity> // [EXAMPLE]
    AdditionInMoreSteps?: IAdditionInMoreStepsRepository<AdditionInMoreStepsEntity> // [EXAMPLE]
    SubtractionInMoreSteps?: ISubtractionInMoreStepsRepository<SubtractionInMoreStepsEntity> // [EXAMPLE]
    TaskFailure?: ITaskFailureRepository<TaskFailureEntity>
}
```

- [ ] **Step 5: Construct and export `taskFailureRepository`**

In `src/repositories/index.ts`:

Add the model import after the `SubtractionInMoreStepsModel` import (currently line 9):

```ts
import { SubtractionInMoreStepsModel } from "../entities/SubtractionInMoreSteps.schema"
import { TaskFailureModel } from "../entities/TaskFailure.schema"
```

Add the repository-class import after the `SubtractionInMoreStepsRepository` import (currently line 17):

```ts
import { SubtractionInMoreStepsRepository } from "./SubtractionInMoreSteps.repository"
import { TaskFailureRepository } from "./TaskFailure.repository"
```

In the `LEARNING_DB_TYPE` switch's `mongo` case (currently lines 68-75), add the construction after the `SubtractionInMoreSteps` line:

```ts
        switch (process.env.LEARNING_DB_TYPE) {
            case 'mongo':
                this.repositories.TaskType = new TaskTypeRepository(TaskTypeModel)
                this.repositories.AdditionInMoreSteps =
                    new AdditionInMoreStepsRepository(AdditionInMoreStepsModel)
                this.repositories.SubtractionInMoreSteps =
                    new SubtractionInMoreStepsRepository(SubtractionInMoreStepsModel)
                this.repositories.TaskFailure = new TaskFailureRepository(TaskFailureModel)
                break
            default:
                throw new Error('learning database type is unknown')
        }
```

Add the export after the `subtractionInMoreStepsRepository` export (currently the last line, 101):

```ts
export const taskTypeRepository = repositories.TaskType
export const additionInMoreStepsRepository = repositories.AdditionInMoreSteps
export const subtractionInMoreStepsRepository = repositories.SubtractionInMoreSteps
export const taskFailureRepository = repositories.TaskFailure
```

- [ ] **Step 6: Verify it builds**

Run: `npm run build`
Expected: succeeds with no TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add src/types/TaskFailure.ts src/entities/TaskFailure.schema.ts src/repositories/TaskFailure.repository.ts src/types/repositories.ts src/repositories/index.ts
git commit -m "$(cat <<'EOF'
[learning] - add TaskFailure data model and repository

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Add `TaskFailureService`

**Files:**
- Create: `src/services/taskFailureService.ts`

**Interfaces:**
- Consumes: `taskFailureRepository` from `src/repositories` (Task 1); `ITaskFailureRepository` from `src/types/repositories.ts` (Task 1); `TaskFailureEntity`, `listRequestParams` from `src/types/TaskFailure.ts` (Task 1); `NotFoundError`, `BadRequestError` from `src/utils/error/Error.ts` (already exist, used identically in `src/services/taskTypeService.ts`).
- Produces: singleton `TaskFailureService.getInstance()` with `recordFailure(userId: string, taskId: string, taskTypeName: string, errorMessage?: string | null): Promise<TaskFailureEntity>`, `getAll(): Promise<TaskFailureEntity[]>`, `getList(queryParams: listRequestParams): Promise<TaskFailureEntity[]>`, `getById(id: string): Promise<TaskFailureEntity>`, `delete(id: string): Promise<TaskFailureEntity>` — all consumed by Task 3's controller.

- [ ] **Step 1: Create the service**

Create `src/services/taskFailureService.ts` (mirroring `src/services/taskTypeService.ts`'s shape: singleton, `mapRequestParamToFind`, `getAll`/`getList`/`getById`/`delete`; `recordFailure` replaces `create`/`update`):

```ts
import { listRequestParams, TaskFailureEntity } from "../types/TaskFailure"
import { loggedMethod, logger } from "../utils/logger/logger"
import { taskFailureRepository } from "../repositories"
import { FindOptions, ITaskFailureRepository, SortOptions } from "../types/repositories"
import { BadRequestError, NotFoundError } from "../utils/error/Error"
import { v4 as uuidv4 } from "uuid"

export class TaskFailureService {
    protected static _instance: TaskFailureService
    constructor(protected taskFailureRepository: ITaskFailureRepository) { }

    /**
     * getInstance function provides that this class work as a singleton
     * @returns
    */
    static getInstance() {
        if (!this._instance) {
            this._instance = new TaskFailureService(taskFailureRepository)
        }
        return this._instance
    }

    /**
     * recordFailure method upserts a (userId, taskId) failure record: if one already
     * exists it increments count, bumps lastFailedAt, and overwrites taskTypeName/errorMessage;
     * otherwise it creates a new record with count 1 and firstFailedAt = lastFailedAt = now.
     * @param {string} userId
     * @param {string} taskId
     * @param {string} taskTypeName
     * @param {string} errorMessage
     * @returns {TaskFailureEntity}
    */
    @loggedMethod('[TaskFailureService] recordFailure')
    public async recordFailure(
        userId: string,
        taskId: string,
        taskTypeName: string,
        errorMessage: string | null = null
    ): Promise<TaskFailureEntity> {
        const existing = await this.taskFailureRepository.findOne({ userId, taskId })
        const now = new Date()

        if (existing) {
            const updated = await this.taskFailureRepository.updateOne(
                { userId, taskId },
                { count: existing.count + 1, lastFailedAt: now, errorMessage, taskTypeName } as Partial<TaskFailureEntity>
            )
            // updateOne is typed Promise<T|null> (it targets an arbitrary filter), but we just
            // confirmed this (userId, taskId) pair exists via findOne above, so this narrows it.
            if (!updated) throw new NotFoundError(`task failure not found: ${userId}/${taskId}`, 'task failure not found')
            return updated
        }

        const created = await this.taskFailureRepository.create({
            id: uuidv4(),
            userId,
            taskId,
            taskTypeName,
            errorMessage,
            count: 1,
            firstFailedAt: now,
            lastFailedAt: now
        } as TaskFailureEntity)
        return created
    }

    /**
     * getAll method take care of fetching all task failures from the db
     * @returns {TaskFailureEntity[]} returns with all TaskFailureEntity via taskFailureRepository
    */
    @loggedMethod('[TaskFailureService] getAll')
    public async getAll(): Promise<TaskFailureEntity[]> {
        const taskFailures = await this.taskFailureRepository.find()
        return taskFailures
    }

    /**
     * getList method take care of fetching task failures from the db
     * based on the offset, limit and the sort paramaters what client define in params attribute
     * @returns {TaskFailureEntity[]} returns with all TaskFailureEntity based on the options via taskFailureRepository
    */
    @loggedMethod('[TaskFailureService] getList')
    public async getList(queryParams: listRequestParams): Promise<TaskFailureEntity[]> {
        const params = this.mapRequestParamToFind(queryParams)
        const taskFailures = await this.taskFailureRepository.findWithParams(params)
        return taskFailures
    }

    /**
     * getById method take care of fetching one task failure based on the id from the db
     * @returns {TaskFailureEntity} returns with the found TaskFailureEntity via taskFailureRepository
    */
    @loggedMethod('[TaskFailureService] getById')
    public async getById(id: string): Promise<TaskFailureEntity> {
        const taskFailure = await this.taskFailureRepository.findOne({ id })
        if (!taskFailure) throw new NotFoundError(`task failure not found: ${id}`, 'task failure not found')
        return taskFailure
    }

    /**
     * delete method take care of deleting one task failure based on the id from the db
     * @returns {TaskFailureEntity} returns with the deleted TaskFailureEntity via taskFailureRepository
    */
    @loggedMethod('[TaskFailureService] delete')
    public async delete(id: string): Promise<TaskFailureEntity> {
        const taskFailure = await this.taskFailureRepository.deleteOne({ id })
        if (!taskFailure) throw new NotFoundError(`task failure not found: ${id}`, 'task failure not found')
        return taskFailure
    }

    /**
     * mapRequestParamToFind method is to map the request paramaters to the findOptions
     * what is needed by the taskFailureRepository
     * @param {listRequestParams} queryParams
     * @returns {findOptions<ITaskFailureRepository>} returns with the mapped findOptions
    */
    @loggedMethod('[TaskFailureService] mapRequestParamToFind')
    private mapRequestParamToFind(queryParams: listRequestParams): FindOptions<TaskFailureEntity> {
        try {
            const validSortArray = (queryParams.sort ?
                queryParams.sort.map(it => JSON.parse(it)) : []
            ) as SortOptions<TaskFailureEntity>[]
            const params = {
                filter: queryParams.filter,
                limit: queryParams.limit,
                offset: queryParams.offset,
                sort: validSortArray
            } as any as FindOptions<TaskFailureEntity>
            return params
        } catch (e) {
            logger.error('[TaskFailureService] mapRequestParamToFind error: ' + e.message)
            throw new BadRequestError(e.message, 'request params are not proper')
        }
    }
}
```

- [ ] **Step 2: Verify it builds**

Run: `npm run build`
Expected: succeeds with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/services/taskFailureService.ts
git commit -m "$(cat <<'EOF'
[learning] - add TaskFailureService

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Add `TaskFailureController`

**Files:**
- Create: `src/controllers/taskFailureController.ts`

**Interfaces:**
- Consumes: `taskFailureService.recordFailure(userId, taskId, taskTypeName, errorMessage?)`, `.getAll()`, `.getList(params)`, `.getById(id)`, `.delete(id)` (Task 2); `AppRequest` from `src/types/CustomExpress.ts` (already used in `src/controllers/taskTypeController.ts:7,150`); `BadRequestError` from `src/utils/error/Error.ts`.
- Produces: `taskFailureController.recordFailure(req, res, next)`, `.getAll`, `.getList`, `.getById`, `.delete` — bound as route handlers in Task 4.

- [ ] **Step 1: Create the controller**

Create `src/controllers/taskFailureController.ts` (mirroring `src/controllers/taskTypeController.ts`'s shape):

```ts
import express from 'express'
import { TaskFailureService } from '../services/taskFailureService'
import { listRequestParams, TaskFailureEntity } from '../types/TaskFailure'
import { loggedMethod, logger, LoggerClass } from '../utils/logger/logger'
import _ from 'lodash'
import { BadRequestError } from '../utils/error/Error'
import { AppRequest } from '../types/CustomExpress'

/**
 * This class is about to provides all requests of the task failure related endpoints via task failure service
 */
export class TaskFailureController {
    protected static _instance: TaskFailureController

    constructor(private taskFailureService: TaskFailureService) { }

    static getInstance(): TaskFailureController {
        if (!this._instance) {
            this._instance = new TaskFailureController(TaskFailureService.getInstance())
        }
        return this._instance
    }

    /**
     * This controller method is about to call taskFailureService recordFailure function with the
     * request body and the authenticated user's id, upserting a (userId, taskId) failure record
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[TaskFailureController] recordFailure')
    public async recordFailure(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const { taskId, taskTypeName, errorMessage } = req.body
            const userId = (req as AppRequest).user.id
            const taskFailure = await this.taskFailureService.recordFailure(userId, taskId, taskTypeName, errorMessage)
            res.json(taskFailure)
        } catch (e) {
            next(e)
        }
    }

    /**
     * This controller method has only one task is to call taskFailureService getAll function
     * in order for fetching all task failures from the task failure repository
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[TaskFailureController] getAll')
    public async getAll(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const taskFailures: TaskFailureEntity[] = await this.taskFailureService.getAll()
            res.json(taskFailures)
        } catch (e) {
            next(e)
        }
    }

    /**
     * This controller method is about to call taskFailureService getList function with paramaters taken
     * as querystring but before that it perform all of validations what it makes sens on the querystring paramaters
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[TaskFailureController] getList')
    public async getList(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const params = req.query as unknown as listRequestParams
            // if the sort is not an array, then convert it to an array
            if (params.sort && !Array.isArray(params.sort)) {
                params.sort = [params.sort]
            }
            logger.info('[getList] params' + LoggerClass.objectToString(params))
            // checking the querystring paramaters
            if (_.isNaN(params.limit)) throw new BadRequestError('limit is not a number')
            if (_.isNaN(params.offset)) throw new BadRequestError('offset is not a number')
            if (!_.isArray(params.sort)) throw new BadRequestError('sort is not an array')

            // calling the taskFailureService getList function with the querystring paramaters
            const taskFailures: TaskFailureEntity[] = await this.taskFailureService.getList(params)
            res.json(taskFailures)
        } catch (e) {
            next(e)
        }
    }

    /**
     * This controller method is about to call taskFailureService getById function with id param
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[TaskFailureController] getById')
    public async getById(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const { id } = req.params
            const taskFailure: TaskFailureEntity = await this.taskFailureService.getById(id)
            res.json(taskFailure)
        } catch (e) {
            next(e)
        }
    }

    /**
     * This controller method is about to call taskFailureService delete function with id param
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[TaskFailureController] delete')
    public async delete(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const { id } = req.params
            const taskFailure: TaskFailureEntity = await this.taskFailureService.delete(id)
            res.json(taskFailure)
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
git add src/controllers/taskFailureController.ts
git commit -m "$(cat <<'EOF'
[learning] - add TaskFailureController

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Add `taskFailure` routes, wire into the app, and verify end-to-end

**Files:**
- Create: `src/routes/taskFailure.ts`
- Modify: `src/routes/index.ts`

**Interfaces:**
- Consumes: `taskFailureController.recordFailure`/`getAll`/`getList`/`getById`/`delete` (Task 3); `requireJwt`, `jwtStrategyInstance.verifyPrivileges` (already imported/used identically in `src/routes/taskType.ts:3-4,12`).
- Produces: `POST /api/taskFailure`, `GET /api/taskFailure/all`, `GET /api/taskFailure/list`, `GET /api/taskFailure/:id`, `DELETE /api/taskFailure/:id` — the endpoints the user actually calls.

- [ ] **Step 1: Create the routes file**

Create `src/routes/taskFailure.ts` (mirroring `src/routes/taskType.ts`'s style and Swagger verbosity):

```ts
import express from 'express'
import { TaskFailureController } from '../controllers/taskFailureController'
import { requireJwt } from '../providers/auth/passport'
import { jwtStrategyInstance } from '../providers/auth/jwtStrategy'

// get the current router instance
const router = express.Router()

// get the current task failure controller instance
const taskFailureController = TaskFailureController.getInstance()
const verifyPrivileges = jwtStrategyInstance.verifyPrivileges.bind(jwtStrategyInstance)

/**
 * @swagger
 * /api/taskFailure:
 *   post:
 *     summary: Record that the authenticated user failed to solve a task
 *     description: >
 *       Upserts by (userId, taskId): a repeat failure of the same task by the same
 *       user increments count and updates lastFailedAt/errorMessage/taskTypeName on
 *       the existing record instead of creating a new one.
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
 *               taskId:
 *                 type: string
 *                 description: id of the task instance the user failed (e.g. an AdditionInMoreSteps id)
 *                 example: 3f1c9b2a-6f7e-4a1d-9c3e-2b7a5d6e8f10
 *               taskTypeName:
 *                 type: string
 *                 description: name of the TaskType the task belongs to
 *                 example: additionInMoreSteps
 *               errorMessage:
 *                 type: string
 *                 description: optional, what went wrong
 *                 example: expected 42, got 24
 *     responses:
 *       200:
 *         description: the created or updated task failure record
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 userId:
 *                   type: string
 *                 taskId:
 *                   type: string
 *                 taskTypeName:
 *                   type: string
 *                 errorMessage:
 *                   type: string
 *                   nullable: true
 *                 count:
 *                   type: number
 *                 firstFailedAt:
 *                   type: string
 *                   format: date-time
 *                 lastFailedAt:
 *                   type: string
 *                   format: date-time
 */
router.post('/',
    requireJwt,
    verifyPrivileges([{ component: 'learning', privilege: 'write' }]),
    taskFailureController.recordFailure.bind(taskFailureController)
)

/**
 * @swagger
 * /api/taskFailure/all:
 *   get:
 *     summary: Retrieve a list of task failures
 *     tags: [Learning]
 *     security:
 *        - BearerAuth: []
 *     responses:
 *       200:
 *         description: A list of task failures
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   userId:
 *                     type: string
 *                   taskId:
 *                     type: string
 *                   taskTypeName:
 *                     type: string
 *                   errorMessage:
 *                     type: string
 *                     nullable: true
 *                   count:
 *                     type: number
 *                   firstFailedAt:
 *                     type: string
 *                     format: date-time
 *                   lastFailedAt:
 *                     type: string
 *                     format: date-time
 */
router.get('/all',
    requireJwt,
    verifyPrivileges([{ component: 'learning', privilege: 'read' }]),
    taskFailureController.getAll.bind(taskFailureController)
)

/**
 * @swagger
 * /api/taskFailure/list:
 *   get:
 *     summary: Retrieve a list of task failures
 *     tags: [Learning]
 *     security:
 *        - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 50
 *         description: The maximum number of task failures to return
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *           example: additionInMoreSteps
 *         description: filtering the task failure list
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           example: 0
 *         description: The number of task failures to skip before starting to collect the result set
 *       - in: query
 *         name: sort
 *         schema:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *                 example: count
 *                 description: The field by which to sort the task failures (e.g., count, lastFailedAt)
 *               direction:
 *                 type: string
 *                 enum: [asc, desc]
 *                 example: desc
 *                 description: The order in which to sort the task failures (ascending or descending)
 *         description: The sorting options for the task failures, including field and order
 *     responses:
 *       200:
 *         description: A list of task failures
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   userId:
 *                     type: string
 *                   taskId:
 *                     type: string
 *                   taskTypeName:
 *                     type: string
 *                   errorMessage:
 *                     type: string
 *                     nullable: true
 *                   count:
 *                     type: number
 *                   firstFailedAt:
 *                     type: string
 *                     format: date-time
 *                   lastFailedAt:
 *                     type: string
 *                     format: date-time
 */
router.get('/list',
    requireJwt,
    verifyPrivileges([{ component: 'learning', privilege: 'read' }]),
    taskFailureController.getList.bind(taskFailureController)
)

/**
 * @swagger
 * /api/taskFailure/{id}:
 *   get:
 *     summary: Retrieve a concrete task failure record
 *     tags: [Learning]
 *     security:
 *        - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The id of the task failure record to retrieve
 *     responses:
 *       200:
 *         description: a task failure record
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 userId:
 *                   type: string
 *                 taskId:
 *                   type: string
 *                 taskTypeName:
 *                   type: string
 *                 errorMessage:
 *                   type: string
 *                   nullable: true
 *                 count:
 *                   type: number
 *                 firstFailedAt:
 *                   type: string
 *                   format: date-time
 *                 lastFailedAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Task failure not found
 */
router.get('/:id',
    requireJwt,
    verifyPrivileges([{ component: 'learning', privilege: 'read' }]),
    taskFailureController.getById.bind(taskFailureController)
)

/**
 * @swagger
 * /api/taskFailure/{id}:
 *   delete:
 *     summary: Delete a concrete task failure record
 *     tags: [Learning]
 *     security:
 *        - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The id of the task failure record to delete
 *     responses:
 *       200:
 *         description: the deleted task failure record
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 userId:
 *                   type: string
 *                 taskId:
 *                   type: string
 *                 taskTypeName:
 *                   type: string
 *                 errorMessage:
 *                   type: string
 *                   nullable: true
 *                 count:
 *                   type: number
 *                 firstFailedAt:
 *                   type: string
 *                   format: date-time
 *                 lastFailedAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Task failure not found
 */
router.delete('/:id',
    requireJwt,
    verifyPrivileges([{ component: 'learning', privilege: 'delete' }]),
    taskFailureController.delete.bind(taskFailureController)
)

export default router
```

- [ ] **Step 2: Mount the router**

In `src/routes/index.ts`, add the import alongside the other `[BUSINESS]`/`[EXAMPLE]` route imports (currently after line 10):

```ts
import subtractionInMoreStepsRouter from './subtractionInMoreSteps'
import taskFailureRouter from './taskFailure'
```

Add the mount line after the `subtractionInMoreStepsRouter` mount (currently line 99):

```ts
router.use('/movie', movieRouter) // [EXAMPLE]
router.use('/taskType', taskTypeRouter) // [EXAMPLE]
router.use('/additionInMoreSteps', additionInMoreStepsRouter) // [EXAMPLE]
router.use('/subtractionInMoreSteps', subtractionInMoreStepsRouter) // [EXAMPLE]
router.use('/taskFailure', taskFailureRouter)
```

- [ ] **Step 3: Verify it builds and lints**

Run: `npm run build && npm run lint`
Expected: both succeed with no errors.

- [ ] **Step 4: Manual smoke test**

Start the dev server (`docker compose -f docker-compose-development.yml up`, or run the built app directly per existing local setup), then, using a JWT for a user with `learning:write`/`learning:read`/`learning:delete` privileges (or `all`):

1. Record a failure: `POST /api/taskFailure` with `{"taskId": "some-task-id", "taskTypeName": "additionInMoreSteps", "errorMessage": "expected 42, got 24"}`. Confirm the response has `count: 1`, `firstFailedAt` equal to `lastFailedAt`, and the given `errorMessage`.
2. Record the same failure again (same `taskId`, different `errorMessage`): confirm the response now has `count: 2`, `firstFailedAt` unchanged from step 1, `lastFailedAt` updated, and `errorMessage` updated to the new value. Note the record's `id`.
3. `GET /api/taskFailure/all` — confirm the record from steps 1-2 appears exactly once (not twice).
4. `GET /api/taskFailure/{id}` (the id from step 2) — confirm it returns the same record.
5. `GET /api/taskFailure/list?filter=additionInMoreSteps` — confirm the record is included.
6. `DELETE /api/taskFailure/{id}` — confirm it returns the deleted record, then `GET /api/taskFailure/{id}` again — confirm `404`.
7. Check Swagger UI at `https://localhost:8000/api/docs` — confirm all five routes appear under the `Learning` group with the documented request/response shapes.

Expected: all steps succeed as described. Clean up any leftover test data afterward (delete via step 6's route, or directly in Mongo) so it doesn't linger in the dev database.

- [ ] **Step 5: Commit**

```bash
git add src/routes/taskFailure.ts src/routes/index.ts
git commit -m "$(cat <<'EOF'
[learning] - add taskFailure routes

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

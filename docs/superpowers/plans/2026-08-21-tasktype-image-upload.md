# TaskType Image Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give `TaskType` an image field and upload/download endpoints, reusing the existing generic `FileService`/multer file subsystem exactly the way `Movie` already does.

**Architecture:** Mirror `Movie`'s image integration layer-by-layer (schema → service → controller → routes) onto `TaskType`. No changes to the generic file subsystem (`FileService`, `File.schema.ts`, `File.repository.ts`, `singleFileUpload`) — it's already entity-agnostic.

**Tech Stack:** TypeScript, Express, Mongoose, multer (already configured), Swagger JSDoc comments.

## Global Constraints

- Storage category for uploaded files is `'taskType'` (not `'learning'` — that's the Mongo connection group name, categories are independent namespacing; see spec).
- Auth: reuse the existing `learning`/`write` and `learning`/`read` privileges already used by every other `taskType` route. No new permission component.
- No test files are being added for this change (explicit user decision — `taskTypeService` currently has no spec file).
- Swagger docs on new routes must match the verbosity/style already used in `src/routes/movie.ts`'s `/image/:id` routes, tagged `[Learning]`.
- Verify each task with `npm run build` (webpack + ts-loader type-checks the whole project) and `npm run lint`.

---

### Task 1: Add `image` field to TaskType's data model

**Files:**
- Modify: `src/types/TaskType.ts`
- Modify: `src/entities/TaskType.schema.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `TaskTypeEntity.image: string | null` — the field later tasks read/write.

- [ ] **Step 1: Add `image` to `TaskTypeEntity`**

In `src/types/TaskType.ts`, add the field to the interface (matching `MovieEntity.image` in `src/types/Movie.ts:6`):

```ts
export interface TaskTypeEntity extends IEntity{
    subject: string,
    name: string,
    description: string,
    rating: number,
    image: string | null
}
```

- [ ] **Step 2: Add `image` to `TaskTypeSchema`**

In `src/entities/TaskType.schema.ts`, add the field to the Mongoose schema (matching `MovieSchema.image` in `src/entities/Movie.schema.ts:21-25`), inserted after `rating`:

```ts
const TaskTypeSchema = new mongoose.Schema({
  id: {
    required: true,
    type: String
  },
  subject: {
    required: true,
    type: String
  },
  name: {
    required: true,
    type: String
  },
  description: {
    required: true,
    type: String
  },
  rating: {
    required: true,
    type: Number
  },
  image: {
    required: false,
    type: String,
    default: null
  }
})
```

- [ ] **Step 3: Verify it builds**

Run: `npm run build`
Expected: succeeds with no TypeScript errors (no other file references `TaskTypeEntity` fields exhaustively, so this is additive and safe).

- [ ] **Step 4: Commit**

```bash
git add src/types/TaskType.ts src/entities/TaskType.schema.ts
git commit -m "$(cat <<'EOF'
[learning] - add image field to TaskType

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Add `uploadImage`/`streamImage` to `TaskTypeService`

**Files:**
- Modify: `src/services/taskTypeService.ts`

**Interfaces:**
- Consumes: `TaskTypeEntity.image` (Task 1); `FileService.getInstance()`, `fileService.uploadFile(file, {category, uploadedBy}): Promise<FileEntity>`, `fileService.getDownloadTarget(id, quality): Promise<{path, mimeType, originalName}>` (both already implemented in `src/services/fileService.ts`); `NotFoundError` from `src/utils/error/Error.ts` (already imported in this file).
- Produces: `taskTypeService.uploadImage(id: string, file: Express.Multer.File, uploadedBy: string): Promise<TaskTypeEntity | null>` and `taskTypeService.streamImage(id: string, quality: 'low' | 'high'): Promise<{path: string, mimeType: string, originalName: string}>` — both consumed by Task 3's controller methods. (`Promise<TaskTypeEntity | null>` because `ITaskTypeRepository.updateOne` returns `Promise<T|null>` per `src/types/repositories.ts:30` — matches `MovieService.uploadImage`'s actual signature exactly.)

- [ ] **Step 1: Import `FileService` and inject it via the constructor/singleton**

In `src/services/taskTypeService.ts`, add the import and thread `FileService` through the constructor exactly as `MovieService` does (`src/services/movieService.ts:1-22`):

```ts
import { listRequestParams, TaskTypeEntity } from "../types/TaskType"
import { loggedMethod, logger } from "../utils/logger/logger"
import { taskTypeRepository } from "../repositories"
import { FindOptions, ITaskTypeRepository, SortOptions } from "../types/repositories"
import { BadRequestError, NotFoundError } from "../utils/error/Error"
import { v4 as uuidv4 } from "uuid"
import { FileService } from "./fileService"

export class TaskTypeService {
    protected static _instance: TaskTypeService
    constructor(protected taskTypeRepository: ITaskTypeRepository, protected fileService: FileService) { }

    /**
     * getInstance function provides that this class work as a singleton
     * @returns
    */
    static getInstance() {
        if (!this._instance) {
            this._instance = new TaskTypeService(taskTypeRepository, FileService.getInstance())
        }
        return this._instance
    }
```

- [ ] **Step 2: Add `uploadImage` and `streamImage` methods**

Insert these two methods directly after `getInstance()` (mirroring `MovieService.uploadImage`/`streamImage` in `src/services/movieService.ts:24-62`, but throwing `NotFoundError` up front like `TaskTypeService.getById` already does at `src/services/taskTypeService.ts:50-54`, since `taskTypeRepository.updateOne` on a missing id would otherwise return `null` silently):

```ts
    /**
     * uploadImage method stores the given file under the 'taskType' category via fileService,
     * then updates the task type record to reference the resulting file's id
     * @param {string} id
     * @param {Express.Multer.File} file
     * @param {string} uploadedBy
     * @returns {TaskTypeEntity|null}
    */
    public async uploadImage(
        id: string,
        file: Express.Multer.File,
        uploadedBy: string
    ): Promise<TaskTypeEntity | null> {
        logger.info('[TaskTypeService] uploadImage ' + id)
        const existingTaskType = await this.taskTypeRepository.findOne({ id })
        if (!existingTaskType) throw new NotFoundError(`task type not found: ${id}`, 'task type not found')
        const fileEntity = await this.fileService.uploadFile(file, { category: 'taskType', uploadedBy })
        const taskType = await this.taskTypeRepository.updateOne({ id }, { image: fileEntity.id } as Partial<TaskTypeEntity>)
        return taskType
    }

    /**
     * streamImage method resolves the physical file to stream for a task type's image,
     * delegating the quality-based path resolution to fileService
     * @param {string} id
     * @param {'low'|'high'} quality
     * @returns {{path: string, mimeType: string, originalName: string}}
    */
    public async streamImage(
        id: string,
        quality: 'low' | 'high'
    ): Promise<{ path: string, mimeType: string, originalName: string }> {
        const taskType = await this.taskTypeRepository.findOne({ id })
        if (!taskType) throw new NotFoundError(`task type not found: ${id}`, 'task type not found')
        if (!taskType.image) throw new NotFoundError(`task type has no image: ${id}`, 'task type has no image')

        return await this.fileService.getDownloadTarget(taskType.image, quality)
    }
```

- [ ] **Step 3: Verify it builds**

Run: `npm run build`
Expected: succeeds with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/services/taskTypeService.ts
git commit -m "$(cat <<'EOF'
[learning] - add uploadImage/streamImage to TaskTypeService

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Add `uploadImage`/`downloadImage` to `TaskTypeController`

**Files:**
- Modify: `src/controllers/taskTypeController.ts`

**Interfaces:**
- Consumes: `taskTypeService.uploadImage(id, file, uploadedBy): Promise<TaskTypeEntity | null>` and `taskTypeService.streamImage(id, quality): Promise<{path, mimeType, originalName}>` (Task 2); `AppRequest` from `src/types/CustomExpress.ts` (already used in `src/controllers/movieController.ts:8`); `BadRequestError` (already imported in this file).
- Produces: `taskTypeController.uploadImage(req, res, next)` and `taskTypeController.downloadImage(req, res, next)` — bound as route handlers in Task 4.

- [ ] **Step 1: Add the `fs` and `AppRequest` imports**

In `src/controllers/taskTypeController.ts`, add to the top of the file (mirroring `src/controllers/movieController.ts:1-8`):

```ts
import express from 'express'
import fs from 'fs'
import { TaskTypeService } from '../services/taskTypeService'
import { listRequestParams, TaskTypeEntity } from '../types/TaskType'
import { loggedMethod, logger, LoggerClass } from '../utils/logger/logger'
import _ from 'lodash'
import { BadRequestError } from '../utils/error/Error'
import { AppRequest } from '../types/CustomExpress'
```

- [ ] **Step 2: Add `uploadImage` and `downloadImage` methods**

Insert these two methods at the end of the `TaskTypeController` class, right before its closing `}` (mirroring `MovieController.uploadImage`/`downloadImage` in `src/controllers/movieController.ts:150-189`):

```ts
    /**
     * This controller method is about to call taskTypeService uploadImage function with id param and the uploaded file
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[TaskTypeController] uploadImage')
    public async uploadImage(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const { id } = req.params
            if (!req.file) throw new BadRequestError('image file is required')
            const userId = (req as AppRequest).user.id
            const taskType = await this.taskTypeService.uploadImage(id, req.file, userId)
            res.json(taskType)
        } catch (e) {
            next(e)
        }
    }

    /**
     * This controller method streams a task type's image bytes, resolved via taskTypeService
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[TaskTypeController] downloadImage')
    public async downloadImage(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const { id } = req.params
            const quality = req.query.quality === 'low' ? 'low' : 'high'
            const target = await this.taskTypeService.streamImage(id, quality)
            res.type(target.mimeType)
            const stream = fs.createReadStream(target.path)
            stream.on('error', (err) => next(err))
            stream.pipe(res)
        } catch (e) {
            next(e)
        }
    }
```

- [ ] **Step 3: Verify it builds**

Run: `npm run build`
Expected: succeeds with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/controllers/taskTypeController.ts
git commit -m "$(cat <<'EOF'
[learning] - add uploadImage/downloadImage to TaskTypeController

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Add image upload/download routes and Swagger docs

**Files:**
- Modify: `src/routes/taskType.ts`

**Interfaces:**
- Consumes: `taskTypeController.uploadImage`/`downloadImage` (Task 3); `singleFileUpload` from `src/utils/upload/multer.ts` (already used in `src/routes/movie.ts:5,431-436`); `requireJwt`, `verifyPrivileges` (already imported/bound in this file).
- Produces: `POST /api/taskType/image/:id` and `GET /api/taskType/image/:id` — the endpoints the user actually calls.

- [ ] **Step 1: Import `singleFileUpload`**

In `src/routes/taskType.ts`, add the import alongside the existing ones:

```ts
import express from 'express'
import { TaskTypeController } from '../controllers/taskTypeController'
import { requireJwt } from '../providers/auth/passport'
import { jwtStrategyInstance } from '../providers/auth/jwtStrategy'
import { singleFileUpload } from '../utils/upload/multer'
```

- [ ] **Step 2: Add the `image` property to the existing `PUT`/`POST` Swagger request bodies**

In the `PUT /api/taskType/{id}` doc block (around line 187, right after `name`) and the `POST /api/taskType` doc block (around line 246, same position), add an `image` property to the `properties` object, matching how `src/routes/movie.ts:269-272` documents it:

```yaml
 *               image:
 *                 type: string
 *                 description: id of a file uploaded via POST /api/taskType/image/{id}
 *                 example: 3f1c9b2a-6f7e-4a1d-9c3e-2b7a5d6e8f10
```

(Add it once in each of the two doc blocks, right after the `name` property in each.)

- [ ] **Step 3: Add the two new routes with Swagger docs**

Insert this block right after the existing `router.post('/', ...)` route (which ends around line 277) and before the `DELETE /:id` doc block, mirroring `src/routes/movie.ts:400-475`:

```ts
/**
 * @swagger
 * /api/taskType/image/{id}:
 *   post:
 *     summary: Upload (or replace) a task type's image
 *     tags: [Learning]
 *     security:
 *        - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The id of the task type to attach the image to
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: the task type, with image set to the uploaded file's id
 *       400:
 *         description: no image file was provided
 *       404:
 *         description: task type not found
 */
router.post('/image/:id',
    requireJwt,
    verifyPrivileges([{ component: 'learning', privilege: 'write' }]),
    singleFileUpload('image'),
    taskTypeController.uploadImage.bind(taskTypeController)
)

/**
 * @swagger
 * /api/taskType/image/{id}:
 *   get:
 *     summary: Download a task type's image, streamed from disk
 *     tags: [Learning]
 *     security:
 *        - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The id of the task type whose image to retrieve
 *       - in: query
 *         name: quality
 *         schema:
 *           type: string
 *           enum: [low, high]
 *           default: high
 *         description: low returns the degraded copy (falls back to the original if none exists)
 *     responses:
 *       200:
 *         description: the image bytes
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: task type not found, or the task type has no image
 */
router.get('/image/:id',
    requireJwt,
    verifyPrivileges([{ component: 'learning', privilege: 'read' }]),
    taskTypeController.downloadImage.bind(taskTypeController)
)
```

- [ ] **Step 4: Verify it builds and lints**

Run: `npm run build && npm run lint`
Expected: both succeed with no errors.

- [ ] **Step 5: Manual smoke test**

Start the dev server (`docker compose -f docker-compose-development.yml up`, or `npm run start:dev` / `npm run run:dev` per existing local setup), then:

1. Obtain a JWT (via `POST /auth/login` or the Swagger Authorize flow) for a user with `learning:write`/`learning:read` privileges (or `all`).
2. Create a task type: `POST /api/taskType` with a JSON body (`subject`, `name`, `description`, `rating`), note the returned `id`.
3. Upload an image: `POST /api/taskType/image/{id}` as `multipart/form-data` with an `image` file field. Confirm the response JSON has `image` set to a file id (not null).
4. Download it: `GET /api/taskType/image/{id}` — confirm image bytes come back with the correct `Content-Type`.
5. Download the low-quality copy: `GET /api/taskType/image/{id}?quality=low` — confirm it also succeeds.
6. Check Swagger UI at `https://localhost:8000/api/doc` — confirm both new routes appear under the `Learning` group with the documented request/response shapes.

Expected: all steps succeed as described. If step 3 or 4 404s, check `FILE_UPLOAD_DIR` is writable and the `uploads` volume (or local dir) exists.

- [ ] **Step 6: Commit**

```bash
git add src/routes/taskType.ts
git commit -m "$(cat <<'EOF'
[learning] - add TaskType image upload/download routes

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

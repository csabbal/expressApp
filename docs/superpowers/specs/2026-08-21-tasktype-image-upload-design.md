# Design: TaskType image upload

## Context

The generic file upload/download subsystem (`FileService`, `singleFileUpload`
multer middleware — see
[2026-08-20-file-upload-download-design.md](2026-08-20-file-upload-download-design.md))
was wired up for `Movie` as the reference example. `TaskType`
(`src/entities/TaskType.schema.ts`, `src/services/taskTypeService.ts`,
`src/controllers/taskTypeController.ts`, `src/routes/taskType.ts`, tagged
`[Learning]` in Swagger) is `[BUSINESS]` code with no `image` field or upload
path.

This spec wires `TaskType` up to the same generic file subsystem, following
`Movie`'s integration exactly (see that section of the linked spec) with a
different category and permission component.

## Goals

- `TaskType` gains an `image: string | null` field (a file id, resolved via
  the existing generic `GET /api/file/:id/download?quality=low|high`).
- `POST /api/taskType/image/:id` to upload/replace a task type's image, and
  `GET /api/taskType/image/:id` to stream it directly (mirroring the two
  `movie` image routes, rather than forcing clients through the generic
  `/api/file/:id/download` route) — same convenience Movie offers.

## Out of scope

- Any change to the generic file subsystem itself.
- Tests (per explicit decision — `movieService.spec.ts` exists but
  `taskTypeService` currently has no spec file and this change doesn't add
  one).

## Changes

### `src/types/TaskType.ts`

Add `image: string | null` to `TaskTypeEntity`, matching `MovieEntity.image`.

### `src/entities/TaskType.schema.ts`

Add to `TaskTypeSchema`: `image: { required: false, type: String, default:
null }`, matching `MovieSchema.image`.

### `src/services/taskTypeService.ts`

Inject `FileService` into the constructor and `getInstance()` (same as
`MovieService`). Add two methods mirroring `MovieService.uploadImage` /
`streamImage` exactly:

```ts
async uploadImage(id: string, file: Express.Multer.File, uploadedBy: string): Promise<TaskTypeEntity> {
    const existing = await this.taskTypeRepository.findOne({ id })
    if (!existing) throw new NotFoundError(`task type not found: ${id}`, 'task type not found')
    const fileEntity = await this.fileService.uploadFile(file, { category: 'taskType', uploadedBy })
    return await this.taskTypeRepository.updateOne({ id }, { image: fileEntity.id } as Partial<TaskTypeEntity>)
}

async streamImage(id: string, quality: 'low' | 'high'): Promise<{ path: string, mimeType: string, originalName: string }> {
    const taskType = await this.taskTypeRepository.findOne({ id })
    if (!taskType) throw new NotFoundError(`task type not found: ${id}`, 'task type not found')
    if (!taskType.image) throw new NotFoundError(`task type has no image: ${id}`, 'task type has no image')
    return await this.fileService.getDownloadTarget(taskType.image, quality)
}
```

`category: 'taskType'` mirrors Movie's use of the entity name as the storage
category (not the Mongo connection group `'learning'` that
`getConnection('learning')` uses — categories namespace files, not DB
connections, and are independent of it).

### `src/controllers/taskTypeController.ts`

Add `uploadImage` and `downloadImage`, mirroring
`MovieController.uploadImage` / `downloadImage` exactly (same `req.file`
presence check → `BadRequestError`, same `(req as AppRequest).user.id`, same
stream-error-to-`next` handling for download). Needs `fs` and `AppRequest`
imports added.

### `src/routes/taskType.ts`

Add, in the same position relative to other routes as Movie's image routes
(after the existing CRUD routes), both tagged `[Learning]`:

```
POST /api/taskType/image/:id
  requireJwt, verifyPrivileges([{component:'learning', privilege:'write'}]),
  singleFileUpload('image')
  → taskTypeController.uploadImage

GET /api/taskType/image/:id
  requireJwt, verifyPrivileges([{component:'learning', privilege:'read'}])
  → taskTypeController.downloadImage
```

Swagger docs match `movie.ts`'s style for these two routes (multipart/form-data
schema for POST, `quality` query param for GET, 400/404 responses). Also
update the existing `POST`/`PUT /api/taskType` Swagger request bodies to add
the optional `image` property (file id, uploaded via `POST
/api/taskType/image/{id}`), matching how Movie's docs describe it.

## Permissions

Reuses the existing `learning`/`write` and `learning`/`read` privileges
already used by every other `taskType` route — no new permission component,
unlike the generic `file` module's own `file:write`/`file:read`.

## Error handling

Same as Movie: missing file on upload → `BadRequestError` (400); unknown task
type id, or a task type with no image on download → `NotFoundError` (404);
stream errors during download → forwarded to `next` (500 via
`errorHandlerMiddleware`).

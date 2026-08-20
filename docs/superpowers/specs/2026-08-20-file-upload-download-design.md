# Design: generic file upload/download, with movie image as first consumer

## Context

`expressApp` is a reusable template (see `CLAUDE.md`); infrastructure is
pre-wired and business logic (the `Movie*` files) is example code meant to be
swapped out. There is currently no way to upload or download binary files —
`MovieEntity.image` is a free-text URL string with no upload path behind it.

This spec adds a generic, entity-agnostic file storage subsystem
(`[INFRASTRUCTURE]`) following the existing layered pattern (routes →
controllers → services → repositories, as seen in `movie*`), and rewires the
`Movie` example (`[EXAMPLE]`) to use it for image upload, to prove out the
reuse pattern for any future domain module.

Every uploaded file is stored twice on disk: the original bytes, and a
degraded "low quality" copy (only meaningful for images — see below). The
client picks which one to download via a `quality` query param.

## Goals

- A generic `File` module other domain services can call directly in code
  (not over HTTP) to store a file under a caller-chosen category and get back
  file metadata (including an id usable with the generic download endpoint).
- A generic download endpoint that streams either the original or the
  degraded copy of any stored file, regardless of which domain module created
  it.
- `movie` gets a new sub-route to upload its image through this subsystem, as
  a concrete example other future domains (not just movies) can copy.

## Out of scope

- Deleting files (no delete endpoint/method — matches `IRepository`, which
  has no `delete` either).
- Any UI/frontend.
- Virus scanning / content validation beyond mimetype-driven behavior.
- Migrating existing `MovieEntity.image` URL-string data — this is example
  data in a template project, not production data.

## Storage layout

Root: `FILE_UPLOAD_DIR` (env, default `./uploads`), gitignored (with a
`.gitkeep`), mounted as a Docker volume so uploads survive container
restarts.

Per file: `<FILE_UPLOAD_DIR>/<category?>/<fileId>/original.<ext>`, plus
`<FILE_UPLOAD_DIR>/<category?>/<fileId>/low.<ext>` **only when the file is an
image** (`mimetype` starts with `image/`). `category` is an optional
single-segment string supplied by the calling code (never by client request
data — this avoids path traversal via untrusted input) that is *also*
persisted on the `FileEntity` so files can be queried by owning domain later
(`fileRepository.find({ category: 'movie' })`):

- Generic `POST /api/file` (no owning entity) → no `category` →
  `uploads/<fileId>/...`, `category: null` in the DB record.
- Movie image upload → `category: 'movie'` → `uploads/movie/<fileId>/...`.
- Any future domain module (e.g. `user`) picks its own category the same way
  movies does; the file module itself has no knowledge of "movie" or any
  other specific domain — `category` is an opaque string to it.

For non-image files, there is no second copy — `lowQualityPath` stays `null`
and a `quality=low` download request falls back to the original. Producing a
second "ruined" copy of an arbitrary binary (PDF, zip, video, ...) has no
well-defined meaning and would just waste storage.

## Data model

### `src/types/File.ts`

```ts
import { IEntity } from './repositories'

export interface FileEntity extends IEntity {
    originalName: string
    mimeType: string
    size: number
    isImage: boolean
    category: string | null
    originalPath: string
    lowQualityPath: string | null
    uploadedBy: string | null
    createdAt: Date
}
```

### `src/entities/File.schema.ts`

Mongoose schema mirroring `Movie.schema.ts`'s style: `id` (String, required),
`originalName` (String, required), `mimeType` (String, required), `size`
(Number, required), `isImage` (Boolean, required), `category` (String,
default `null`, indexed — it's the intended query field for "all files for
domain X"), `originalPath` (String, required), `lowQualityPath` (String,
default `null`), `uploadedBy` (String, default `null`), `createdAt` (Date,
default `Date.now`).

### `src/repositories/File.repository.ts`

```ts
import { FileEntity } from '../types/File'
import { Repository } from './Repository'

export class FileRepository<T extends FileEntity = FileEntity> extends Repository<T> {}
```

DB metadata access only — identical role to `MovieRepository`. No filesystem
code here; that lives in the service (same division of labor the template
already uses: repository = DB access, service = business logic + any other
I/O the business logic needs).

### `src/types/repositories.ts` / `src/repositories/index.ts`

Add `IFileRepository` and `File?: IFileRepository<FileEntity>` to
`IRepositories`, and register `this.repositories.File = new
FileRepository(FileModel)` in `RepositoryFactory.create()`, following the
existing `[INFRASTRUCTURE]` pattern used for `User`/`Permission`. Export
`fileRepository` from `repositories/index.ts`.

## `src/services/fileService.ts`

```ts
export class FileService {
    static getInstance(): FileService { ... } // singleton, same pattern as MovieService

    async uploadFile(
        file: { buffer: Buffer, originalname: string, mimetype: string, size: number },
        options?: { category?: string, uploadedBy?: string }
    ): Promise<FileEntity>

    async getFileById(id: string): Promise<FileEntity>          // throws NotFoundError
    async getAllFiles(category?: string): Promise<FileEntity[]>
    async getDownloadTarget(id: string, quality: 'low' | 'high'): Promise<{ path: string, mimeType: string, originalName: string }>
}
```

`uploadFile`:
1. Generate `id` via `uuidv4()` (same as `movieService.createMovie`).
2. Derive extension from `originalname` (fallback to a generic `.bin` if
   none).
3. Build the target directory
   `<FILE_UPLOAD_DIR>/<options.category ?? ''>/<id>/` via
   `fs.promises.mkdir(..., { recursive: true })`.
4. Write `original.<ext>` with the original buffer.
5. If `mimetype` starts with `image/`: use `sharp(buffer).resize({ width:
   FILE_LOW_QUALITY_MAX_WIDTH, withoutEnlargement: true
   }).jpeg({ quality: FILE_LOW_QUALITY_JPEG_QUALITY }).toFile(...)` to write
   `low.jpg` (degraded copies are always normalized to JPEG regardless of
   source image format — simplest, and "ruined quality" doesn't need to
   preserve the original codec).
6. `fileRepository.create({ id, originalName, mimeType, size, isImage,
   category: options?.category ?? null, originalPath, lowQualityPath,
   uploadedBy: options?.uploadedBy ?? null, createdAt: new Date() })`.
7. Return the created `FileEntity`.

`getAllFiles(category?)` — `fileRepository.find(category ? { category } :
undefined)`, so `GET /api/file/all?category=movie` filters to one domain's
files while omitting the param still lists everything.

`getDownloadTarget(id, quality)`:
1. `fileRepository.findOne({ id })`; throw `NotFoundError` if missing.
2. `path = quality === 'low' && entity.lowQualityPath ? entity.lowQualityPath : entity.originalPath`.
3. Return `{ path, mimeType: entity.mimeType, originalName: entity.originalName }`.

Env vars (all optional, with defaults — following the "opt-in env defaults"
convention from the auth work):

| Var | Default | Purpose |
|-----|---------|---------|
| `FILE_UPLOAD_DIR` | `./uploads` | Root storage directory |
| `FILE_UPLOAD_MAX_SIZE_MB` | `25` | multer size limit |
| `FILE_LOW_QUALITY_JPEG_QUALITY` | `20` | sharp JPEG quality for the degraded copy |
| `FILE_LOW_QUALITY_MAX_WIDTH` | `320` | sharp resize width for the degraded copy |

## `src/controllers/fileController.ts`

Same shape as `movieController.ts` (singleton via `getInstance()`,
`@loggedMethod`, try/catch → `next(e)`):

- `uploadFile(req, res, next)` — reads `req.file` (set by multer), throws
  `BadRequestError` if absent, calls `fileService.uploadFile(req.file, {
  uploadedBy: (req as AppRequest).user.id })`, responds `201` with the
  `FileEntity`.
- `getAllFiles(req, res, next)` — `res.json(await
  fileService.getAllFiles(req.query.category as string | undefined))`.
- `getFileById(req, res, next)` — `res.json(await
  fileService.getFileById(req.params.id))`.
- `downloadFile(req, res, next)` — reads `quality` from `req.query`
  (`'low'` or default `'high'`), calls `fileService.getDownloadTarget`,
  sets `Content-Type` and `Content-Disposition: attachment;
  filename="<originalName>"`, then `fs.createReadStream(path).pipe(res)`.
  Stream `'error'` events are forwarded to `next` as a `ServerError`.

## `src/routes/file.ts`

```
POST   /api/file             multer.single('file'), requireJwt, verifyPrivileges(file:write)  → uploadFile
GET    /api/file/all         requireJwt, verifyPrivileges(file:read)                            → getAllFiles
GET    /api/file/:id         requireJwt, verifyPrivileges(file:read)                            → getFileById
GET    /api/file/:id/download  requireJwt, verifyPrivileges(file:read)                          → downloadFile
```

Multer configured with `storage: multer.memoryStorage()` and `limits: {
fileSize: FILE_UPLOAD_MAX_SIZE_MB * 1024 * 1024 }` (multer's own limit error
surfaces through Express's error-handling middleware chain into the existing
`errorHandlerMiddleware` as a `ServerError` unless explicitly caught and
rethrown as `BadRequestError` — do the latter for a clean 400 on oversized
uploads). Swagger docs on each route, `multipart/form-data` schema for the
upload route, matching the verbosity of `routes/movie.ts`.

Registered in `src/routes/index.ts` next to `movieRouter`, marked
`[INFRASTRUCTURE]` (unlike `movieRouter`, this is not example code to strip
out during bootstrap).

## `src/utils/error/Error.ts`

Add `NotFoundError`, following the exact pattern of `BadRequestError` /
`ConflictError` (own `publicMessage`, `sendJSONResponse` → status `404`), and
handle it in `errorHandlerMiddleware` alongside the other two `instanceof`
checks.

## Movie integration (`[EXAMPLE]`)

Demonstrates how any future domain module reuses the file subsystem.

### `src/routes/movie.ts`

New route:

```
POST /api/movie/:id/image
  multer.single('image'), requireJwt, verifyPrivileges([{component:'movie', privilege:'write'}])
  → movieController.uploadImage
```

Swagger doc updated on `POST`/`PUT /api/movie` to note `image` is a file id
(set via this new sub-route), not a free-text URL — the `image` property
description/example changes accordingly.

### `src/controllers/movieController.ts`

New method `uploadImage(req, res, next)`: reads `req.params.id` and
`req.file`, throws `BadRequestError` if no file, calls
`movieService.uploadImage(id, req.file, (req as AppRequest).user.id)`,
responds `200` with the updated `MovieEntity`.

### `src/services/movieService.ts`

New method:

```ts
async uploadImage(movieId: string, file: UploadedFile, uploadedBy: string): Promise<MovieEntity | null> {
    const fileEntity = await fileService.uploadFile(file, { category: 'movie', uploadedBy })
    return await this.movieRepository.updateOne({ id: movieId }, { image: fileEntity.id })
}
```

Imports the `fileService` singleton (`FileService.getInstance()`) — plain
in-process composition, no HTTP call between the two services.

### `src/types/Movie.ts`

`image: string` stays the same type, but now holds a file id rather than a
URL. Clients resolve it to bytes via the generic `GET
/api/file/:id/download?quality=low|high` — no movie-specific download
endpoint or code needed.

## Docker / config

- `docker-compose.yml`, `docker-compose-development.yml`: add a volume
  mounting `./uploads` (or a named volume) to the container's
  `FILE_UPLOAD_DIR` path, so uploaded files persist across container
  restarts/rebuilds.
- `.gitignore`: add `/uploads`, with `uploads/.gitkeep` committed so the
  directory exists in a fresh checkout.
- `package.json`: add `multer`, `sharp`, `@types/multer`.
- `.env.sample`: add the four `FILE_*` vars listed above (commented,
  consistent with how `OIDC_*` is documented as optional).

## Permissions

New `file` permission component, `read`/`write` privileges, following the
exact `verifyPrivileges([{component: 'movie', privilege: 'write'}])` pattern
already used for movies. Existing users/roles with the `'all'` component
(see `jwtStrategy.ts`'s `[neededPriv.component, 'all'].includes(it.component)`
check) get access automatically with no extra seeding. Movie's image-upload
route reuses the existing `movie:write` privilege (it's still a movie
operation from the client's perspective) rather than requiring `file:write`
— the file module's own privilege only gates the generic `/api/file/*`
routes.

## Error handling summary

- Missing file on upload → `BadRequestError` (400).
- Unknown file id (metadata or download) → `NotFoundError` (404).
- Oversized upload (multer limit exceeded) → caught and rethrown as
  `BadRequestError` (400).
- Disk/sharp failures during upload, or a stream error during download
  (e.g. file present in DB but missing on disk) → `ServerError` (500).

## Testing

Following the existing repo convention (unit tests with Mocha/Sinon/Chai for
infrastructure-level code; the `movie*` example files themselves currently
have no spec files):

- `src/services/fileService.spec.ts` — stub `fileRepository`, `fs.promises`,
  and `sharp`; cover: image upload writes both copies and creates the
  correct DB record; non-image upload writes only the original and
  `lowQualityPath` is `null`; `getDownloadTarget` falls back to original when
  `lowQualityPath` is `null` or quality isn't `'low'`; `getFileById`/
  `getDownloadTarget` throw `NotFoundError` for an unknown id.
- `src/utils/error/Error.spec.ts` — extend with `NotFoundError` cases
  (status 404, `sendJSONResponse` shape), matching existing
  `BadRequestError`/`ConflictError` tests in that file.
- `src/services/movieService.spec.ts` (new file, since none exists yet) —
  at minimum cover `uploadImage`: stubs `fileService.uploadFile` and
  `movieRepository.updateOne`, asserts the category passed is `'movie'` and
  the movie is updated with the returned file id.

## Explicitly out of scope

- File deletion.
- Client-supplied storage category/namespace (category is always
  developer-controlled code, never request data).
- Any change to `MovieEntity.image` for pre-existing (pre-this-change)
  movies — this is template/example data.
- Any other domain module beyond the `movie` example — the design is meant
  to generalize, but only `movie` is being wired up now.

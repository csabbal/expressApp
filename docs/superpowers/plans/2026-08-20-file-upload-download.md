# File Upload/Download Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a generic, reusable file upload/download subsystem (routes → controller → service → repository, backed by Mongo metadata + filesystem bytes) and wire the `movie` example up to it for image upload, proving the reuse pattern.

**Architecture:** New `File` module (`[INFRASTRUCTURE]`) mirrors the existing `Movie` layering exactly. Every upload is stored on disk as `uploads/<category?>/<fileId>/original.<ext>`, plus `low.jpg` for images only (via `sharp`). `category` is a developer-supplied (never client-supplied) string persisted on the Mongo record and used as the storage folder — movies pass `category: 'movie'`, the generic endpoint passes none. One generic streamed download endpoint (`GET /api/file/:id/download?quality=low|high`) serves every file regardless of who created it. `movieService` composes the new `FileService` in-process (no HTTP) to implement `POST /api/movie/:id/image`, storing the resulting file id in `MovieEntity.image`.

**Tech Stack:** Express, TypeScript, Mongoose, `multer` (multipart parsing, memory storage), `sharp` (image re-encoding), Mocha/Sinon/Chai.

## Global Constraints

- Layered architecture: routes → controllers → services → repositories (per `CLAUDE.md`).
- No semicolons, single quotes, 4-space indent in classes, 2-space indent in mongoose schema object literals — matches existing files. `eslint` enforces `semi: never` and `max-len: 120`.
- `category` is always supplied by calling code, never taken from client request data (path traversal risk).
- No file deletion — matches `IRepository`, which has no `delete` method.
- Non-image files get no degraded copy; `quality=low` falls back to the original.
- Env vars are optional with defaults (`FILE_UPLOAD_DIR=./uploads`, `FILE_UPLOAD_MAX_SIZE_MB=25`, `FILE_LOW_QUALITY_JPEG_QUALITY=20`, `FILE_LOW_QUALITY_MAX_WIDTH=320`).
- Baseline test suite currently has **121 passing, 2 pre-existing failing** (`JWTOidcStrategy` — unrelated to this work, do not try to fix). After each task, passing count should only go up; the 2 failures should remain the same 2.
- Full spec: `docs/superpowers/specs/2026-08-20-file-upload-download-design.md`.

---

### Task 1: Dependencies, storage directory, env/docker scaffolding

**Files:**
- Modify: `package.json`
- Modify: `.env.sample`
- Modify: `.gitignore`
- Create: `uploads/.gitkeep`

**Interfaces:**
- Produces: `multer`, `sharp`, `@types/multer` available to import in later tasks; `FILE_UPLOAD_DIR`/`FILE_UPLOAD_MAX_SIZE_MB`/`FILE_LOW_QUALITY_JPEG_QUALITY`/`FILE_LOW_QUALITY_MAX_WIDTH` documented as optional env vars; `uploads/` directory exists and is gitignored (except `.gitkeep`).

- [ ] **Step 1: Install dependencies**

```bash
npm install --save multer sharp
npm install --save-dev @types/multer
```

- [ ] **Step 2: Add the uploads directory placeholder**

Create `uploads/.gitkeep` (empty file) so the directory exists in a fresh checkout.

- [ ] **Step 3: Gitignore uploaded content but keep the placeholder**

Add to `.gitignore` (append near the end of the file):

```
# Uploaded files (generic file storage feature)
/uploads/*
!/uploads/.gitkeep
```

- [ ] **Step 4: Document the new env vars**

Append to `.env.sample` (after the existing `OIDC_*` comment block):

```
# Optional: file upload/storage tuning — all have sane defaults, uncomment to override
#FILE_UPLOAD_DIR=./uploads
#FILE_UPLOAD_MAX_SIZE_MB=25
#FILE_LOW_QUALITY_JPEG_QUALITY=20
#FILE_LOW_QUALITY_MAX_WIDTH=320
```

- [ ] **Step 5: Verify**

Run: `npm ls multer sharp @types/multer`
Expected: all three listed with resolved versions, no `UNMET DEPENDENCY` errors.

Run: `git status --short`
Expected: `package.json`, `package-lock.json`, `.env.sample`, `.gitignore` modified; `uploads/.gitkeep` untracked (new).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json .env.sample .gitignore uploads/.gitkeep
git commit -m "Add multer/sharp deps and uploads storage scaffolding"
```

---

### Task 2: `NotFoundError`

**Files:**
- Modify: `src/utils/error/Error.ts`
- Test: `src/utils/error/Error.spec.ts`

**Interfaces:**
- Produces: `NotFoundError` class (constructor `(message: string, publicInformation?: string, stack?: string)`, `.sendJSONResponse(res)` → 404), handled in `errorHandlerMiddleware`.

- [ ] **Step 1: Write the failing tests**

Add to `src/utils/error/Error.spec.ts`, after the existing `ConflictError` describe block and its closing `})`:

```ts
import { ConflictError, errorHandlerMiddleware, NotFoundError } from './Error'
```

(replace the existing `import { ConflictError, errorHandlerMiddleware } from './Error'` line with the line above)

```ts
describe('NotFoundError', () => {
    describe('sendJSONResponse', () => {
        it('should respond with 404 and the public message', () => {
            const error = new NotFoundError('file not found: abc-123')
            const json = sinon.stub()
            const res = { status: sinon.stub().returns({ json }) } as any

            error.sendJSONResponse(res)

            expect(res.status.calledWith(404)).to.be.true
            expect(json.args[0][0]).to.deep.include({
                success: false,
                status: 404,
                message: 'file not found: abc-123'
            })
        })

        it('should prefer publicInformation over message when given', () => {
            const error = new NotFoundError('internal detail', 'file not found')
            const json = sinon.stub()
            const res = { status: sinon.stub().returns({ json }) } as any

            error.sendJSONResponse(res)

            expect(json.args[0][0].message).to.equal('file not found')
        })
    })
})
```

Also add this test inside the existing `describe('errorHandlerMiddleware', ...)` block (alongside the `ConflictError` test there):

```ts
    it('should call sendJSONResponse on a NotFoundError instance', async () => {
        const error = new NotFoundError('file not found: abc-123')
        const sendJSONResponseStub = sandbox.stub(error, 'sendJSONResponse')
        const res = {} as any

        await errorHandlerMiddleware(error, {} as any, res, next as any)

        expect(sendJSONResponseStub.calledOnceWith(res)).to.be.true
    })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `TS_NODE_PROJECT=tsconfig.test.json node --loader ts-node/register ./node_modules/.bin/mocha src/utils/error/Error.spec.ts`
Expected: FAIL — `NotFoundError` is not exported from `./Error`.

- [ ] **Step 3: Implement `NotFoundError`**

In `src/utils/error/Error.ts`, insert after the `ConflictError` class (before `ServerError`):

```ts
/**
 * NotFoundError class will be instantiated when the requested resource does not exist
 */
export class NotFoundError extends Error {
    readonly publicMessage: string

    constructor(message: string, publicInformation?: string, stack?: string) {
        super(message)
        this.name = 'NotFoundError'
        this.publicMessage = publicInformation ?? message
        this.stack = stack
    }

    sendJSONResponse(res: express.Response) {
        res.status(404).json({
            success: false,
            status: 404,
            message: this.publicMessage,
            stack: process.env.NODE_ENV === 'development' ? this.stack : {}
        })
    }
}
```

In `errorHandlerMiddleware`, add a branch (after the `ConflictError` branch, before the final `else`):

```ts
    } else if (err instanceof NotFoundError) {
        err.sendJSONResponse(res)
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `TS_NODE_PROJECT=tsconfig.test.json node --loader ts-node/register ./node_modules/.bin/mocha src/utils/error/Error.spec.ts`
Expected: PASS, all tests green.

- [ ] **Step 5: Commit**

```bash
git add src/utils/error/Error.ts src/utils/error/Error.spec.ts
git commit -m "Add NotFoundError for 404 responses"
```

---

### Task 3: File data model (types, schema, repository)

**Files:**
- Create: `src/types/File.ts`
- Create: `src/entities/File.schema.ts`
- Create: `src/repositories/File.repository.ts`
- Modify: `src/types/repositories.ts`
- Modify: `src/repositories/index.ts`

**Interfaces:**
- Consumes: `IEntity` from `src/types/repositories.ts`, `Repository<T>` from `src/repositories/Repository.ts`.
- Produces: `FileEntity` type, `FileModel` (mongoose model), `FileRepository` class, `IFileRepository` interface, `fileRepository` singleton export from `src/repositories/index.ts`.

No unit tests for this task — matches the existing `Movie.schema.ts`/`Movie.repository.ts`/`types/Movie.ts` convention (pure data-shape files, no spec files). Verified via TypeScript compilation instead.

- [ ] **Step 1: Create `src/types/File.ts`**

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

- [ ] **Step 2: Create `src/entities/File.schema.ts`**

```ts
import mongoose from 'mongoose'
import { FileEntity } from '../types/File'

/**
 * Initialization a mongoose schema to store uploaded file metadata
 */
const FileSchema = new mongoose.Schema({
  id: {
    required: true,
    type: String
  },
  originalName: {
    required: true,
    type: String
  },
  mimeType: {
    required: true,
    type: String
  },
  size: {
    required: true,
    type: Number
  },
  isImage: {
    required: true,
    type: Boolean
  },
  category: {
    type: String,
    default: null,
    index: true
  },
  originalPath: {
    required: true,
    type: String
  },
  lowQualityPath: {
    type: String,
    default: null
  },
  uploadedBy: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

export const FileModel = mongoose.model<FileEntity>('File', FileSchema)
```

- [ ] **Step 3: Create `src/repositories/File.repository.ts`**

```ts
import { FileEntity } from '../types/File'
import { Repository } from './Repository'

/**
 * This class is to take care about the handling of uploaded file metadata in the database
 */
export class FileRepository<T extends FileEntity = FileEntity> extends Repository<T> {}
```

- [ ] **Step 4: Register the repository type in `src/types/repositories.ts`**

Add the import at the top:

```ts
import { FileEntity } from "./File"
```

Add after the `IMovieRepository` line:

```ts
export interface IFileRepository<T extends FileEntity=FileEntity> extends IRepository<T> {}
```

Add to the `IRepositories` interface, after the `Movie?` line:

```ts
    File?: IFileRepository<FileEntity>
```

- [ ] **Step 5: Register the repository instance in `src/repositories/index.ts`**

Add imports at the top:

```ts
import { FileModel } from "../entities/File.schema"
import { FileRepository } from "./File.repository"
```

Inside `RepositoryFactory.create()`, after the `this.repositories.Movie = ...` line:

```ts
                this.repositories.File = new FileRepository(FileModel)
```

Add the export at the bottom of the file, after `export const movieRepository = repositories.Movie`:

```ts
export const fileRepository = repositories.File
```

- [ ] **Step 6: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/types/File.ts src/entities/File.schema.ts src/repositories/File.repository.ts src/types/repositories.ts src/repositories/index.ts
git commit -m "Add File data model (types, schema, repository)"
```

---

### Task 4: `singleFileUpload` multer middleware helper

**Files:**
- Create: `src/utils/upload/multer.ts`

**Interfaces:**
- Consumes: `BadRequestError` from `src/utils/error/Error.ts`.
- Produces: `singleFileUpload(fieldName: string): (req, res, next) => void` — Express middleware that parses one multipart file into `req.file`, converting multer errors (e.g. oversized file) into a `BadRequestError` instead of letting them fall through as a generic 500.

No unit tests — this is a thin Express middleware wrapper around a third-party library, exercised end-to-end by the routes that use it (Tasks 5 and 6) and the manual smoke test (Task 8).

- [ ] **Step 1: Create `src/utils/upload/multer.ts`**

```ts
import dotenv from 'dotenv'
import { NextFunction, Request, Response } from 'express'
import multer from 'multer'
import { BadRequestError } from '../error/Error'

dotenv.config()
const { FILE_UPLOAD_MAX_SIZE_MB: maxSizeEnv } = process.env
const maxSizeMb = Number(maxSizeEnv) || 25

const uploadMiddleware = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxSizeMb * 1024 * 1024 }
})

/**
 * Returns an Express middleware that parses a single multipart file field into req.file,
 * converting multer's own errors (e.g. file too large) into a BadRequestError so they flow
 * through the standard errorHandlerMiddleware as a 400 instead of a 500
 * @param {string} fieldName the multipart form field name holding the file
 */
export function singleFileUpload(fieldName: string) {
    return (req: Request, res: Response, next: NextFunction) => {
        uploadMiddleware.single(fieldName)(req, res, (err: any) => {
            if (err) return next(new BadRequestError(err.message, 'file upload failed'))
            next()
        })
    }
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/utils/upload/multer.ts
git commit -m "Add singleFileUpload multer middleware helper"
```

---

### Task 5: `FileService`

**Files:**
- Create: `src/services/fileService.ts`
- Test: `src/services/fileService.spec.ts`

**Interfaces:**
- Consumes: `fileRepository`/`IFileRepository` (Task 3), `FileEntity` (Task 3), `NotFoundError` (Task 2).
- Produces:
  - `class FileService { static getInstance(): FileService }`
  - `uploadFile(file: Express.Multer.File, options?: { category?: string, uploadedBy?: string }): Promise<FileEntity>`
  - `getAllFiles(category?: string): Promise<FileEntity[]>`
  - `getFileById(id: string): Promise<FileEntity>` — throws `NotFoundError` if missing
  - `getDownloadTarget(id: string, quality: 'low' | 'high'): Promise<{ path: string, mimeType: string, originalName: string }>`

- [ ] **Step 1: Write the failing tests**

Create `src/services/fileService.spec.ts`:

```ts
import { expect } from 'chai'
import fs from 'fs'
import os from 'os'
import path from 'path'
import sinon, { SinonSandbox, SinonStub } from 'sinon'
import { FileService } from './fileService'
import { FileRepository } from '../repositories/File.repository'
import { NotFoundError } from '../utils/error/Error'

const ONE_PX_PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    'base64'
)

describe('FileService', () => {
    let sandbox: SinonSandbox
    let fileRepository: { create: SinonStub, find: SinonStub, findOne: SinonStub }
    let fileService: FileService
    let testUploadDir: string
    let originalUploadDirEnv: string | undefined

    beforeEach(() => {
        sandbox = sinon.createSandbox()
        testUploadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'file-service-test-'))
        originalUploadDirEnv = process.env.FILE_UPLOAD_DIR
        process.env.FILE_UPLOAD_DIR = testUploadDir
        fileRepository = {
            create: sandbox.stub().callsFake(async (data) => data),
            find: sandbox.stub().resolves([]),
            findOne: sandbox.stub().resolves(null)
        }
        fileService = new FileService(fileRepository as unknown as FileRepository)
    })

    afterEach(() => {
        sandbox.restore()
        process.env.FILE_UPLOAD_DIR = originalUploadDirEnv
        fs.rmSync(testUploadDir, { recursive: true, force: true })
    })

    describe('uploadFile', () => {
        it('should write the original and a degraded copy for image uploads, and store both paths', async () => {
            const file = {
                buffer: ONE_PX_PNG,
                originalname: 'pixel.png',
                mimetype: 'image/png',
                size: ONE_PX_PNG.length
            } as Express.Multer.File

            const result = await fileService.uploadFile(file)

            expect(result.isImage).to.be.true
            expect(result.category).to.equal(null)
            expect(fs.existsSync(result.originalPath)).to.be.true
            expect(result.lowQualityPath).to.not.equal(null)
            expect(fs.existsSync(result.lowQualityPath as string)).to.be.true
            expect(fileRepository.create.calledOnce).to.be.true
        })

        it('should only write the original file for non-image uploads', async () => {
            const file = {
                buffer: Buffer.from('not an image'),
                originalname: 'notes.txt',
                mimetype: 'text/plain',
                size: 12
            } as Express.Multer.File

            const result = await fileService.uploadFile(file)

            expect(result.isImage).to.be.false
            expect(result.lowQualityPath).to.equal(null)
            expect(fs.existsSync(result.originalPath)).to.be.true
        })

        it('should store the file under the given category on disk and in the record', async () => {
            const file = {
                buffer: ONE_PX_PNG,
                originalname: 'pixel.png',
                mimetype: 'image/png',
                size: ONE_PX_PNG.length
            } as Express.Multer.File

            const result = await fileService.uploadFile(file, { category: 'movie', uploadedBy: 'user-1' })

            expect(result.category).to.equal('movie')
            expect(result.uploadedBy).to.equal('user-1')
            expect(result.originalPath).to.include(path.join(testUploadDir, 'movie'))
        })
    })

    describe('getAllFiles', () => {
        it('should list all files when no category is given', async () => {
            await fileService.getAllFiles()
            expect(fileRepository.find.calledOnceWith(undefined)).to.be.true
        })

        it('should filter by category when given', async () => {
            await fileService.getAllFiles('movie')
            expect(fileRepository.find.calledOnceWith({ category: 'movie' })).to.be.true
        })
    })

    describe('getFileById', () => {
        it('should throw NotFoundError when the file does not exist', async () => {
            fileRepository.findOne.resolves(null)
            try {
                await fileService.getFileById('missing-id')
                expect.fail('expected NotFoundError to be thrown')
            } catch (e) {
                expect(e).to.be.instanceOf(NotFoundError)
            }
        })

        it('should return the file record when found', async () => {
            const stored = { id: 'file-1', originalName: 'a.png' }
            fileRepository.findOne.resolves(stored)
            const result = await fileService.getFileById('file-1')
            expect(result).to.deep.equal(stored)
        })
    })

    describe('getDownloadTarget', () => {
        it('should return the original path when quality is high', async () => {
            fileRepository.findOne.resolves({
                id: 'file-1', mimeType: 'image/png', originalName: 'a.png',
                originalPath: '/uploads/file-1/original.png', lowQualityPath: '/uploads/file-1/low.jpg'
            })
            const target = await fileService.getDownloadTarget('file-1', 'high')
            expect(target.path).to.equal('/uploads/file-1/original.png')
        })

        it('should return the low quality path when quality is low and one exists', async () => {
            fileRepository.findOne.resolves({
                id: 'file-1', mimeType: 'image/png', originalName: 'a.png',
                originalPath: '/uploads/file-1/original.png', lowQualityPath: '/uploads/file-1/low.jpg'
            })
            const target = await fileService.getDownloadTarget('file-1', 'low')
            expect(target.path).to.equal('/uploads/file-1/low.jpg')
        })

        it('should fall back to the original path when quality is low but no degraded copy exists', async () => {
            fileRepository.findOne.resolves({
                id: 'file-1', mimeType: 'application/pdf', originalName: 'a.pdf',
                originalPath: '/uploads/file-1/original.pdf', lowQualityPath: null
            })
            const target = await fileService.getDownloadTarget('file-1', 'low')
            expect(target.path).to.equal('/uploads/file-1/original.pdf')
        })
    })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `TS_NODE_PROJECT=tsconfig.test.json node --loader ts-node/register ./node_modules/.bin/mocha src/services/fileService.spec.ts`
Expected: FAIL — `./fileService` module does not exist.

- [ ] **Step 3: Implement `src/services/fileService.ts`**

```ts
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import { fileRepository } from '../repositories'
import { IFileRepository } from '../types/repositories'
import { FileEntity } from '../types/File'
import { loggedMethod } from '../utils/logger/logger'
import { NotFoundError } from '../utils/error/Error'

export interface UploadFileOptions {
    category?: string
    uploadedBy?: string
}

export class FileService {
    protected static _instance: FileService
    constructor(protected fileRepository: IFileRepository) { }

    /**
     * getInstance function provides that this class work as a singleton
     * @returns
    */
    static getInstance(): FileService {
        if (!this._instance) {
            this._instance = new FileService(fileRepository)
        }
        return this._instance
    }

    /**
     * uploadFile method writes the original bytes to disk, and — for images only —
     * a degraded, resized/re-compressed copy, then persists metadata for both via fileRepository
     * @param {Express.Multer.File} file
     * @param {UploadFileOptions} options
     * @returns {FileEntity}
    */
    @loggedMethod('[FileService] uploadFile')
    public async uploadFile(file: Express.Multer.File, options: UploadFileOptions = {}): Promise<FileEntity> {
        const id = uuidv4()
        const extension = this.extractExtension(file.originalname)
        const targetDir = path.join(this.getUploadDir(), options.category ?? '', id)
        await fs.promises.mkdir(targetDir, { recursive: true })

        const originalPath = path.join(targetDir, `original${extension}`)
        await fs.promises.writeFile(originalPath, file.buffer)

        const isImage = file.mimetype.startsWith('image/')
        let lowQualityPath: string | null = null
        if (isImage) {
            lowQualityPath = path.join(targetDir, 'low.jpg')
            await sharp(file.buffer)
                .resize({ width: this.getLowQualityMaxWidth(), withoutEnlargement: true })
                .jpeg({ quality: this.getLowQualityJpegQuality() })
                .toFile(lowQualityPath)
        }

        const fileEntity = {
            id,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            isImage,
            category: options.category ?? null,
            originalPath,
            lowQualityPath,
            uploadedBy: options.uploadedBy ?? null,
            createdAt: new Date()
        } as FileEntity

        return await this.fileRepository.create(fileEntity)
    }

    /**
     * getAllFiles method lists all stored file records, optionally filtered by category
     * @param {string} category
     * @returns {FileEntity[]}
    */
    @loggedMethod('[FileService] getAllFiles')
    public async getAllFiles(category?: string): Promise<FileEntity[]> {
        return await this.fileRepository.find(category ? ({ category } as Partial<FileEntity>) : undefined)
    }

    /**
     * getFileById method fetches one file record by id, throwing NotFoundError if it doesn't exist
     * @param {string} id
     * @returns {FileEntity}
    */
    @loggedMethod('[FileService] getFileById')
    public async getFileById(id: string): Promise<FileEntity> {
        const file = await this.fileRepository.findOne({ id } as Partial<FileEntity>)
        if (!file) throw new NotFoundError(`file not found: ${id}`, 'file not found')
        return file
    }

    /**
     * getDownloadTarget method resolves which physical path to stream for a download request:
     * the degraded copy when quality is 'low' and one exists, otherwise the original
     * @param {string} id
     * @param {'low'|'high'} quality
     * @returns {{path: string, mimeType: string, originalName: string}}
    */
    @loggedMethod('[FileService] getDownloadTarget')
    public async getDownloadTarget(
        id: string,
        quality: 'low' | 'high'
    ): Promise<{ path: string, mimeType: string, originalName: string }> {
        const file = await this.getFileById(id)
        const targetPath = quality === 'low' && file.lowQualityPath ? file.lowQualityPath : file.originalPath
        return { path: targetPath, mimeType: file.mimeType, originalName: file.originalName }
    }

    private extractExtension(originalName: string): string {
        const ext = path.extname(originalName)
        return ext || '.bin'
    }

    private getUploadDir(): string {
        return process.env.FILE_UPLOAD_DIR || './uploads'
    }

    private getLowQualityJpegQuality(): number {
        return Number(process.env.FILE_LOW_QUALITY_JPEG_QUALITY) || 20
    }

    private getLowQualityMaxWidth(): number {
        return Number(process.env.FILE_LOW_QUALITY_MAX_WIDTH) || 320
    }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `TS_NODE_PROJECT=tsconfig.test.json node --loader ts-node/register ./node_modules/.bin/mocha src/services/fileService.spec.ts`
Expected: PASS, all 10 tests green.

- [ ] **Step 5: Commit**

```bash
git add src/services/fileService.ts src/services/fileService.spec.ts
git commit -m "Add FileService: upload with image degradation, list, get, download resolution"
```

---

### Task 6: `FileController` and `routes/file.ts`

**Files:**
- Create: `src/controllers/fileController.ts`
- Create: `src/routes/file.ts`
- Modify: `src/routes/index.ts`

**Interfaces:**
- Consumes: `FileService` (Task 5), `singleFileUpload` (Task 4), `requireJwt`/`jwtStrategyInstance.verifyPrivileges` (existing, same as `routes/movie.ts`), `AppRequest` (existing `src/types/CustomExpress.ts`).
- Produces: `GET/POST /api/file*` endpoints, wired into the app.

No dedicated unit tests — matches the existing convention that `movieController.ts`/`routes/movie.ts` have no spec files either; this is verified via compilation and the Task 8 manual smoke test.

- [ ] **Step 1: Create `src/controllers/fileController.ts`**

```ts
import express from 'express'
import fs from 'fs'
import { FileService } from '../services/fileService'
import { FileEntity } from '../types/File'
import { AppRequest } from '../types/CustomExpress'
import { loggedMethod } from '../utils/logger/logger'
import { BadRequestError } from '../utils/error/Error'

/**
 * This class is about to provide all requests related to uploaded files via fileService
 */
export class FileController {
    protected static _instance: FileController

    constructor(private fileService: FileService) { }

    static getInstance(): FileController {
        if (!this._instance) {
            this._instance = new FileController(FileService.getInstance())
        }
        return this._instance
    }

    /**
     * uploadFile controller method stores the multipart file taken from multer via fileService
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[FileController] uploadFile')
    public async uploadFile(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            if (!req.file) throw new BadRequestError('file is required')
            const uploadedBy = (req as AppRequest).user?.id
            const file: FileEntity = await this.fileService.uploadFile(req.file, { uploadedBy })
            res.status(201).json(file)
        } catch (e) {
            next(e)
        }
    }

    /**
     * getAllFiles controller method lists file metadata, optionally filtered by ?category=
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[FileController] getAllFiles')
    public async getAllFiles(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const category = req.query.category as string | undefined
            const files: FileEntity[] = await this.fileService.getAllFiles(category)
            res.json(files)
        } catch (e) {
            next(e)
        }
    }

    /**
     * getFileById controller method returns one file's metadata
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[FileController] getFileById')
    public async getFileById(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const { id } = req.params
            const file: FileEntity = await this.fileService.getFileById(id)
            res.json(file)
        } catch (e) {
            next(e)
        }
    }

    /**
     * downloadFile controller method streams either the original or the degraded copy of a file
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[FileController] downloadFile')
    public async downloadFile(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const { id } = req.params
            const quality = req.query.quality === 'low' ? 'low' : 'high'
            const target = await this.fileService.getDownloadTarget(id, quality)
            res.setHeader('Content-Type', target.mimeType)
            res.setHeader('Content-Disposition', `attachment; filename="${target.originalName}"`)
            const stream = fs.createReadStream(target.path)
            stream.on('error', (err) => next(err))
            stream.pipe(res)
        } catch (e) {
            next(e)
        }
    }
}
```

- [ ] **Step 2: Create `src/routes/file.ts`**

```ts
import express from 'express'
import { FileController } from '../controllers/fileController'
import { requireJwt } from '../providers/auth/passport'
import { jwtStrategyInstance } from '../providers/auth/jwtStrategy'
import { singleFileUpload } from '../utils/upload/multer'

// get the current router instance
const router = express.Router()

// get the current file controller instance
const fileController = FileController.getInstance()
const verifyPrivileges = jwtStrategyInstance.verifyPrivileges.bind(jwtStrategyInstance)

/**
 * @swagger
 * /api/file:
 *   post:
 *     summary: Upload a new file
 *     security:
 *        - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: the stored file's metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 originalName:
 *                   type: string
 *                 mimeType:
 *                   type: string
 *                 size:
 *                   type: number
 *                 isImage:
 *                   type: boolean
 *                 category:
 *                   type: string
 *                   nullable: true
 *       400:
 *         description: no file was provided, or the file exceeds the size limit
 */
router.post('/',
    requireJwt,
    verifyPrivileges([{ component: 'file', privilege: 'write' }]),
    singleFileUpload('file'),
    fileController.uploadFile.bind(fileController)
)

/**
 * @swagger
 * /api/file/all:
 *   get:
 *     summary: Retrieve a list of uploaded files
 *     security:
 *        - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: filter the list to files uploaded under this category
 *     responses:
 *       200:
 *         description: a list of file metadata records
 */
router.get('/all',
    requireJwt,
    verifyPrivileges([{ component: 'file', privilege: 'read' }]),
    fileController.getAllFiles.bind(fileController)
)

/**
 * @swagger
 * /api/file/{id}:
 *   get:
 *     summary: Retrieve a file's metadata
 *     security:
 *        - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: the file's metadata
 *       404:
 *         description: file not found
 */
router.get('/:id',
    requireJwt,
    verifyPrivileges([{ component: 'file', privilege: 'read' }]),
    fileController.getFileById.bind(fileController)
)

/**
 * @swagger
 * /api/file/{id}/download:
 *   get:
 *     summary: Download a file's bytes, streamed from disk
 *     security:
 *        - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: quality
 *         schema:
 *           type: string
 *           enum: [low, high]
 *           default: high
 *         description: low returns the degraded copy (falls back to the original if none exists)
 *     responses:
 *       200:
 *         description: the file's bytes
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: file not found
 */
router.get('/:id/download',
    requireJwt,
    verifyPrivileges([{ component: 'file', privilege: 'read' }]),
    fileController.downloadFile.bind(fileController)
)

export default router
```

- [ ] **Step 3: Register the router in `src/routes/index.ts`**

Add the import near the top, after `import movieRouter from './movie'`:

```ts
import fileRouter from './file' // [INFRASTRUCTURE]
```

Add the mount, before the `router.use('/movie', movieRouter)` line, in the `[INFRASTRUCTURE]` block (next to `/user`, `/auth`, `/signup`):

```ts
router.use('/file', fileRouter)
```

- [ ] **Step 4: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/controllers/fileController.ts src/routes/file.ts src/routes/index.ts
git commit -m "Add generic file upload/download routes and controller"
```

---

### Task 7: Movie image upload integration

**Files:**
- Modify: `src/services/movieService.ts`
- Test: `src/services/movieService.spec.ts` (new file)
- Modify: `src/controllers/movieController.ts`
- Modify: `src/routes/movie.ts`

**Interfaces:**
- Consumes: `FileService.uploadFile` (Task 5), `singleFileUpload` (Task 4).
- Produces: `movieService.uploadImage(id: string, file: Express.Multer.File, uploadedBy: string): Promise<MovieEntity | null>`; `POST /api/movie/:id/image`.

- [ ] **Step 1: Write the failing test**

Create `src/services/movieService.spec.ts`:

```ts
import { expect } from 'chai'
import sinon, { SinonSandbox, SinonStub } from 'sinon'
import { MovieService } from './movieService'
import { MovieRepository } from '../repositories/Movie.repository'
import { FileService } from './fileService'

describe('MovieService', () => {
    let sandbox: SinonSandbox
    let movieRepository: { updateOne: SinonStub }
    let fileService: { uploadFile: SinonStub }
    let movieService: MovieService

    beforeEach(() => {
        sandbox = sinon.createSandbox()
        movieRepository = { updateOne: sandbox.stub().resolves({ id: 'movie-1', image: 'file-1' }) }
        fileService = { uploadFile: sandbox.stub().resolves({ id: 'file-1' }) }
        movieService = new MovieService(
            movieRepository as unknown as MovieRepository,
            fileService as unknown as FileService
        )
    })

    afterEach(() => {
        sandbox.restore()
    })

    describe('uploadImage', () => {
        it('should upload the file under the movie category and store its id on the movie', async () => {
            const file = { originalname: 'poster.png' } as Express.Multer.File

            const result = await movieService.uploadImage('movie-1', file, 'user-1')

            expect(fileService.uploadFile.calledOnceWith(file, { category: 'movie', uploadedBy: 'user-1' }))
                .to.be.true
            expect(movieRepository.updateOne.calledOnceWith({ id: 'movie-1' }, { image: 'file-1' })).to.be.true
            expect(result).to.deep.equal({ id: 'movie-1', image: 'file-1' })
        })
    })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `TS_NODE_PROJECT=tsconfig.test.json node --loader ts-node/register ./node_modules/.bin/mocha src/services/movieService.spec.ts`
Expected: FAIL — `MovieService` constructor does not accept a second `fileService` argument yet (type error) or `uploadImage` is not a function.

- [ ] **Step 3: Update `src/services/movieService.ts`**

Add the import, after `import { v4 as uuidv4 } from "uuid"`:

```ts
import { FileService } from "./fileService"
```

Replace:

```ts
export class MovieService {
    protected static _instance: MovieService
    constructor(protected movieRepository: IMovieRepository) { }

    /**
     * getInstance function provides that this class work as a singleton
     * @returns 
    */
    static getInstance() {
        if (!this._instance) {
            this._instance = new MovieService(movieRepository)
        }
        return this._instance
    }
```

with:

```ts
export class MovieService {
    protected static _instance: MovieService
    constructor(protected movieRepository: IMovieRepository, protected fileService: FileService) { }

    /**
     * getInstance function provides that this class work as a singleton
     * @returns 
    */
    static getInstance() {
        if (!this._instance) {
            this._instance = new MovieService(movieRepository, FileService.getInstance())
        }
        return this._instance
    }

    /**
     * uploadImage method stores the given file under the 'movie' category via fileService,
     * then updates the movie record to reference the resulting file's id
     * @param {string} id
     * @param {Express.Multer.File} file
     * @param {string} uploadedBy
     * @returns {MovieEntity|null}
    */
    @loggedMethod('[MovieService] uploadImage')
    public async uploadImage(
        id: string,
        file: Express.Multer.File,
        uploadedBy: string
    ): Promise<MovieEntity | null> {
        const fileEntity = await this.fileService.uploadFile(file, { category: 'movie', uploadedBy })
        const movie = await this.movieRepository.updateOne({ id }, { image: fileEntity.id } as Partial<MovieEntity>)
        return movie
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `TS_NODE_PROJECT=tsconfig.test.json node --loader ts-node/register ./node_modules/.bin/mocha src/services/movieService.spec.ts`
Expected: PASS.

- [ ] **Step 5: Add `uploadImage` to `src/controllers/movieController.ts`**

Add the import, after `import { BadRequestError } from '../utils/error/Error'`:

```ts
import { AppRequest } from '../types/CustomExpress'
```

Add the method, after `createMovie` (before the closing `}` of the class):

```ts

    /**
     * This controller method is about to call movieService uploadImage function with id param and the uploaded file
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[MovieController] uploadImage')
    public async uploadImage(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const { id } = req.params
            if (!req.file) throw new BadRequestError('image file is required')
            const userId = (req as AppRequest).user.id
            const movie = await this.movieService.uploadImage(id, req.file, userId)
            res.json(movie)
        } catch (e) {
            next(e)
        }
    }
```

- [ ] **Step 6: Add the route in `src/routes/movie.ts`**

Add the import, after `import { jwtStrategyInstance } from '../providers/auth/jwtStrategy'`:

```ts
import { singleFileUpload } from '../utils/upload/multer'
```

Add the route, after the `router.post('/', ...)` block for `createMovie` and before `export default router`:

```ts

/**
 * @swagger
 * /api/movie/{id}/image:
 *   post:
 *     summary: Upload (or replace) a movie's image
 *     security:
 *        - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The id of the movie to attach the image to
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
 *         description: the movie, with image set to the uploaded file's id
 *       400:
 *         description: no image file was provided
 */
router.post('/:id/image',
    requireJwt,
    verifyPrivileges([{ component: 'movie', privilege: 'write' }]),
    singleFileUpload('image'),
    movieController.uploadImage.bind(movieController)
)
```

- [ ] **Step 7: Update the `image` field swagger docs to reflect it's now a file id**

In `src/routes/movie.ts`, both occurrences (in the `PUT /api/movie/{id}` and `POST /api/movie` request bodies) of:

```
 *               image:
 *                 type: string
 *                 example: https://example.com/inception.jpg
```

replace with:

```
 *               image:
 *                 type: string
 *                 description: id of a file uploaded via POST /api/movie/{id}/image
 *                 example: 3f1c9b2a-6f7e-4a1d-9c3e-2b7a5d6e8f10
```

- [ ] **Step 8: Verify it compiles and all tests still pass**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `TS_NODE_PROJECT=tsconfig.test.json node --loader ts-node/register ./node_modules/.bin/mocha src/**/*.spec.ts`
Expected: 136 passing, 2 failing (the same 2 pre-existing `JWTOidcStrategy` failures — no regressions).

- [ ] **Step 9: Commit**

```bash
git add src/services/movieService.ts src/services/movieService.spec.ts src/controllers/movieController.ts src/routes/movie.ts
git commit -m "Wire movie image upload through the generic FileService"
```

---

### Task 8: Docker volume for uploads (production)

**Files:**
- Modify: `docker-compose.yml`

**Interfaces:**
- None (infra-only; `docker-compose-development.yml` already bind-mounts the whole repo via `./:/usr/src/app`, which covers `uploads/` — no change needed there).

- [ ] **Step 1: Add a named volume to the `express` service**

In `docker-compose.yml`, change:

```yaml
  express:
    networks:
      - app_network
    build:
      dockerfile: Dockerfile
      target: production
    ports:
      - "8000:8000"
networks:
  app_network:
    driver: bridge
```

to:

```yaml
  express:
    networks:
      - app_network
    build:
      dockerfile: Dockerfile
      target: production
    ports:
      - "8000:8000"
    volumes:
      - uploads_data:/usr/src/app/uploads
networks:
  app_network:
    driver: bridge
volumes:
  uploads_data:
```

- [ ] **Step 2: Verify the compose file is valid**

Run: `docker compose -f docker-compose.yml config`
Expected: exits 0, and the printed merged config includes `uploads_data:/usr/src/app/uploads` under the `express` service and `uploads_data:` under the top-level `volumes:` key.

- [ ] **Step 3: Commit**

```bash
git add docker-compose.yml
git commit -m "Persist uploaded files across production container restarts"
```

---

### Task 9: Full verification and manual smoke test

**Files:** none (verification only)

- [ ] **Step 1: Run lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 2: Run the full test suite**

Run: `npm test`
Expected: 136 passing, 2 failing (the same pre-existing `JWTOidcStrategy` failures noted in Global Constraints).

- [ ] **Step 3: Bring up the dev stack**

```bash
docker compose -f docker-compose-development.yml up -d --build
```

Wait for it to be ready:

```bash
until curl -sk -o /dev/null -w '%{http_code}' https://localhost:8000/api/doc | grep -q 200; do sleep 2; done
```

- [ ] **Step 4: Authenticate**

```bash
TOKEN=$(curl -sk -X POST https://localhost:8000/api/auth/local \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin"}' | jq -r .token)
echo "$TOKEN"
```

If this returns `null` (no seeded `admin`/`admin` user), find a valid seeded user instead:

```bash
docker compose -f docker-compose-development.yml exec mongo mongosh \
  "mongodb://root:password@localhost:27017/test?authSource=admin" \
  --quiet --eval 'db.users.find({}, {name:1,email:1}).toArray()'
```

and either use one of those usernames (if you know its password), or create a fresh user and grant it access directly:

```bash
curl -sk -X POST https://localhost:8000/api/signup/local \
  -H 'Content-Type: application/json' \
  -d '{"username":"smoketest","email":"smoketest@example.com","password":"smoketestpw"}'

USER_ID=$(docker compose -f docker-compose-development.yml exec mongo mongosh \
  "mongodb://root:password@localhost:27017/test?authSource=admin" \
  --quiet --eval 'print(db.users.findOne({name:"smoketest"}).id)')

docker compose -f docker-compose-development.yml exec mongo mongosh \
  "mongodb://root:password@localhost:27017/test?authSource=admin" \
  --quiet --eval "db.userpermissions.insertOne({id: '$USER_ID', userId: '$USER_ID', permissions: [{id: '1', component: 'all', privilege: 'read'}, {id: '2', component: 'all', privilege: 'write'}]})"

TOKEN=$(curl -sk -X POST https://localhost:8000/api/auth/local \
  -H 'Content-Type: application/json' \
  -d '{"username":"smoketest","password":"smoketestpw"}' | jq -r .token)
```

- [ ] **Step 5: Create a test image and upload it via the generic endpoint**

```bash
echo iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII= \
  | base64 -d > /tmp/pixel.png

FILE_ID=$(curl -sk -X POST https://localhost:8000/api/file \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/pixel.png;type=image/png" | jq -r .id)
echo "$FILE_ID"
```

Expected: a UUID is printed (not `null`).

- [ ] **Step 6: Download both qualities and confirm they differ**

```bash
curl -sk -o /tmp/high.png "https://localhost:8000/api/file/$FILE_ID/download" \
  -H "Authorization: Bearer $TOKEN"
curl -sk -o /tmp/low.png "https://localhost:8000/api/file/$FILE_ID/download?quality=low" \
  -H "Authorization: Bearer $TOKEN"

cmp -s /tmp/pixel.png /tmp/high.png && echo "high quality matches original: OK"
ls -la /tmp/high.png /tmp/low.png
```

Expected: `high quality matches original: OK`; `/tmp/low.png` exists and is a valid (re-encoded) JPEG-content file.

- [ ] **Step 7: Upload a movie image through the movie-specific route**

```bash
MOVIE_ID=$(curl -sk -X POST https://localhost:8000/api/movie \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"title":"Smoke Test Movie","description":"d","image":"placeholder","director":"d","releaseDate":"2020-01-01","genre":"g","duration":"90 min","rating":5}' \
  | jq -r .id)

MOVIE_IMAGE_ID=$(curl -sk -X POST "https://localhost:8000/api/movie/$MOVIE_ID/image" \
  -H "Authorization: Bearer $TOKEN" \
  -F "image=@/tmp/pixel.png;type=image/png" | jq -r .image)
echo "$MOVIE_IMAGE_ID"

curl -sk -o /tmp/movie-image-low.jpg "https://localhost:8000/api/file/$MOVIE_IMAGE_ID/download?quality=low" \
  -H "Authorization: Bearer $TOKEN"
ls -la /tmp/movie-image-low.jpg
```

Expected: `MOVIE_IMAGE_ID` is a UUID equal to a different file id than `$FILE_ID`; `/tmp/movie-image-low.jpg` downloads successfully via the *generic* file endpoint.

- [ ] **Step 8: Confirm the on-disk layout inside the container**

```bash
docker compose -f docker-compose-development.yml exec express sh -c \
  "find uploads -maxdepth 3"
```

Expected: one entry directly under `uploads/<FILE_ID>/` (the generic upload) and one under `uploads/movie/<MOVIE_IMAGE_ID>/` (the movie upload), each containing `original.png` and `low.jpg`.

- [ ] **Step 9: Tear down**

```bash
docker compose -f docker-compose-development.yml down
```

- [ ] **Step 10: Report results**

Summarize pass/fail for lint, automated tests, and each manual smoke-test step. If any step failed, stop and fix before considering the feature complete — do not proceed to a final commit with a known-broken smoke test.

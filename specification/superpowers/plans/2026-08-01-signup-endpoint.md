# Local Signup Endpoint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `POST /api/signup/local` so a new user can register with a username, email, and password, stored in the existing MongoDB `User` collection.

**Architecture:** New `signup` route → `SignupController` → `SignupService` → existing `userRepository`, mirroring the existing `auth`/`user` route→controller→service→repository layering. Two small existing-file changes support it: `User.schema.ts` (make `googleId` optional) and `Error.ts` (add a `ConflictError` class).

**Tech Stack:** Express, TypeScript, Mongoose, Passport-adjacent (no passport strategy needed — this is a plain REST endpoint), Mocha + Sinon + Chai for tests, `md5` for password hashing (existing dependency), `uuid` for id generation (existing dependency).

## Global Constraints

- Password hashing stays `md5` (matches existing `localStrategy.ts`) — do **not** introduce bcrypt/`Crypt` here.
- Signup does **not** auto-login: response is `201` with the created user, no JWT.
- Route path is exactly `POST /api/signup/local`.
- Duplicate username or email → `409` via a new `ConflictError` class (`src/utils/error/Error.ts`), not a repurposed `ServerError`.
- Validation is minimal: all three fields required/non-empty, basic email regex, password minimum length 8. No schema-validation library (zod/joi) is introduced.
- No MongoDB-level `unique` index is added to `email`/`name` — uniqueness stays an application-layer check.
- No supertest/E2E test is introduced — this app has no integration tests today, and the spec explicitly keeps that out of scope. Verification of the wired-up route is manual (curl against the dev server).

---

### Task 1: Add `ConflictError` and wire it into the error middleware

**Files:**
- Modify: `src/utils/error/Error.ts`
- Test: `src/utils/error/Error.spec.ts` (new file — no existing spec covers this file)

**Interfaces:**
- Produces: `export class ConflictError extends Error` with `readonly publicMessage: string`, constructor `(message: string, publicInformation?: string, stack?: string)`, and `sendJSONResponse(res: express.Response): void` that responds `409` with `{ success: false, status: 409, message: this.publicMessage, stack }`.
- `errorHandlerMiddleware` gains an `else if (err instanceof ConflictError)` branch, calling `err.sendJSONResponse(res)`, inserted between the existing `BadRequestError` branch and the final `else`.

- [ ] **Step 1: Write the failing test**

Create `src/utils/error/Error.spec.ts`:

```ts
import { expect } from 'chai'
import sinon, { SinonSandbox, SinonStub } from 'sinon'
import { ConflictError, errorHandlerMiddleware } from './Error'

describe('ConflictError', () => {
    describe('sendJSONResponse', () => {
        it('should respond with 409 and the public message', () => {
            const error = new ConflictError('email already registered')
            const json = sinon.stub()
            const res = { status: sinon.stub().returns({ json }) } as any

            error.sendJSONResponse(res)

            expect(res.status.calledWith(409)).to.be.true
            expect(json.args[0][0]).to.deep.include({
                success: false,
                status: 409,
                message: 'email already registered'
            })
        })

        it('should prefer publicInformation over message when given', () => {
            const error = new ConflictError('internal detail', 'username already taken')
            const json = sinon.stub()
            const res = { status: sinon.stub().returns({ json }) } as any

            error.sendJSONResponse(res)

            expect(json.args[0][0].message).to.equal('username already taken')
        })
    })
})

describe('errorHandlerMiddleware', () => {
    let sandbox: SinonSandbox
    let next: SinonStub
    beforeEach(() => {
        sandbox = sinon.createSandbox()
        next = sandbox.stub()
    })
    afterEach(() => {
        sandbox.restore()
    })

    it('should call sendJSONResponse on a ConflictError instance', async () => {
        const error = new ConflictError('email already registered')
        const sendJSONResponseSpy = sandbox.spy(error, 'sendJSONResponse')
        const res = {} as any

        await errorHandlerMiddleware(error, {} as any, res, next as any)

        expect(sendJSONResponseSpy.calledOnceWith(res)).to.be.true
    })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `TS_NODE_PROJECT=tsconfig.test.json node --loader ts-node/register ./node_modules/.bin/mocha src/utils/error/Error.spec.ts`
Expected: FAIL — `ConflictError` is not exported from `./Error`.

- [ ] **Step 3: Implement `ConflictError` and the middleware branch**

In `src/utils/error/Error.ts`, add after the `BadRequestError` class (before `ServerError`):

```ts
/**
 * ConflictError class will be instantiated when the request conflicts with existing state (e.g. duplicate unique field)
 */
export class ConflictError extends Error {
    readonly publicMessage: string

    constructor(message: string, publicInformation?: string, stack?: string) {
        super(message)
        this.name = 'ConflictError'
        this.publicMessage = publicInformation ?? message
        this.stack = stack
    }

    sendJSONResponse(res: express.Response) {
        res.status(409).json({
            success: false,
            status: 409,
            message: this.publicMessage,
            stack: process.env.NODE_ENV === 'development' ? this.stack : {}
        })
    }
}
```

Then update `errorHandlerMiddleware`:

```ts
export async function errorHandlerMiddleware(err: any, req: Request, res: Response, _next: NextFunction) {
    const errStatus = err.statusCode || 500
    const errMsg = err.message || 'Something went wrong'
    const errStack = err.stack
    logger.error('[erorrHandlerMiddleware] ' + errMsg)
    if (err instanceof BadRequestError) {
        err.sendJSONResponse(res)
    } else if (err instanceof ConflictError) {
        err.sendJSONResponse(res)
    } else {
        const error = new ServerError(errMsg, errStack)
        error.sendJSONResponse(res, errStatus)
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `TS_NODE_PROJECT=tsconfig.test.json node --loader ts-node/register ./node_modules/.bin/mocha src/utils/error/Error.spec.ts`
Expected: PASS (all 3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/utils/error/Error.ts src/utils/error/Error.spec.ts
git commit -m "feat: add ConflictError for 409 responses"
```

---

### Task 2: Make `googleId` optional on the User schema

**Files:**
- Modify: `src/entities/User.schema.ts`
- Test: `src/entities/User.schema.spec.ts` (new file)

**Interfaces:**
- Produces: `UserModel` continues to be exported the same way; `googleId` is no longer a required field, matching `UserEntity.googleId?: string` in `src/types/User.ts`.

- [ ] **Step 1: Write the failing test**

Create `src/entities/User.schema.spec.ts`. This uses Mongoose's synchronous validation (`validateSync`), which does not require a DB connection:

```ts
import { expect } from 'chai'
import { UserModel } from './User.schema'

describe('UserSchema', () => {
    const baseUser = {
        id: '1',
        name: 'jdoe',
        email: 'jdoe@example.com',
        jwtSecureCode: 'secure-code'
    }

    it('should validate a user without a googleId', () => {
        const user = new UserModel(baseUser)
        const validationError = user.validateSync()
        expect(validationError).to.be.undefined
    })

    it('should still require id, name, email and jwtSecureCode', () => {
        const user = new UserModel({})
        const validationError = user.validateSync()
        expect(validationError.errors.id).to.exist
        expect(validationError.errors.name).to.exist
        expect(validationError.errors.email).to.exist
        expect(validationError.errors.jwtSecureCode).to.exist
        expect(validationError.errors.googleId).to.not.exist
    })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `TS_NODE_PROJECT=tsconfig.test.json node --loader ts-node/register ./node_modules/.bin/mocha src/entities/User.schema.spec.ts`
Expected: FAIL — the first test fails because `googleId` is still required (`validationError` is not `undefined`, it contains a `googleId` error).

- [ ] **Step 3: Make `googleId` optional**

In `src/entities/User.schema.ts`, change:

```ts
  googleId: {
    required: true,
    type: String
  },
```

to:

```ts
  googleId: {
    type: String
  },
```

- [ ] **Step 4: Run test to verify it passes**

Run: `TS_NODE_PROJECT=tsconfig.test.json node --loader ts-node/register ./node_modules/.bin/mocha src/entities/User.schema.spec.ts`
Expected: PASS (both tests)

- [ ] **Step 5: Commit**

```bash
git add src/entities/User.schema.ts src/entities/User.schema.spec.ts
git commit -m "fix: make googleId optional on User schema for local signup"
```

---

### Task 3: Implement `SignupService`

**Files:**
- Create: `src/types/Signup.ts`
- Create: `src/services/signupService.ts`
- Test: `src/services/signupService.spec.ts`

**Interfaces:**
- Consumes: `IUserRepository<UserEntity>` (`src/types/repositories.ts`) with `findOne(data: Partial<UserEntity>): Promise<UserEntity>` and `create(data: UserEntity): Promise<UserEntity>`; `userRepository` singleton export from `src/repositories/index.ts`; `BadRequestError`, `ConflictError` from `src/utils/error/Error.ts` (Task 1); `loggedMethod` from `src/utils/logger/logger.ts`.
- Produces:
  - `export interface SignupRequestBody { username: string; email: string; password: string }` (`src/types/Signup.ts`)
  - `export type CreatedUser = Pick<UserEntity, 'id' | 'name' | 'email'>` (`src/services/signupService.ts`)
  - `export class SignupService { static getInstance(): SignupService; public async signup(data: SignupRequestBody): Promise<CreatedUser> }` — used by `SignupController` in Task 4.

- [ ] **Step 1: Create the request-body type**

Create `src/types/Signup.ts`:

```ts
export interface SignupRequestBody {
    username: string
    email: string
    password: string
}
```

- [ ] **Step 2: Write the failing tests**

Create `src/services/signupService.spec.ts`:

```ts
import { expect } from 'chai'
import md5 from 'md5'
import sinon, { SinonSandbox, SinonSpy, SinonStub } from 'sinon'
import { loggerInstance } from '../utils/logger/logger'
import { SignupService } from './signupService'
import { UserRepository } from '../repositories/User.repository'
import { BadRequestError, ConflictError } from '../utils/error/Error'

let sandbox: SinonSandbox

describe('SignupService', () => {
    let loggerSpy: SinonSpy
    let signupServiceInstance: SignupService
    let userRepository: { findOne: SinonStub, create: SinonStub }
    const validData = { username: 'jdoe', email: 'jdoe@example.com', password: 'longenoughpw' }
    const createdUser = {
        id: 'generated-id',
        name: 'jdoe',
        email: 'jdoe@example.com',
        password: md5('longenoughpw'),
        fullName: 'jdoe',
        jwtSecureCode: 'generated-code'
    }

    beforeEach(() => {
        sandbox = sinon.createSandbox()
        loggerSpy = sandbox.spy(loggerInstance.logger, 'info')
        userRepository = {
            findOne: sandbox.stub().resolves(null),
            create: sandbox.stub().resolves(createdUser)
        } as any
        signupServiceInstance = new SignupService(userRepository as unknown as UserRepository)
    })
    afterEach(() => {
        sandbox.restore()
    })

    describe('getInstance', () => {
        it('should return with instance', () => {
            const instance = SignupService.getInstance()
            expect(instance).deep.equal((SignupService as any)._instance)
        })
    })

    describe('signup', () => {
        it('should call the logger method', async () => {
            await signupServiceInstance.signup(validData)
            expect(loggerSpy.callCount > 0).to.be.true
        })

        it('should throw BadRequestError when username is missing', async () => {
            try {
                await signupServiceInstance.signup({ ...validData, username: '' })
                expect.fail('expected signup to throw')
            } catch (e) {
                expect(e).to.be.instanceOf(BadRequestError)
            }
        })

        it('should throw BadRequestError when email is missing', async () => {
            try {
                await signupServiceInstance.signup({ ...validData, email: '' })
                expect.fail('expected signup to throw')
            } catch (e) {
                expect(e).to.be.instanceOf(BadRequestError)
            }
        })

        it('should throw BadRequestError when password is missing', async () => {
            try {
                await signupServiceInstance.signup({ ...validData, password: '' })
                expect.fail('expected signup to throw')
            } catch (e) {
                expect(e).to.be.instanceOf(BadRequestError)
            }
        })

        it('should throw BadRequestError when email is not a valid format', async () => {
            try {
                await signupServiceInstance.signup({ ...validData, email: 'not-an-email' })
                expect.fail('expected signup to throw')
            } catch (e) {
                expect(e).to.be.instanceOf(BadRequestError)
            }
        })

        it('should throw BadRequestError when password is shorter than 8 characters', async () => {
            try {
                await signupServiceInstance.signup({ ...validData, password: 'short1' })
                expect.fail('expected signup to throw')
            } catch (e) {
                expect(e).to.be.instanceOf(BadRequestError)
            }
        })

        it('should throw ConflictError when the username is already taken', async () => {
            userRepository.findOne = sandbox.stub().resolves(createdUser)
            try {
                await signupServiceInstance.signup(validData)
                expect.fail('expected signup to throw')
            } catch (e) {
                expect(e).to.be.instanceOf(ConflictError)
            }
        })

        it('should throw ConflictError when the email is already registered', async () => {
            userRepository.findOne = sandbox.stub()
            userRepository.findOne.onFirstCall().resolves(null)
            userRepository.findOne.onSecondCall().resolves(createdUser)
            try {
                await signupServiceInstance.signup(validData)
                expect.fail('expected signup to throw')
            } catch (e) {
                expect(e).to.be.instanceOf(ConflictError)
            }
        })

        describe('userRepository create', () => {
            it('should be called with a user built from the request, password hashed with md5', async () => {
                await signupServiceInstance.signup(validData)
                const paramsOfCreate = userRepository.create.args[0][0]
                expect(paramsOfCreate.name).to.equal('jdoe')
                expect(paramsOfCreate.email).to.equal('jdoe@example.com')
                expect(paramsOfCreate.password).to.equal(md5('longenoughpw'))
                expect(paramsOfCreate.fullName).to.equal('jdoe')
                expect(paramsOfCreate.id).to.be.a('string').and.not.empty
                expect(paramsOfCreate.jwtSecureCode).to.be.a('string').and.not.empty
            })
        })

        it('should return the created user without password or jwtSecureCode', async () => {
            const result = await signupServiceInstance.signup(validData)
            expect(result).to.deep.equal({
                id: createdUser.id,
                name: createdUser.name,
                email: createdUser.email
            })
        })
    })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `TS_NODE_PROJECT=tsconfig.test.json node --loader ts-node/register ./node_modules/.bin/mocha src/services/signupService.spec.ts`
Expected: FAIL — `./signupService` does not exist yet.

- [ ] **Step 4: Implement `SignupService`**

Create `src/services/signupService.ts`:

```ts
import { v4 as uuidv4 } from 'uuid'
import md5 from 'md5'
import { UserEntity } from '../types/User'
import { SignupRequestBody } from '../types/Signup'
import { loggedMethod } from '../utils/logger/logger'
import { userRepository } from '../repositories'
import { IUserRepository } from '../types/repositories'
import { BadRequestError, ConflictError } from '../utils/error/Error'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8

export type CreatedUser = Pick<UserEntity, 'id' | 'name' | 'email'>

/**
 * This class take care about registering new local users: validating input,
 * enforcing uniqueness and persisting the new user via userRepository
 */
export class SignupService {
    protected static _instance: SignupService
    constructor(protected userRepository: IUserRepository) { }

    /**
     * getInstance function provides that this class work as a singleton
     * @returns
     */
    static getInstance() {
        if (!this._instance) {
            this._instance = new SignupService(userRepository)
        }
        return this._instance
    }

    /**
     * signup method validates the given data, ensures the username/email are not
     * already taken, then creates and returns the new user (without secrets)
     * @param {SignupRequestBody} data
     * @returns {Promise<CreatedUser>}
     */
    @loggedMethod('[SignupService]')
    public async signup(data: SignupRequestBody): Promise<CreatedUser> {
        this.validate(data)
        await this.assertNotTaken(data.username, data.email)

        const newUser = {
            id: uuidv4(),
            name: data.username,
            email: data.email,
            password: md5(data.password),
            fullName: data.username,
            jwtSecureCode: uuidv4()
        } as UserEntity

        const createdUser = await this.userRepository.create(newUser)
        return { id: createdUser.id, name: createdUser.name, email: createdUser.email }
    }

    private validate(data: SignupRequestBody) {
        if (!data.username) throw new BadRequestError('username is required')
        if (!data.email) throw new BadRequestError('email is required')
        if (!data.password) throw new BadRequestError('password is required')
        if (!EMAIL_REGEX.test(data.email)) throw new BadRequestError('email is not a valid email address')
        if (data.password.length < MIN_PASSWORD_LENGTH) {
            throw new BadRequestError(`password must be at least ${MIN_PASSWORD_LENGTH} characters`)
        }
    }

    private async assertNotTaken(username: string, email: string) {
        const existingByName = await this.userRepository.findOne({ name: username })
        if (existingByName) throw new ConflictError('username already taken')

        const existingByEmail = await this.userRepository.findOne({ email })
        if (existingByEmail) throw new ConflictError('email already registered')
    }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `TS_NODE_PROJECT=tsconfig.test.json node --loader ts-node/register ./node_modules/.bin/mocha src/services/signupService.spec.ts`
Expected: PASS (all tests)

- [ ] **Step 6: Commit**

```bash
git add src/types/Signup.ts src/services/signupService.ts src/services/signupService.spec.ts
git commit -m "feat: add SignupService for local signup"
```

---

### Task 4: Implement `SignupController`

**Files:**
- Create: `src/controllers/signupController.ts`
- Test: `src/controllers/signupController.spec.ts`

**Interfaces:**
- Consumes: `SignupService` from Task 3 — `SignupService.getInstance(): SignupService`, `signup(data: SignupRequestBody): Promise<CreatedUser>`.
- Produces: `export class SignupController { static getInstance(): SignupController; public async signupLocal(req, res, next): Promise<void> }` — used by `src/routes/signup.ts` in Task 5.

- [ ] **Step 1: Write the failing tests**

Create `src/controllers/signupController.spec.ts`:

```ts
import { expect } from 'chai'
import sinon, { SinonSandbox, SinonStub } from 'sinon'
import { SignupController } from './signupController'
import { SignupService } from '../services/signupService'

let sandbox: SinonSandbox

describe('SignupController', () => {
    let signupControllerInstance: SignupController
    let signupService: { signup: SinonStub }
    let req: any
    let res: any
    let next: SinonStub
    let jsonStub: SinonStub
    let statusStub: SinonStub

    beforeEach(() => {
        sandbox = sinon.createSandbox()
        jsonStub = sandbox.stub()
        statusStub = sandbox.stub().returns({ json: jsonStub })
        req = { body: { username: 'jdoe', email: 'jdoe@example.com', password: 'longenoughpw' } }
        res = { status: statusStub }
        next = sandbox.stub()
        signupService = { signup: sandbox.stub().resolves({ id: '1', name: 'jdoe', email: 'jdoe@example.com' }) }
        signupControllerInstance = new SignupController(signupService as unknown as SignupService)
    })
    afterEach(() => {
        sandbox.restore()
    })

    describe('getInstance', () => {
        it('should return with instance', () => {
            const instance = SignupController.getInstance()
            expect(instance).deep.equal((SignupController as any)._instance)
        })
    })

    describe('signupLocal', () => {
        it('should call signupService.signup with the request body', async () => {
            await signupControllerInstance.signupLocal(req, res, next)
            expect(signupService.signup.args[0][0]).to.deep.equal(req.body)
        })

        it('should respond 201 with the created user on success', async () => {
            await signupControllerInstance.signupLocal(req, res, next)
            expect(statusStub.calledWith(201)).to.be.true
            expect(jsonStub.args[0][0]).to.deep.equal({ id: '1', name: 'jdoe', email: 'jdoe@example.com' })
        })

        it('should call next with the error when signupService.signup throws', async () => {
            const thrownError = new Error('something_went_wrong')
            signupService.signup = sandbox.stub().rejects(thrownError)
            signupControllerInstance = new SignupController(signupService as unknown as SignupService)

            await signupControllerInstance.signupLocal(req, res, next)

            expect(next.args[0][0]).to.equal(thrownError)
        })
    })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `TS_NODE_PROJECT=tsconfig.test.json node --loader ts-node/register ./node_modules/.bin/mocha src/controllers/signupController.spec.ts`
Expected: FAIL — `./signupController` does not exist yet.

- [ ] **Step 3: Implement `SignupController`**

Create `src/controllers/signupController.ts`:

```ts
import express from 'express'
import { SignupService } from '../services/signupService'
import { loggedMethod } from '../utils/logger/logger'

/**
 * This class is about to provide the local signup endpoint via signup service
 */
export class SignupController {
    protected static _instance: SignupController

    constructor(private signupService: SignupService) { }

    static getInstance(): SignupController {
        if (!this._instance) {
            this._instance = new SignupController(SignupService.getInstance())
        }
        return this._instance
    }

    /**
     * This controller method registers a new local user via signupService
     * and responds with the created user (without secrets)
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[SignupController]')
    public async signupLocal(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const createdUser = await this.signupService.signup(req.body)
            res.status(201).json(createdUser)
        } catch (e) {
            next(e)
        }
    }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `TS_NODE_PROJECT=tsconfig.test.json node --loader ts-node/register ./node_modules/.bin/mocha src/controllers/signupController.spec.ts`
Expected: PASS (all 4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/controllers/signupController.ts src/controllers/signupController.spec.ts
git commit -m "feat: add SignupController for local signup"
```

---

### Task 5: Wire up the `/api/signup/local` route and verify end-to-end

**Files:**
- Create: `src/routes/signup.ts`
- Modify: `src/routes/index.ts`

**Interfaces:**
- Consumes: `SignupController` from Task 4 (`SignupController.getInstance()`, `.signupLocal`).
- Produces: `export default router` mounted at `/signup` — full path becomes `POST /api/signup/local`.

- [ ] **Step 1: Create the route file**

Create `src/routes/signup.ts`:

```ts
import express from 'express'
import { SignupController } from '../controllers/signupController'

// get the current router instance
const router = express.Router()

// get the current signup controller instance
const signupController = SignupController.getInstance()

/**
 * @swagger
 * /api/signup/local:
 *   post:
 *     summary: register a new local user
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password]
 *             properties:
 *               username:
 *                 type: string
 *                 example: jdoe
 *               email:
 *                 type: string
 *                 example: jdoe@example.com
 *               password:
 *                 type: string
 *                 example: s3cretpw
 *     responses:
 *       "201":
 *         description: user created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *       "400":
 *         description: username, email or password missing/invalid
 *       "409":
 *         description: username or email already taken
 */
router.post('/local', signupController.signupLocal.bind(signupController))

export default router
```

- [ ] **Step 2: Mount the route**

In `src/routes/index.ts`, add the import next to the other route imports:

```ts
import userRouter from './user'
import authRouter from './auth'
import signupRouter from './signup'
import movieRouter from './movie'
```

And mount it in the `[INFRASTRUCTURE]` block, next to `/user` and `/auth`:

```ts
// [INFRASTRUCTURE] Keep these — required for auth to work
router.use('/user', userRouter)
router.use('/auth', authRouter)
router.use('/signup', signupRouter)
```

- [ ] **Step 3: Run the full test suite**

Run: `npm test`
Expected: All tests pass, including every spec added in Tasks 1–4.

- [ ] **Step 4: Manually verify the route against the running dev server**

Run: `docker compose -f docker-compose-development.yml up -d`

Then:

```bash
curl -k -X POST https://localhost:8000/api/signup/local \
  -H "Content-Type: application/json" \
  -d '{"username":"jdoe","email":"jdoe@example.com","password":"longenoughpw"}'
```

Expected: `HTTP 201` with body `{"id":"...","name":"jdoe","email":"jdoe@example.com"}` (no `password`/`jwtSecureCode`).

Repeat the same curl call a second time.
Expected: `HTTP 409` with `{"success":false,"status":409,"message":"username already taken",...}`.

Then verify validation:

```bash
curl -k -X POST https://localhost:8000/api/signup/local \
  -H "Content-Type: application/json" \
  -d '{"username":"","email":"bad","password":"short"}'
```

Expected: `HTTP 400` with a validation message.

Tear down: `docker compose -f docker-compose-development.yml down`

- [ ] **Step 5: Commit**

```bash
git add src/routes/signup.ts src/routes/index.ts
git commit -m "feat: wire up POST /api/signup/local"
```

# bcrypt Password Hashing Cutover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace md5 with bcrypt for local-auth password hashing in `signupService.ts` and `localStrategy.ts`, reusing the existing `crypt` bcrypt utility.

**Architecture:** No new components. `signupService.createUser` switches from `md5(password)` to `await crypt.hashValue(password)`. `localStrategy.checkExistingUserByProfile` switches from a single Mongo query with the hashed password baked into the filter (impossible with a salted hash) to a lookup-by-username followed by `await crypt.checkValue(password, user.password)`.

**Tech Stack:** TypeScript, Mocha/Chai/Sinon, existing `bcrypt`-backed `crypt` singleton (`src/utils/Crypt.ts`).

## Global Constraints

- Hard cutover, no migration bridge: existing md5-hashed users will fail login after this change. No lazy-rehash fallback, no password-reset flow — both explicitly out of scope (see spec).
- Reuse the existing `crypt` singleton default-exported from `src/utils/Crypt.ts` — do not add a new bcrypt import or wrapper.
- Do not change the Google (`authStrategy.ts` base `createNewUserFromAuthUser`/`checkExistingUserByProfile`) or JWT (`jwtStrategy.ts`) strategies.
- Preserve the external request/response contract of `POST /api/signup/local` and the local-strategy login callback — only the internal hashing/comparison mechanism changes.
- Spec: `docs/superpowers/specs/2026-08-17-bcrypt-password-hashing-design.md`

---

### Task 1: Switch signup password hashing to bcrypt

**Files:**
- Modify: `src/services/signupService.ts`
- Test: `src/services/signupService.spec.ts`

**Interfaces:**
- Consumes: `crypt` default export from `src/utils/Crypt.ts` — `hashValue(value: string): Promise<string>`.
- Produces: `SignupService.createUser` now stores a bcrypt hash in `password` instead of an md5 hash. No signature changes — `signup(data: SignupRequestBody): Promise<CreatedUser>` is unchanged.

- [ ] **Step 1: Update the test to expect `crypt.hashValue` instead of `md5`**

Replace the full contents of `src/services/signupService.spec.ts` with:

```ts
import { expect } from 'chai'
import sinon, { SinonSandbox, SinonSpy, SinonStub } from 'sinon'
import { loggerInstance } from '../utils/logger/logger'
import { SignupService } from './signupService'
import { UserRepository } from '../repositories/User.repository'
import { BadRequestError, ConflictError } from '../utils/error/Error'
import crypt from '../utils/Crypt'

let sandbox: SinonSandbox

describe('SignupService', () => {
    let loggerSpy: SinonSpy
    let hashValueStub: SinonStub
    let signupServiceInstance: SignupService
    let userRepository: { findOne: SinonStub, create: SinonStub }
    const validData = { username: 'jdoe', email: 'jdoe@example.com', password: 'longenoughpw' }
    const hashedPassword = 'bcrypt-hashed-password'
    const createdUser = {
        id: 'generated-id',
        name: 'jdoe',
        email: 'jdoe@example.com',
        password: hashedPassword,
        fullName: 'jdoe',
        jwtSecureCode: 'generated-code'
    }

    beforeEach(() => {
        sandbox = sinon.createSandbox()
        loggerSpy = sandbox.spy(loggerInstance.logger, 'info')
        hashValueStub = sandbox.stub(crypt, 'hashValue').resolves(hashedPassword)
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

        it('should throw BadRequestError when username is a non-string value (NoSQL injection attempt)', async () => {
            try {
                await signupServiceInstance.signup({ ...validData, username: { $ne: null } } as any)
                expect.fail('expected signup to throw')
            } catch (e) {
                expect(e).to.be.instanceOf(BadRequestError)
            }
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
            it('should be called with a user built from the request, password hashed via crypt.hashValue', async () => {
                await signupServiceInstance.signup(validData)
                expect(hashValueStub.calledOnceWith('longenoughpw')).to.be.true
                const paramsOfCreate = userRepository.create.args[0][0]
                expect(paramsOfCreate.name).to.equal('jdoe')
                expect(paramsOfCreate.email).to.equal('jdoe@example.com')
                expect(paramsOfCreate.password).to.equal(hashedPassword)
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

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd /home/bcsaban1/ownProjects/expressApp && TS_NODE_PROJECT=tsconfig.test.json node --loader ts-node/register ./node_modules/.bin/mocha src/services/signupService.spec.ts`

Expected: FAIL on `should be called with a user built from the request, password hashed via crypt.hashValue` — `paramsOfCreate.password` is still an md5 hash (`hashValueStub` was never called), not `'bcrypt-hashed-password'`.

- [ ] **Step 3: Update the implementation**

In `src/services/signupService.ts`, remove the `md5` import and switch to `crypt.hashValue`:

```ts
import { v4 as uuidv4 } from 'uuid'
import crypt from '../utils/Crypt'
import { UserEntity } from '../types/User'
import { SignupRequestBody } from '../types/Signup'
import { loggedMethod } from '../utils/logger/logger'
import { userRepository } from '../repositories'
import { IUserRepository } from '../types/repositories'
import { BadRequestError, ConflictError } from '../utils/error/Error'
```

(This replaces the `import md5 from 'md5'` line — every other import stays as-is.)

Then update the `signup` method body:

```ts
    public async signup(data: SignupRequestBody): Promise<CreatedUser> {
        this.validate(data)
        await this.assertNotTaken(data.username, data.email)
        const hashedPassword = await crypt.hashValue(data.password)
        return this.createUser(data.username, data.email, hashedPassword)
    }
```

Everything else in the file (`createUser`, `validate`, `assertNotTaken`, the `EMAIL_REGEX`/`MIN_PASSWORD_LENGTH` constants) is unchanged.

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd /home/bcsaban1/ownProjects/expressApp && TS_NODE_PROJECT=tsconfig.test.json node --loader ts-node/register ./node_modules/.bin/mocha src/services/signupService.spec.ts`

Expected: PASS, all tests green.

- [ ] **Step 5: Commit**

```bash
cd /home/bcsaban1/ownProjects/expressApp
git add src/services/signupService.ts src/services/signupService.spec.ts
git commit -m "Hash signup passwords with bcrypt instead of md5

md5 is incompatible with the OAuth server's bcrypt.compare check on
User.password. Reuses the existing crypt singleton (utils/Crypt.ts)."
```

---

### Task 2: Switch local-strategy login to bcrypt comparison

**Files:**
- Modify: `src/providers/auth/localStrategy.ts`
- Test: `src/providers/auth/localStrategy.spec.ts`

**Interfaces:**
- Consumes: `crypt` default export from `src/utils/Crypt.ts` — `checkValue(originalValue: string, hashedValue: string): Promise<boolean>`.
- Produces: `CustomLocalStrategy.checkExistingUserByProfile(profile: { username: string, password: string }): Promise<UserEntity>` — same signature as before, but now resolves `undefined` both when no user matches the username and when the password doesn't match (previously only the combined-query miss case existed). `getAuthCallBack` (unchanged code) already treats a falsy resolved value as an auth failure via `done(null, user)`.

- [ ] **Step 1: Update the test to expect a lookup-then-compare flow**

Replace the full contents of `src/providers/auth/localStrategy.spec.ts` with:

```ts
import { expect } from 'chai'
import sinon, { SinonSandbox, SinonStub } from 'sinon'
import { UserRepository } from '../../repositories/User.repository'
import { CustomLocalStrategy } from './localStrategy'
import crypt from '../../utils/Crypt'

let sandbox: SinonSandbox

describe('LocalStrategy', () => {
    let authStrategyInstance: CustomLocalStrategy
    let checkValueStub: SinonStub
    const options = {
        username: 'username', // Field name for username
        password: 'password'  // Field name for password
    }
    let userRepository: { create: SinonStub, findOne: SinonStub }
    let oauth2: {
        Strategy: SinonStub
    }
    const mockUser = {
        id: '1',
        name: 'test',
        fullName: 'given family',
        email: 'test@gmail.com',
        password: 'testpassword',
        jwtSecureCode: 'test'
    }
    const profile = {
        username: 'user', password: 'password'
    }
    beforeEach(() => {
        sandbox = sinon.createSandbox()
        oauth2 = { Strategy: sandbox.stub() }
        userRepository = {
            create: sandbox.stub().resolves(mockUser),
            findOne: sandbox.stub().resolves(mockUser)
        } as any
        checkValueStub = sandbox.stub(crypt, 'checkValue').resolves(true)
        authStrategyInstance = new CustomLocalStrategy(options, userRepository as unknown as UserRepository, oauth2)
    })
    afterEach(() => {
        sandbox.restore()
    })
    describe('checkExistingUserByProfile', () => {
        it('should find the user in the repository by username only', async () => {
            await authStrategyInstance.checkExistingUserByProfile(profile)
            expect(userRepository.findOne.calledOnceWith({ name: profile.username })).to.be.true
        })
        it('should compare the given password against the stored hash', async () => {
            await authStrategyInstance.checkExistingUserByProfile(profile)
            expect(checkValueStub.calledOnceWith(profile.password, mockUser.password)).to.be.true
        })
        it('should return the user when the password matches', async () => {
            const result = await authStrategyInstance.checkExistingUserByProfile(profile)
            expect(result).to.deep.equal(mockUser)
        })
        it('should return undefined when the password does not match', async () => {
            checkValueStub.resolves(false)
            const result = await authStrategyInstance.checkExistingUserByProfile(profile)
            expect(result).to.be.undefined
        })
        it('should return undefined when no user is found, without calling crypt.checkValue', async () => {
            userRepository.findOne.resolves(null)
            const result = await authStrategyInstance.checkExistingUserByProfile(profile)
            expect(result).to.be.undefined
            expect(checkValueStub.called).to.be.false
        })
    })
    describe('getAuthCallBack', () => {
        let callBackFunction: (username: string, password: string, done: any) => Promise<any>
        beforeEach(() => {
            callBackFunction = authStrategyInstance.getAuthCallBack()
        })
        describe('the callback function returned ', async () => {
            it('should call checkExistingUserByProfile with profile taken as parameter', async () => {
                const checkExsistingStub = sandbox.stub(authStrategyInstance, 'checkExistingUserByProfile').resolves()
                await callBackFunction('user', 'password', () => { })
                expect(checkExsistingStub.args[0][0]).deep.equal(profile)
            })
            it('should call done function with return of the checkExistingUserByProfile', async () => {
                const returnValueOfTheExistingUser = mockUser
                sandbox.stub(authStrategyInstance, 'checkExistingUserByProfile').resolves(returnValueOfTheExistingUser)
                const doneStub = sandbox.stub()
                await callBackFunction('user', 'password', doneStub)
                expect(doneStub.args[0][1]).deep.equal(returnValueOfTheExistingUser)
            })
            it('should call done function with error thrown by checkExistingUserByProfile', async () => {
                const tobeCaughtError = new Error('something_went_wrong')
                sandbox.stub(authStrategyInstance, 'checkExistingUserByProfile').throws(tobeCaughtError)
                const doneStub = sandbox.stub()
                await callBackFunction('user', 'password', doneStub)
                expect(doneStub.args[0][0]).deep.equal(tobeCaughtError)
            })
        })
    })
    describe('getStrategy', () => {
        let strategyInstance: any
        beforeEach(() => {
            strategyInstance = authStrategyInstance.getStrategy()
        })

        it('should return with a strategy instance ', async () => {
            expect(strategyInstance instanceof oauth2.Strategy).to.be.true
        })
        it('should instantiate a new Strategy instance ', async () => {
            expect(oauth2.Strategy.calledOnce).to.be.true
        })

        it('should instantiate a new Strategy instance with given options', async () => {
            expect(oauth2.Strategy.args[0][0]).deep.equal(options)
        })

        it('should instantiate a new Strategy instance with getAuthCallBack method as second attribute', async () => {
            const callback = oauth2.Strategy.args[0][1]
            expect(typeof callback).to.equal('function')
            expect(authStrategyInstance.getAuthCallBack().toString()).equal(callback.toString())
        })
    })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd /home/bcsaban1/ownProjects/expressApp && TS_NODE_PROJECT=tsconfig.test.json node --loader ts-node/register ./node_modules/.bin/mocha src/providers/auth/localStrategy.spec.ts`

Expected: FAIL on the `checkExistingUserByProfile` tests — the current implementation calls `findOne({ name, password: md5(password) })` in one shot and never calls `crypt.checkValue`.

- [ ] **Step 3: Update the implementation**

Replace the full contents of `src/providers/auth/localStrategy.ts` with:

```ts
import passport from 'passport-local'
import AuthStrategy from './authStrategy'
import { userRepository } from '../../repositories'
import { logger, LoggerClass } from '../../utils/logger/logger'
import { UserEntity } from '../../types/User'
import crypt from '../../utils/Crypt'
const options = {
  username: 'username', // Field name for username
  password: 'password'  // Field name for password
}
/**
 * This class is descentor of authstrategy class, is to perform the local authentication
 */
export class CustomLocalStrategy extends AuthStrategy {

  async checkExistingUserByProfile(profile: { username: string, password: string }): Promise<UserEntity> {
    const user = await this.userRepository.findOne({ name: profile.username })
    if (!user?.password) return undefined
    const isMatch = await crypt.checkValue(profile.password, user.password)
    return isMatch ? user : undefined
  }

  /**
   * this function is to check the actual user is existing or not, if not it will send error 
   * otherwise call the successcallback and finishes the authentication process
   * @returns 
   */
  getAuthCallBack() {
    return async (username: string, password: string, done: any) => {
      const profile = { username, password }
      try {
        logger.info('search existing user based on profile: ' + LoggerClass.objectToString(profile))
        const user = await this.checkExistingUserByProfile(profile)
        return done(null, user)
      } catch (error) {
        logger.error('the user does not exist ' + LoggerClass.objectToString(profile))
        return done(error as Error)
      }
    }
  }

}

export default new CustomLocalStrategy(options, userRepository, passport).getStrategy()
```

(Only the `checkExistingUserByProfile` body and the top import list change — `md5` is dropped, `crypt` is added.)

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd /home/bcsaban1/ownProjects/expressApp && TS_NODE_PROJECT=tsconfig.test.json node --loader ts-node/register ./node_modules/.bin/mocha src/providers/auth/localStrategy.spec.ts`

Expected: PASS, all tests green.

- [ ] **Step 5: Commit**

```bash
cd /home/bcsaban1/ownProjects/expressApp
git add src/providers/auth/localStrategy.ts src/providers/auth/localStrategy.spec.ts
git commit -m "Compare login passwords with bcrypt instead of md5

bcrypt salts each hash, so the password can no longer be matched
inside the Mongo query filter. Look up the user by username, then
verify the password with crypt.checkValue, mirroring the pattern
already used in oauth/src/routes/interactions.js."
```

---

### Task 3: Remove the unused md5 dependency

**Files:**
- Modify: `package.json`, `package-lock.json`

**Interfaces:**
- Consumes: nothing (cleanup task, runs after Tasks 1 and 2 have removed all `md5` imports).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Confirm no remaining references to the `md5` package**

Run: `cd /home/bcsaban1/ownProjects/expressApp && grep -rn "from 'md5'" src`

Expected: no output (empty). If anything prints, stop — Tasks 1 and 2 aren't fully applied yet.

- [ ] **Step 2: Uninstall the dependency**

Run: `cd /home/bcsaban1/ownProjects/expressApp && npm uninstall md5`

Expected: `package.json` and `package-lock.json` are updated, `md5` is removed from `dependencies`.

- [ ] **Step 3: Run the full test suite**

Run: `cd /home/bcsaban1/ownProjects/expressApp && npm test`

Expected: PASS, all tests green (this also catches any other file that still referenced `md5` and would now fail to compile).

- [ ] **Step 4: Commit**

```bash
cd /home/bcsaban1/ownProjects/expressApp
git add package.json package-lock.json
git commit -m "Remove unused md5 dependency

No longer referenced now that signup and local-strategy login both
hash/compare passwords with bcrypt via the crypt singleton."
```

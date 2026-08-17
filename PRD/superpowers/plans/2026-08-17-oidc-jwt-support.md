# OIDC JWT Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let expressApp's `requireJwt`-guarded routes accept RS256 access tokens issued by the sibling `../oauth` OIDC provider, in addition to expressApp's own local HS256 JWTs.

**Architecture:** A new `passport-jwt` strategy, `'jwt-oidc'`, verifies tokens against the oauth app's JWKS endpoint via `jwks-rsa`. `requireJwt` becomes `passport.authenticate(['jwt', 'jwt-oidc'], { session: false })` — either strategy succeeding grants access. The new strategy trusts the token's `id`/`email` claims directly (no DB lookup); `verifyPrivileges` (unchanged) still re-checks permissions from Mongo on every request regardless of which strategy authenticated.

**Tech Stack:** TypeScript, `passport-jwt` (existing), `jwks-rsa` (new dependency), Mocha/Chai/Sinon.

## Global Constraints

- No changes to local JWT issuance, `/auth/local`, `/auth/google`, `localStrategy.ts`, or `googleStrategy.ts`.
- The new strategy's `verifyUser` does no DB read — it trusts `payload.id`/`payload.email` directly. Do not add a `userRepository.findOne` call to it.
- `verifyPrivileges` (in `jwtStrategy.ts`, bound to `jwtStrategyInstance`) is the sole authorization source of truth and must not change — it already reads only `req.user.id`, independent of which strategy authenticated.
- `'jwt-oidc'` is registered with passport only when `process.env.OIDC_ISSUER` is set (checked at `initPassport()` call time, not module-import time) — expressApp is a template other projects clone without necessarily running the oauth app, and must keep working standalone with no new required config.
- New dependency: `jwks-rsa` (verify with `npm view jwks-rsa version` — expect `^4.x`).
- New optional env vars: `OIDC_ISSUER`, `OIDC_AUDIENCE`.
- Spec: `PRD/superpowers/specs/2026-08-17-oidc-jwt-support-design.md`

---

### Task 1: Create the `jwt-oidc` passport strategy

**Files:**
- Create: `src/providers/auth/jwtOidcStrategy.ts`
- Test: `src/providers/auth/jwtOidcStrategy.spec.ts`
- Modify: `package.json`, `package-lock.json`

**Interfaces:**
- Consumes: `AuthStrategy` base class (`./authStrategy`, existing — 3-arg constructor `(options, userRepository, passport)`, unchanged), `userRepository` named export from `../../repositories/index` (existing), `logger`/`LoggerClass` from `../../utils/logger/logger` (existing).
- Produces: `export class JWTOidcStrategy extends AuthStrategy` with `async verifyUser(payload: any): Promise<{ id: any, email: any } | false>` and `getAuthCallBack(): (payload: any, done: any) => Promise<any>`. Default export: a configured `passport-jwt` `Strategy` instance. Named export `jwtOidcStrategyInstance: JWTOidcStrategy`. Task 2 imports the default export and registers it with passport under the name `'jwt-oidc'`.

- [ ] **Step 1: Install the `jwks-rsa` dependency**

Run: `cd /home/bcsaban1/ownProjects/expressApp && npm install jwks-rsa`

Expected: `package.json` `dependencies` gains `"jwks-rsa": "^4.x.x"`, `package-lock.json` updates. `jwks-rsa` ships its own TypeScript types (`index.d.ts`), so no separate `@types/jwks-rsa` package is needed.

- [ ] **Step 2: Write the failing test**

Create `src/providers/auth/jwtOidcStrategy.spec.ts`:

```ts
import { expect } from 'chai'
import sinon, { SinonSandbox, SinonStub } from 'sinon'
import { UserRepository } from '../../repositories/User.repository'
import { JWTOidcStrategy } from './jwtOidcStrategy'

let sandbox: SinonSandbox

describe('JWTOidcStrategy', () => {
    let jwtOidcStrategyInstance: JWTOidcStrategy
    let userRepository: { create: SinonStub, findOne: SinonStub }
    let oauth2: { Strategy: SinonStub }
    const options = {
        jwtFromRequest: () => 'token',
        secretOrKeyProvider: sinon.stub(),
        audience: 'urn:oauth-provider:services',
        issuer: 'http://localhost:3200/oidc',
        algorithms: ['RS256']
    }
    const payload = { id: 'user-1', email: 'user@example.com', permissions: [] }

    beforeEach(() => {
        sandbox = sinon.createSandbox()
        oauth2 = { Strategy: sandbox.stub() }
        userRepository = {
            create: sandbox.stub().resolves(undefined),
            findOne: sandbox.stub().resolves(undefined)
        } as any
        jwtOidcStrategyInstance = new JWTOidcStrategy(options, userRepository as unknown as UserRepository, oauth2)
    })
    afterEach(() => {
        sandbox.restore()
    })

    describe('verifyUser', () => {
        it('should return an object with id and email when the payload has an id', async () => {
            const result = await jwtOidcStrategyInstance.verifyUser(payload)
            expect(result).to.deep.equal({ id: payload.id, email: payload.email })
        })
        it('should not call the user repository', async () => {
            await jwtOidcStrategyInstance.verifyUser(payload)
            expect(userRepository.findOne.called).to.be.false
        })
        it('should return false when the payload has no id', async () => {
            const result = await jwtOidcStrategyInstance.verifyUser({ email: 'user@example.com' })
            expect(result).to.equal(false)
        })
        it('should return false when the payload is empty', async () => {
            const result = await jwtOidcStrategyInstance.verifyUser({})
            expect(result).to.equal(false)
        })
    })

    describe('getAuthCallBack', () => {
        let result: (payload: any, done: any) => Promise<any>
        let verifyStub: SinonStub
        let callbackFunction: SinonStub

        beforeEach(() => {
            verifyStub = sandbox.stub(jwtOidcStrategyInstance, 'verifyUser').resolves({ id: payload.id, email: payload.email })
            callbackFunction = sandbox.stub()
            result = jwtOidcStrategyInstance.getAuthCallBack()
        })

        it('should return a function', () => {
            expect(result).to.be.a('function')
        })

        it('should call verifyUser with the given payload', async () => {
            await result(payload, callbackFunction)
            expect(verifyStub.calledOnceWith(payload)).to.be.true
        })

        it('should call done with the result of verifyUser', async () => {
            await result(payload, callbackFunction)
            expect(callbackFunction.args[0][0]).to.equal(null)
            expect(callbackFunction.args[0][1]).to.deep.equal({ id: payload.id, email: payload.email })
        })

        it('should call done with the error when verifyUser throws', async () => {
            const error = new Error('something went wrong')
            verifyStub.throws(error)
            await result(payload, callbackFunction)
            expect(callbackFunction.args[0][0]).to.equal(error)
        })
    })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `cd /home/bcsaban1/ownProjects/expressApp && TS_NODE_PROJECT=tsconfig.test.json node --loader ts-node/register ./node_modules/.bin/mocha src/providers/auth/jwtOidcStrategy.spec.ts`

Expected: FAIL — `Cannot find module './jwtOidcStrategy'` (the module doesn't exist yet).

- [ ] **Step 4: Implement the strategy**

Create `src/providers/auth/jwtOidcStrategy.ts`:

```ts
import dotenv from 'dotenv'
import passport, { ExtractJwt } from 'passport-jwt'
import jwksRsa from 'jwks-rsa'
import { userRepository } from '../../repositories/index'
import AuthStrategy from './authStrategy'
import { logger, LoggerClass } from '../../utils/logger/logger'
dotenv.config()

const { OIDC_ISSUER: issuer, OIDC_AUDIENCE: audience } = process.env

/**
 * Verifies access tokens issued by the ../oauth OIDC provider. Unlike
 * JWTStrategy, this trusts the token's id/email claims directly instead of
 * re-fetching the user from Mongo — authorization still goes through
 * JWTStrategy.verifyPrivileges, which re-checks permissions from the DB on
 * every request regardless of which strategy authenticated.
 */
export class JWTOidcStrategy extends AuthStrategy {
    async verifyUser(payload: any) {
        try {
            logger.debug('[jwt-oidc verify] ' + LoggerClass.objectToString(payload))
            if (!payload?.id) throw new Error('unauthorized')
            return { id: payload.id, email: payload.email }
        }
        catch (e) {
            logger.error('[jwt-oidc verify] error' + e.message)
            return false
        }
    }

    getAuthCallBack() {
        return async (payload: any, done: any) => {
            try {
                const user = await this.verifyUser(payload)
                return done(null, user)
            }
            catch (e) {
                logger.debug('[jwt-oidc] problem occured during the verification process')
                return done(e, false)
            }
        }
    }
}

const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKeyProvider: jwksRsa.passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${issuer}/jwks`,
    }),
    audience,
    issuer,
    algorithms: ['RS256'],
}

export const jwtOidcStrategyInstance = new JWTOidcStrategy(options, userRepository, passport)
export default jwtOidcStrategyInstance.getStrategy()
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd /home/bcsaban1/ownProjects/expressApp && TS_NODE_PROJECT=tsconfig.test.json node --loader ts-node/register ./node_modules/.bin/mocha src/providers/auth/jwtOidcStrategy.spec.ts`

Expected: PASS, all tests green.

- [ ] **Step 6: Commit**

```bash
cd /home/bcsaban1/ownProjects/expressApp
git add package.json package-lock.json src/providers/auth/jwtOidcStrategy.ts src/providers/auth/jwtOidcStrategy.spec.ts
git commit -m "Add jwt-oidc passport strategy for oauth-issued access tokens

Verifies RS256 tokens from the ../oauth OIDC provider via jwks-rsa,
trusting the token's id/email claims directly (no DB lookup).
Not yet wired into passport.ts / requireJwt."
```

---

### Task 2: Wire the strategy into `requireJwt`

**Files:**
- Modify: `src/providers/auth/passport.ts`
- Modify: `src/providers/auth/passport.spec.ts`
- Modify: `.env.sample`
- Modify: `.env` (gitignored — not committed, needed for manual verification in Task 3)

**Interfaces:**
- Consumes: default export of `src/providers/auth/jwtOidcStrategy.ts` (Task 1) — a configured `passport-jwt` `Strategy` instance.
- Produces: `requireJwt` (already exported from `passport.ts`, consumed unchanged by `src/routes/user.ts` and `src/routes/movie.ts`) now resolves to `passport.authenticate(['jwt', 'jwt-oidc'], { session: false })` when `OIDC_ISSUER` is set, or `passport.authenticate('jwt', { session: false })` otherwise — same shape as before (an Express middleware), so no route file changes.

- [ ] **Step 1: Update the test to cover both the configured and unconfigured cases**

Replace the full contents of `src/providers/auth/passport.spec.ts` with:

```ts
import { expect } from 'chai'
import sinon, { SinonSandbox, SinonStub } from 'sinon'
import { addPassportToAppFunction, initPassport } from './passport'

let sandbox: SinonSandbox

describe('passport', () => {
    let app: { use: SinonStub } | any
    let passport: {
        use: SinonStub,
        serializeUser: SinonStub,
        deserializeUser: SinonStub,
        authenticate: SinonStub
    } | any
    let originalOidcIssuer: string | undefined

    beforeEach(() => {
        sandbox = sinon.createSandbox()
        originalOidcIssuer = process.env.OIDC_ISSUER
        delete process.env.OIDC_ISSUER
        app = {
            use: sandbox.stub(),
        } as any
        passport = {
            use: sandbox.stub(),
            serializeUser: sandbox.stub(),
            deserializeUser: sandbox.stub(),
            authenticate: sandbox.stub()
        } as any

    })
    afterEach(() => {
        sandbox.restore()
        if (originalOidcIssuer === undefined) delete process.env.OIDC_ISSUER
        else process.env.OIDC_ISSUER = originalOidcIssuer
    })

    describe('return function of the addPassport', () => {
        it('should call the use method of app taken as parameter twice', () => {
            addPassportToAppFunction(app)
            expect(app.use.calledTwice).to.be.true
        })
    })
    describe('initPassport', () => {
        it('should set a function for serializeUser', () => {
            initPassport(passport)
            expect(passport.serializeUser.callCount).equal(1)
        })
        it('should set a function for deserializeUser', () => {
            initPassport(passport)
            expect(passport.deserializeUser.callCount).equal(1)
        })
        it('should set google authentication', () => {
            initPassport(passport)
            expect(passport.authenticate.args[0][0]).equal('google')
        })
        it('should set local authentication', () => {
            initPassport(passport)
            expect(passport.authenticate.args[1][0]).equal('local')
        })
        describe('when OIDC_ISSUER is not set', () => {
            it('should call the use method of app taken as parameter three times', () => {
                initPassport(passport)
                expect(passport.use.callCount).equal(3)
            })
            it('should set jwt authentication only', () => {
                initPassport(passport)
                expect(passport.authenticate.args[2][0]).equal('jwt')
            })
        })
        describe('when OIDC_ISSUER is set', () => {
            beforeEach(() => {
                process.env.OIDC_ISSUER = 'http://localhost:3200/oidc'
            })
            it('should call the use method of app taken as parameter four times', () => {
                initPassport(passport)
                expect(passport.use.callCount).equal(4)
            })
            it('should register the jwt-oidc strategy', () => {
                initPassport(passport)
                expect(passport.use.args[3][0]).equal('jwt-oidc')
            })
            it('should set jwt authentication to accept both strategies', () => {
                initPassport(passport)
                expect(passport.authenticate.args[2][0]).deep.equal(['jwt', 'jwt-oidc'])
            })
        })
    })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd /home/bcsaban1/ownProjects/expressApp && TS_NODE_PROJECT=tsconfig.test.json node --loader ts-node/register ./node_modules/.bin/mocha src/providers/auth/passport.spec.ts`

Expected: FAIL — the `when OIDC_ISSUER is set` tests fail (`passport.use.callCount` is `3` not `4`, `jwt-oidc` is never registered, `requireJwt` is always built from `'jwt'` alone).

- [ ] **Step 3: Update the implementation**

In `src/providers/auth/passport.ts`, add the import:

```ts
import jwtOidcStrategy from './jwtOidcStrategy'
```

(add it directly below `import jwtStrategy from './jwtStrategy'`).

Replace the jwt-strategy block inside `initPassport`:

```ts
    // add the jwt strategy which the application use to identify the users
    passport.use('jwt', jwtStrategy)
    const requireJwt = passport.authenticate('jwt', { session: false })
```

with:

```ts
    // add the jwt strategy which the application use to identify the users
    passport.use('jwt', jwtStrategy)

    // add the oidc-jwt strategy which lets the app accept access tokens
    // issued by the ../oauth OIDC provider — optional, only when configured
    let requireJwtStrategies: string | string[] = 'jwt'
    if (process.env.OIDC_ISSUER) {
        passport.use('jwt-oidc', jwtOidcStrategy)
        requireJwtStrategies = ['jwt', 'jwt-oidc']
    }
    const requireJwt = passport.authenticate(requireJwtStrategies, { session: false })
```

Nothing else in `passport.ts` changes.

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd /home/bcsaban1/ownProjects/expressApp && TS_NODE_PROJECT=tsconfig.test.json node --loader ts-node/register ./node_modules/.bin/mocha src/providers/auth/passport.spec.ts`

Expected: PASS, all tests green.

- [ ] **Step 5: Document the new env vars in `.env.sample`**

In `.env.sample`, append after the existing `JWT_SECRET=test` line:

```

# Optional: enables accepting access tokens issued by the ../oauth OIDC
# provider on requireJwt-guarded routes. Leave unset to run local-auth-only.
OIDC_ISSUER=http://localhost:3200/oidc
OIDC_AUDIENCE=urn:oauth-provider:services
```

- [ ] **Step 6: Set the same values in the local `.env`**

`.env` is gitignored (`.gitignore:77`), so this step is not part of the commit — it's needed so Task 3's manual verification can exercise the feature against the locally running `../oauth` app. Append the same two lines used in Step 5 to `.env`.

- [ ] **Step 7: Commit**

```bash
cd /home/bcsaban1/ownProjects/expressApp
git add src/providers/auth/passport.ts src/providers/auth/passport.spec.ts .env.sample
git commit -m "Accept oauth-issued access tokens on requireJwt routes

requireJwt now tries both the local 'jwt' strategy and the new
'jwt-oidc' strategy when OIDC_ISSUER is configured; falls back to
local-auth-only otherwise, so the template still works standalone."
```

(`.env` is gitignored and intentionally not staged.)

---

### Task 3: Manual end-to-end verification against the running oauth app

This is a manual QA pass, not an automated test — a real cross-service authorization_code flow needs a browser and two running processes, which is out of scope for the Mocha suite (see spec's "Explicitly out of scope"). Do this after Tasks 1 and 2 are committed.

**Files:** none (no code changes in this task).

- [ ] **Step 1: Start expressApp's MongoDB and the app itself**

Run: `cd /home/bcsaban1/ownProjects/expressApp && docker compose up -d mongo` (or however Mongo is normally started in this environment), then `npm run start:dev` in a separate terminal. Confirm `https://localhost:8000/api/doc` loads.

- [ ] **Step 2: Seed an oauth client and start the oauth app**

```bash
cd /home/bcsaban1/ownProjects/oauth
npm run seed-client   # prints client_id/client_secret — note them
npm start
```

Confirm: `curl http://localhost:3200/oidc/.well-known/openid-configuration` returns JSON.

- [ ] **Step 3: Run the authorization_code flow to get an access token**

Pick a real user's email from the `test.User` collection (must have a bcrypt `password` set — see `PRD/superpowers/specs/2026-08-17-bcrypt-password-hashing-design.md` for how those are created).

Open in a browser (substitute the `client_id` printed in Step 2):

```
http://localhost:3200/oidc/auth?client_id=<CLIENT_ID>&response_type=code&scope=openid%20profile%20permissions&redirect_uri=http://localhost:4000/cb
```

Log in with the user's email/password. The browser redirects to `redirect_uri` (doesn't need to be running) with `?code=...` — copy that value.

```bash
curl -u <CLIENT_ID>:<CLIENT_SECRET> \
  -d grant_type=authorization_code \
  -d code=<CODE_FROM_REDIRECT> \
  -d redirect_uri=http://localhost:4000/cb \
  http://localhost:3200/oidc/token
```

Copy the `access_token` field from the JSON response.

- [ ] **Step 4: Confirm expressApp accepts the oauth-issued token**

```bash
curl -k -H "Authorization: Bearer <ACCESS_TOKEN>" https://localhost:8000/api/movie/all
```

Expected: **not** a 401. Either a 200 with movie data, or a 403 `"forbidden"` if the user lacks the `movie:read` permission in `UserPermissions` — both prove the token passed authentication via `'jwt-oidc'` and only authorization (`verifyPrivileges`, backed by live Mongo data) differs.

- [ ] **Step 5: Confirm a bogus token is still rejected**

```bash
curl -k -H "Authorization: Bearer not.a.real.token" https://localhost:8000/api/movie/all
```

Expected: `401`, confirming the new strategy doesn't accept arbitrary garbage — only tokens that verify against the oauth app's JWKS.

No commit for this task (verification only).

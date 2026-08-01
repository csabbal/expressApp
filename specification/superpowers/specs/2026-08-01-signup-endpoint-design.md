# Signup Endpoint Design

## Overview

Add a local signup endpoint (`POST /api/signup/local`) that lets a new user register with a username, email, and password, and stores the resulting user in MongoDB via the existing `User` collection.

This slots into the existing layered architecture (routes → controllers → services → repositories) and reuses the existing `userRepository` — no new repository is introduced.

## Scope decisions (from brainstorming)

These were explicitly decided during design and should not be revisited without going back to the user:

- **Password hashing stays `md5`.** The existing `localStrategy.ts` hashes login passwords with `md5`, even though an unused bcrypt-based `Crypt` utility exists. Signup will match `md5` to stay consistent with login — the bcrypt migration is explicitly **out of scope** for this feature.
- **Signup does not auto-login.** It returns a confirmation of the created user (201), not a JWT. The client calls `POST /api/auth/local` separately afterward if it wants a token.
- **Route path is `/api/signup/local`**, not `/api/auth/signup` or `/api/user`. This introduces a new `signup` route group, parallel to `auth`.
- **Duplicate email/username returns `409 Conflict`**, which requires a new `ConflictError` class (only `BadRequestError`/`ServerError` exist today).
- **Validation is minimal**: presence checks on all three fields, a basic email-format regex, and a minimum password length of 8 characters. No schema-validation library (zod/joi) is introduced — that remains a separate, not-yet-done infra item per the README's Foundation Assessment.

## Architecture

New files, following the existing singleton controller/service pattern (see `UserController`/`UserService`, `AuthController`/`AuthService`):

```
src/routes/signup.ts            (new)
src/controllers/signupController.ts   (new)
src/services/signupService.ts         (new)
```

Modified files:

```
src/routes/index.ts             — mount signupRouter at /signup
src/entities/User.schema.ts     — googleId becomes optional
src/utils/error/Error.ts        — add ConflictError class + errorHandlerMiddleware branch
```

Reused, unmodified:

```
src/repositories/User.repository.ts / userRepository export
src/types/User.ts (UserEntity — already has password/googleId as optional)
```

## Request / Response contract

**Request**

```
POST /api/signup/local
Content-Type: application/json

{
  "username": "jdoe",
  "email": "jdoe@example.com",
  "password": "s3cretpw"
}
```

**Success — 201**

```json
{
  "id": "…uuid…",
  "name": "jdoe",
  "email": "jdoe@example.com"
}
```

Password is never included in the response.

**Validation failure — 400** (`BadRequestError`, existing class)

- Any of `username`, `email`, `password` missing or empty
- `email` fails a basic format regex
- `password` shorter than 8 characters

**Duplicate — 409** (`ConflictError`, new class)

- A user with the same `name` (username) already exists
- A user with the same `email` already exists

## Data flow (`SignupService.signup`)

1. Validate the three fields; throw `BadRequestError` with a descriptive message on the first failure.
2. `userRepository.findOne({ name: username })` — if found, throw `ConflictError('username already taken')`.
3. `userRepository.findOne({ email })` — if found, throw `ConflictError('email already registered')`.
4. Hash the password: `md5(password)` (matches `localStrategy.ts`'s existing comparison logic).
5. Build and persist the new user via `userRepository.create(...)`:
   ```ts
   {
     id: uuidv4(),
     name: username,
     email,
     password: hashedPassword,
     fullName: username,   // UserEntity requires fullName; no separate input is collected, so it defaults to username
     jwtSecureCode: uuidv4()
   }
   ```
6. Strip `password` (and `jwtSecureCode`) from the created record before returning it to the controller.

`SignupController.signup` wraps this in the standard try/catch → `next(e)` pattern used by every other controller, and responds `res.status(201).json(user)` on success.

## Error handling

Add to `src/utils/error/Error.ts`:

```ts
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

`errorHandlerMiddleware` gets an added branch:

```ts
if (err instanceof BadRequestError) {
    err.sendJSONResponse(res)
} else if (err instanceof ConflictError) {
    err.sendJSONResponse(res)
} else {
    ...
}
```

## Schema change

`src/entities/User.schema.ts`: `googleId` is currently `required: true`, which would reject any locally-signed-up user (no `googleId`). Change to match `UserEntity.googleId?: string`:

```ts
googleId: {
    type: String
},
```

No other schema changes. `email`/`name` are not given a MongoDB-level `unique` index in this pass — uniqueness is enforced at the application layer only (step 2/3 above), consistent with how the rest of the app currently relies on service-layer checks rather than DB constraints. A theoretical race condition (two concurrent signups with the same email) is accepted as a known, minor gap rather than expanded scope.

## Testing

Unit tests (Mocha + Sinon + Chai), following the existing pattern in `userService.spec.ts` / `authService.spec.ts`:

**`signupService.spec.ts`**
- Successful signup returns a user without `password`/`jwtSecureCode`
- Missing/empty `username`, `email`, or `password` → `BadRequestError`
- Malformed email → `BadRequestError`
- Password under 8 characters → `BadRequestError`
- Existing username → `ConflictError`
- Existing email → `ConflictError`

**`signupController.spec.ts`**
- Delegates to `SignupService.signup` and responds `201` with its result
- Passes thrown errors to `next`

No integration/E2E tests — the app has none today (flagged as a separate gap in the README's Foundation Assessment), so this stays consistent with existing test scope.

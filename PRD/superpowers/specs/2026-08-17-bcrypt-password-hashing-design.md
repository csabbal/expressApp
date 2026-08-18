# Design: bcrypt password hashing cutover

## Context

`expressApp` currently hashes local-auth passwords with `md5` in two places:

- `signupService.createUser` — hashes the password on signup.
- `localStrategy.checkExistingUserByProfile` — re-hashes the submitted password and
  matches it directly in the Mongo query (`findOne({ name, password: md5(password) })`).

This is part of a larger effort: the `oauth` project (a separate OIDC/OAuth2
authorization server) reads from the same `User` collection and checks
`User.password` with `bcrypt.compare`. Any user created via `expressApp`'s
signup today would never be able to log in through the OAuth server, because
`bcrypt.compare` against an md5 hash always returns `false`. This spec covers
making `expressApp` itself bcrypt-only; a later, separate sub-project wires up
the OAuth server's signup page to call `expressApp`'s signup API.

`expressApp` already has a working bcrypt utility, `utils/Crypt.ts` (exported
as a singleton `crypt`, with `hashValue`/`checkValue`), already used
successfully for `jwtSecureCode` handling in `jwtStrategy.ts`. This work reuses
it rather than adding a new dependency.

## Decision: no migration path for existing users

md5 is a one-way hash, so an existing md5 hash cannot be converted to a bcrypt
hash without the original plaintext password. The only two real options were
a lazy rehash-on-login (try bcrypt, fall back to md5, rehash on success) or a
hard cutover with no bridge.

**Decision: hard cutover, no bridge.** After this change, any user whose
`User.password` is still an md5 hash cannot log in via the local strategy —
there is no fallback check and no in-app recovery. This is accepted for now
because there's no self-service password-reset flow to send those users to
yet (building one, with email delivery, is its own separate sub-project, not
started). Acceptable given the small/non-production user base at this stage.

Out of scope for this spec: any password-reset flow, any bulk-migration
script, any changes to the Google or JWT strategies.

## Changes

### `src/services/signupService.ts`

Replace:

```ts
const hashedPassword = md5(data.password)
```

with:

```ts
const hashedPassword = await crypt.hashValue(data.password)
```

using the existing `crypt` singleton from `utils/Crypt.ts` (same import
pattern as `jwtStrategy.ts`). Drop the `md5` import. `createUser` is already
`async`, so the extra `await` requires no signature change.

### `src/providers/auth/localStrategy.ts`

The current query-with-hashed-password-in-the-filter pattern can't work with
bcrypt, since bcrypt salts each hash differently — the same password produces
a different hash every time, so it can't be matched inside a Mongo query.

Replace:

```ts
async checkExistingUserByProfile(profile: { username: string, password: string }): Promise<UserEntity> {
  return await this.userRepository.findOne({ name: profile.username, password: md5(profile.password) })
}
```

with a two-step lookup-then-compare, mirroring the pattern already used in
`oauth/src/routes/interactions.js`:

```ts
async checkExistingUserByProfile(profile: { username: string, password: string }): Promise<UserEntity> {
  const user = await this.userRepository.findOne({ name: profile.username })
  if (!user?.password) return undefined
  const isMatch = await crypt.checkValue(profile.password, user.password)
  return isMatch ? user : undefined
}
```

Drop the `md5` import. `getAuthCallBack` in this class already does
`done(null, user)` with whatever `checkExistingUserByProfile` returns, and
passport-local already treats a falsy user as an authentication failure — so
returning `undefined` on a no-match preserves current failure behavior
unchanged.

### `package.json`

`md5` becomes unused (only these two files and their specs reference it) —
remove the dependency once the specs below are updated.

## Testing

- `src/services/signupService.spec.ts` — currently asserts the created user's
  password equals `md5('longenoughpw')`. Update to assert `crypt.hashValue`
  is called with the plaintext password (mock/stub `crypt`), and that the
  created user's password is whatever the (mocked) `hashValue` returned.
- `src/providers/auth/localStrategy.spec.ts` — currently builds a profile with
  `password: md5(profile.password)` and asserts a direct-filter `findOne`
  call. Update to assert `findOne` is called with `{ name: profile.username }`
  only, and that `crypt.checkValue` is called with the plaintext password and
  the stored hash; cover both the match and no-match cases.

## Explicitly out of scope

- Password-reset / forgot-password flow (separate future sub-project).
- Any migration or dual-read fallback for existing md5-hashed users.
- Changes to Google OAuth or JWT strategies.
- The OAuth server's signup page/integration (separate next sub-project, in
  the `oauth` repo, depends on this one being done first).

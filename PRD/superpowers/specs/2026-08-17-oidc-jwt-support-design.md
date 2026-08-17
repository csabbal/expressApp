# Design: accept OIDC-issued (oauth app) access tokens alongside local JWTs

## Context

`expressApp`'s protected routes (`requireJwt`, used in `user.ts` and
`movie.ts`) only accept JWTs the app itself issues: HS256, signed with the
static `JWT_SECRET` env var, verified by `passport-jwt`'s `'jwt'` strategy
(`src/providers/auth/jwtStrategy.ts`).

The separate `../oauth` project is a real OIDC/OAuth2 authorization server
(`oidc-provider` + `jose`) that reads from the same `test` Mongo database
(`User`/`UserPermissions` collections, read-only) and issues its own access
tokens: **RS256**, signed with an ephemeral keypair exposed via a JWKS
endpoint (`oauth/src/oidc/jwks.js`), audience-bound to
`urn:oauth-provider:services` (`oauth/src/oidc/configuration.js`,
`RESOURCE_INDICATOR`), carrying `id`, `email`, and `permissions` as extra
claims on every access token (`extraTokenClaims`).

Presenting an oauth-issued token to expressApp today fails with a bare 401:
`passport-jwt`'s `Strategy.authenticate()` runs `jsonwebtoken.verify()`
*before* calling into any app code, so an RS256 token fails signature
verification against the HS256 `JWT_SECRET` and the request is rejected
before `jwtStrategy.ts`'s own `verifyUser`/logging ever run. This spec adds a
second strategy that can verify those tokens, so a client holding a valid
oauth-issued access token can call expressApp's API directly.

## Decisions

**Dual-strategy, not a replacement.** Local login (`/auth/local`) and local
JWT issuance (`generateJWT` in `jwtStrategy.ts`) are unchanged. `requireJwt`
accepts *either* a local JWT or an oauth-issued token — whichever
`passport.authenticate([...])` strategy array succeeds first grants access.

**Trust the oauth token's claims directly — no local user lookup.** Unlike
the local strategy (which re-fetches the user from Mongo and checks a
rotating `jwtSecureCode` for revocation), the new strategy's `verifyUser`
does no DB read: it only requires `payload.id` to be present and returns
`{ id: payload.id, email: payload.email }`. `verifyPrivileges` (unchanged,
still bound to the local `jwtStrategyInstance` and used identically in
routes) already re-fetches permissions fresh from
`userPermissionsRepository` on every request regardless of which strategy
authenticated — it only reads `req.user.id` — so authorization is never
based on stale/trusted token claims even though authentication is.

Trade-off accepted: a user deleted from Mongo after a token was issued keeps
API access until that (short-lived) oauth access token expires. No local
revocation hook exists for oauth-issued tokens. Out of scope for this spec —
would require either a DB lookup (rejected above for the extra round trip)
or a token-revocation/introspection integration with the oauth app.

**Conditional registration.** `expressApp` is a reusable template
(`CLAUDE.md`) cloned by projects that won't necessarily run the `oauth` app.
The `'jwt-oidc'` strategy is only registered when `OIDC_ISSUER` is set;
`requireJwt` falls back to local-only auth otherwise. This keeps the
template working standalone with no new required config.

**JWKS fetching via `jwks-rsa`.** Standard `passport-jwt` companion library
(`jwksRsa.passportJwtSecret`) — fetches and caches the signing key from the
oauth app's JWKS endpoint by the token's `kid` header, so key rotation on the
oauth side doesn't break expressApp. New dependency: `jwks-rsa`.

## Changes

### `package.json`

Add dependency: `jwks-rsa`.

### `.env.sample` / `.env`

Add, documented as optional:

```
# Optional: enables accepting access tokens issued by the ../oauth OIDC
# provider on requireJwt-guarded routes. Leave unset to run local-auth-only.
OIDC_ISSUER=http://localhost:3200/oidc
OIDC_AUDIENCE=urn:oauth-provider:services
```

(`OIDC_ISSUER` matches the oauth app's own `ISSUER` env var; the JWKS
endpoint is `${OIDC_ISSUER}/jwks`, oidc-provider's default `jwks` route
mounted under `/oidc`. `OIDC_AUDIENCE` matches oauth's `RESOURCE_INDICATOR`
constant in `oauth/src/oidc/configuration.js`.)

### New file: `src/providers/auth/jwtOidcStrategy.ts`

Follows the same pattern as every other strategy in this codebase
(`googleStrategy.ts`, `localStrategy.ts`, `jwtStrategy.ts`): a class
extending `AuthStrategy`, exported as
`new JWTOidcStrategy(options, userRepository, passport).getStrategy()`.
`userRepository` is threaded through only because `AuthStrategy`'s
constructor requires it (unused by this strategy's `verifyUser`), matching
`CustomGoogleStrategy`'s existing empty-subclass-for-consistency precedent.

```ts
import dotenv from 'dotenv'
import passport, { ExtractJwt } from 'passport-jwt'
import jwksRsa from 'jwks-rsa'
import { userRepository } from '../../repositories/index'
import AuthStrategy from './authStrategy'
import { logger, LoggerClass } from '../../utils/logger/logger'
dotenv.config()

const { OIDC_ISSUER: issuer, OIDC_AUDIENCE: audience } = process.env

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

`verifyUser` throws (caught, logged, returns `false`) rather than returning
`false` directly for a missing `id`, mirroring `jwtStrategy.ts`'s existing
try/catch shape.

### `src/providers/auth/passport.ts`

```ts
import jwtOidcStrategy, { jwtOidcStrategyInstance } from './jwtOidcStrategy'
```

Inside `initPassport`, after the existing `'jwt'` registration:

```ts
    // add the oidc-jwt strategy which lets the app accept access tokens
    // issued by the ../oauth OIDC provider — optional, only when configured
    let requireJwtStrategies: string | string[] = 'jwt'
    if (process.env.OIDC_ISSUER) {
        passport.use('jwt-oidc', jwtOidcStrategy)
        requireJwtStrategies = ['jwt', 'jwt-oidc']
    }
    const requireJwt = passport.authenticate(requireJwtStrategies, { session: false })
```

No other route or middleware changes — `user.ts` and `movie.ts` keep
importing `requireJwt` exactly as today.

## Testing

New `src/providers/auth/jwtOidcStrategy.spec.ts`, colocated and structured
like the existing `jwtStrategy.spec.ts` (Mocha/Sinon/Chai):

- `verifyUser` with a payload containing `id` and `email` → resolves to
  `{ id, email }`.
- `verifyUser` with a payload missing `id` → resolves to `false`, no
  throw escapes.
- `getAuthCallBack()`'s returned function calls `done(null, user)` on a
  valid payload and `done(err, false)` when `verifyUser` fails.

No integration test against a live oauth app / real JWKS endpoint — out of
scope for this spec (would need `jwks-rsa`'s test doubles or a running oauth
instance; local unit coverage of `verifyUser` is sufficient given
`passport-jwt` + `jwks-rsa` themselves are trusted, already-tested
libraries).

## Explicitly out of scope

- Any change to local JWT issuance, `/auth/local`, `/auth/google`, or
  `generateJWT`.
- Revocation of oauth-issued tokens before their natural expiry (see
  trade-off above).
- Validating token `scope`/`permissions` claims directly — authorization
  continues to go through `verifyPrivileges`'s live DB check exclusively.
- Any change to `movie.ts`/`user.ts` route definitions beyond what
  `requireJwt` already resolves to.
- Introspection-endpoint-based verification (opaque tokens) — the oauth app
  is configured to always issue JWT access tokens
  (`accessTokenFormat: 'jwt'` in `oauth/src/oidc/configuration.js`), so
  local JWKS verification is sufficient.

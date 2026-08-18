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
            return { id: payload.id, email: payload.email, permissions: payload.permissions }
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

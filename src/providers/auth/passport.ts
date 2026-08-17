import dotenv from 'dotenv'
import { Application } from 'express'
import passport from 'passport'
import googleStrategy from './googleStrategy'
import localStrategy from './localStrategy'
import jwtStrategy from './jwtStrategy'
import jwtOidcStrategy from './jwtOidcStrategy'
import session from 'express-session'
dotenv.config()

export function initPassport(passport: passport.PassportStatic) {
    // add the google authentication strategy which could be used to login the users
    passport.use('google', googleStrategy)
    const requireGoogleAuth = passport.authenticate('google', { scope: ['profile', 'email'], session: false })

    // add the local authentication strategy which could be used to login the users
    passport.use('local', localStrategy)
    const requireLocalAuth = passport.authenticate('local', {})

    // add the jwt strategy which the application use to identify the users
    passport.use('jwt', jwtStrategy)

    // add the oidc-jwt strategy which lets the app accept access tokens
    // issued by the ../oauth OIDC provider — optional, only when configured
    let requireJwtStrategies: string | string[] = 'jwt'
    if (process.env.OIDC_ISSUER) {
        if (!process.env.OIDC_AUDIENCE) {
            throw new Error('OIDC_AUDIENCE must be set when OIDC_ISSUER is configured')
        }
        passport.use('jwt-oidc', jwtOidcStrategy)
        requireJwtStrategies = ['jwt', 'jwt-oidc']
    }
    const requireJwt = passport.authenticate(requireJwtStrategies, { session: false })

    // add function to serialize the user
    passport.serializeUser((user, done) => {
        done(null, user)
    })

    // add function to deserialize the user
    passport.deserializeUser((user, done) => {
        done(null, user)
    })

    return { requireGoogleAuth, requireLocalAuth, requireJwt }

}

// initialize the passport, add that to the application
export function addPassport(passport: passport.PassportStatic, jwtSecret: string) {
    return function (app: Application) {
        app.use(session({ secret: jwtSecret, resave: false, saveUninitialized: false, }))
        app.use(passport.initialize())
    }
}

export const { requireGoogleAuth, requireLocalAuth, requireJwt } = initPassport(passport)
export const addPassportToAppFunction = addPassport(passport, process.env.JWT_SECRET as string)
export default passport



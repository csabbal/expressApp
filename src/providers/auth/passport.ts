import dotenv from 'dotenv';
import { Application } from 'express';
import passport from 'passport';
import googleStrategy from './googleStrategy';
import localStrategy from './localStrategy';
import jwtStrategy from './jwtStrategy';
import session from 'express-session';

dotenv.config();
const { JWT_SECRET: jwtSecret } = process.env

passport.use('google', googleStrategy);
const googleOptions = { scope: ['profile', 'email'], session: false }
export const requireGoogleAuth = passport.authenticate('google', googleOptions)

passport.use('local', localStrategy);
const localOptions = { failureRedirect: '/login',failWithError:true }
export const requireLocalAuth = passport.authenticate('local', localOptions)

passport.use('jwt', jwtStrategy);
export const requireJwt = passport.authenticate('jwt', { session: false});

export function initPassport(app:Application){
    app.use(session({ secret: jwtSecret, resave: false, saveUninitialized: false, }));
    app.use(passport.initialize())
}

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});


export default passport;



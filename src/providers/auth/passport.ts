import dotenv from 'dotenv';
import { Application } from 'express';
import passport from 'passport';
import googleStrategy from './googleStrategy';
import localStrategy from './localStrategy';
import jwtStrategy from './jwtStrategy';
import session from 'express-session';

dotenv.config();
const { JWT_SECRET: jwtSecret } = process.env

// add the google authentication strategy which could be used to login the users
passport.use('google', googleStrategy);
export const requireGoogleAuth = passport.authenticate('google', { scope: ['profile', 'email'], session: false })

// add the local authentication strategy which could be used to login the users
passport.use('local', localStrategy);
export const requireLocalAuth = passport.authenticate('local', {})

// add the jwt strategy which the application use to identify the users
passport.use('jwt', jwtStrategy);
export const requireJwt = passport.authenticate('jwt', { session: false });

// initialize the passport, add that to the application
export function initPassport(app: Application) {
    app.use(session({ secret: jwtSecret, resave: false, saveUninitialized: false, }));
    app.use(passport.initialize())
}

// add function to serialize the user
passport.serializeUser((user, done) => {
    done(null, user);
});

// add function to deserialize the user
passport.deserializeUser((user, done) => {
    done(null, user);
});


export default passport;



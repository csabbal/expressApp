import dotenv from 'dotenv';
import express, { Application } from 'express';
import passport from 'passport';
import googleStrategy from './googleStrategy';
import jwtStrategy from './jwtStrategy';
import app from '../../index';
import session from 'express-session';

dotenv.config();
const { JWT_SECRET: jwtSecret } = process.env

passport.use('google', googleStrategy);
passport.use('jwt', jwtStrategy);

export const requireJwt = passport.authenticate('jwt', { session: false});
export function initPassport(app:Application){
    app.use(session({ secret: jwtSecret, resave: false, saveUninitialized: false, }));
    app.use(passport.initialize())
}


export default passport;



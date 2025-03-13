import { Strategy, ExtractJwt, VerifiedCallback } from 'passport-jwt';
import express , { Request, Response, NextFunction } from "express";
import { UserModel } from '../../entities/User.schema'; // mock user class
import bcrypt from 'bcrypt';
import { logger, LoggerClass } from '../../utils/logger/logger';

const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET || 'test',
};


async function verify(payload: any, done: VerifiedCallback) {
    /* 
      a valid JWT in our system must have `id` and `jwtSecureCode`.
      you can create your JWT like the way you like.
    */

    logger.info('[jwt verify] ' + LoggerClass.objectToString(payload))

    // bad path: JWT is not valid
    if (!payload?.id || !payload?.jwtSecureCode) {
        return done(null, false);
    }

    // try to find a User with the `id` in the JWT payload.
    const user = await UserModel.findOne({
            id: payload.id,
    });

    // bad path: User is not found.
    if (!user) {
        return done(null, false);
    }

    // compare User's jwtSecureCode with the JWT's `jwtSecureCode` that the 
    // request has.
    // bad path: bad JWT, it sucks.
    if (!bcrypt.compareSync(user.jwtSecureCode, payload.jwtSecureCode)) {
        return done(null, false);
    }

    // happy path: JWT is valid, we auth the User.
    return done(null, user);
}

export default new Strategy(options, verify);
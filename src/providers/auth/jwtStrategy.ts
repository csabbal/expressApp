import { Strategy, ExtractJwt, VerifiedCallback } from 'passport-jwt';
import { checkValue } from '../../utils/Crypt'
import { loggedMethod, logger, LoggerClass } from '../../utils/logger/logger';
import userRepository from '../../repositories/User.repository';
import { hashValue } from '../../utils/Crypt'
import jwt from 'jsonwebtoken'
import { UserEntity } from '../../types/User';
const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET || 'test',
};

/**
 * We have to validate the taken payload in more steps
 * 1. step: checking the payload 
 * 2. step: checking the user exists or not based on the id
 * 3. step: checking the given jwtSecureCode is the same what belongs to the user
 * @param payload given data
 * @param done 
 * @returns returns of the verifiedCallback function
 */
async function verify(payload: any, done: VerifiedCallback) {
    try {
        logger.debug('[jwt verify] ' + LoggerClass.objectToString(payload))
        if (!payload?.id || !payload?.jwtSecureCode) throw new Error('unauthorized')

        const user = await userRepository.findOne({ id: payload.id })
        if (!user) throw new Error('unauthorized')

        const isMatch = checkValue(user.jwtSecureCode, payload.jwtSecureCode)
        logger.debug('[jwt verify] checkValue ' + LoggerClass.objectToString([user.jwtSecureCode, payload.jwtSecureCode, isMatch]))
        if (!isMatch) throw new Error('unauthorized')

        logger.debug('[auth] user got authenticated: ' + user.id)
        return done(null, user);
    }
    catch (e) {
        logger.debug('[auth] problem occured during the verification process')
        return done(null, false);
       
    }
}


export async function generateJWT(user:UserEntity,rights:string[],jwtSecret:string) {
    const jwtData = {
      expiresIn: '12h',
      id: user.id,
      email: user.email,
      rights:rights,
      jwtSecureCode: await hashValue(user.jwtSecureCode)
    }
    return jwt.sign(jwtData, jwtSecret)
  }

export default new Strategy(options, verify);
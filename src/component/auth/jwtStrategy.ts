import { Strategy, ExtractJwt, VerifiedCallback } from 'passport-jwt';
import { UserModel } from '../../entities/User.schema';
import { checkValue } from '../../utils/Crypt'
import { logger, LoggerClass } from '../../utils/logger/logger';

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
    logger.info('[jwt verify] ' + LoggerClass.objectToString(payload))
    let successfulVerification = true
    if (!payload?.id || !payload?.jwtSecureCode) successfulVerification = false

    const user = await UserModel.findOne({ id: payload.id })
    if (!user) successfulVerification = false

    const isMatch = checkValue(user.jwtSecureCode, payload.jwtSecureCode)
    if (!isMatch) successfulVerification = false

    if (!successfulVerification) {
        logger.info('[auth] problem occured during the verification process')
        return done(null, false);
    }

    logger.info('[auth] user got authenticated: ' + user.id)
    return done(null, user);
   
}

export default new Strategy(options, verify);
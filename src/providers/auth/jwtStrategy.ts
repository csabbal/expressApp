import { Strategy, ExtractJwt, VerifiedCallback } from 'passport-jwt';
import { Request, Response,  NextFunction } from 'express'
import { AppRequest } from '../../types/CustomExpress'
import { checkValue } from '../../utils/Crypt'
import { logger, LoggerClass } from '../../utils/logger/logger';
import userRepository from '../../repositories/User.repository';
import { hashValue } from '../../utils/Crypt'
import jwt from 'jsonwebtoken'
import { UserEntity } from '../../types/User';
import { PermissionEntity } from '../../types/Permission';
import userPermissionsRepository from '../../repositories/UserPermissions.repository';
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
 * @returns returns of the verifiedCallback function
 */
async function verifyUser(payload: any) {
    try {
        logger.debug('[jwt verify] ' + LoggerClass.objectToString(payload))
        if (!payload?.id || !payload?.jwtSecureCode) throw new Error('unauthorized')

        const user = await userRepository.findOne({ id: payload.id })
        if (!user) throw new Error('unauthorized')

        const isMatch = checkValue(user.jwtSecureCode, payload.jwtSecureCode)
        logger.debug('[jwt verify] checkValue ' + LoggerClass.objectToString([user.jwtSecureCode, payload.jwtSecureCode, isMatch]))
        if (!isMatch) throw new Error('unauthorized')

        return user
    }
    catch (e) {
        return false

    }
}

export  function verifyPrivileges(neededPrivileges: { component: string, privilege: string }[]):any {

    return async function(req: Request, res:Response, next:NextFunction):Promise<void>{
        const appRequest = req as AppRequest
        if (!appRequest.user) throw new Error('forbidden')
            const user = appRequest.user
            const userPermissions = (await userPermissionsRepository.findOne({userId:user.id}))?.permissions ?? []
            const isGranted = neededPrivileges.every(neededPriv=>userPermissions.some(it=>[neededPriv.component,'all'].includes(it.component) && neededPriv.privilege === it.privilege))
            if(isGranted){
                next()
            }
            else{
                res.status(403).json('forbidden')
            }
    }
}

export async function generateJWT(user: UserEntity, permissions: PermissionEntity[], jwtSecret: string) {
    const jwtData = {
        expiresIn: '12h',
        id: user.id,
        email: user.email,
        permissions: permissions,
        jwtSecureCode: await hashValue(user.jwtSecureCode)
    }
    return jwt.sign(jwtData, jwtSecret)
}

/**
 * @param payload given data
 * @param done callback which will be called after the checking user
 * @returns returns of the verifiedCallback function
 */
async function verifyCallback(payload: any, done: VerifiedCallback) {
    try {
        const user = await verifyUser(payload)
        return done(null, user)
    }
    catch (e) {
        logger.debug('[auth] problem occured during the verification process')
        return done(null, false);

    }
}

export default new Strategy(options, verifyCallback);
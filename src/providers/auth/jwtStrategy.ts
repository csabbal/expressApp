import dotenv from 'dotenv'
import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import passport, { ExtractJwt, VerifiedCallback } from 'passport-jwt'
import { userPermissionsRepository, userRepository } from '../../repositories/index'
import { IUserPermissionsRepository, IUserRepository } from '../../types/repositories'
import { AppRequest } from '../../types/CustomExpress'
import { Permission, PermissionEntity } from '../../types/Permission'
import { UserEntity } from '../../types/User'
import crypt from '../../utils/Crypt'
import { logger, LoggerClass } from '../../utils/logger/logger'
import AuthStrategy from './authStrategy'
dotenv.config()
const { JWT_SECRET: jwtSecret } = process.env
export class JWTStrategy extends AuthStrategy {
    constructor(
        protected options: any,
        protected userRepository: IUserRepository,
        protected userPermissionsRepository: IUserPermissionsRepository,
        protected passport: any = passport,
        protected jwtHandler: any,
        protected crypt: any,
        protected jwtSecret: string
    ) {
        super(options, userRepository, passport)
    }

    /**
     * This function is to validate the taken payload in more steps
     * 1. step: checking the payload 
     * 2. step: checking the user exists or not based on the id
     * 3. step: checking the given jwtSecureCode is the same what belongs to the user
     * @param payload given data
     * @returns returns of the verifiedCallback function
     */
    async verifyUser(payload: any) {
        try {
            logger.debug('[jwt verify] ' + LoggerClass.objectToString(payload))
            if (!payload?.id || !payload?.jwtSecureCode) throw new Error('unauthorized')

            const user = await this.userRepository.findOne({ id: payload.id })
            if (!user) throw new Error('unauthorized')

            const isMatch = this.crypt.checkValue(user.jwtSecureCode, payload.jwtSecureCode)
            const toBeLoggedData = LoggerClass.objectToString([user.jwtSecureCode, payload.jwtSecureCode, isMatch])
            logger.debug('[jwt verify] checkValue ' + toBeLoggedData)
            if (!isMatch) throw new Error('unauthorized')
            return user
        }
        catch (e) {
            logger.error('[jwt verify] error' + e.message)
            return false
        }
    }

    /**
     * This function returns with a middleware which can check whether the given user's permissions
     * allowes the user to reach the given endpoint or not
     * @param {Permission[]} neededPrivileges 
     * @returns 
     */
    verifyPrivileges(neededPrivileges: Permission[]): any {
        return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
            const appRequest = req as AppRequest
            if (!appRequest.user) throw new Error('forbidden')
            const user = appRequest.user
            const userPermissionsData = await this.userPermissionsRepository.findOne({ userId: user.id })
            const userPermissions = userPermissionsData?.permissions ?? []
            const isGranted = neededPrivileges.every(
                neededPriv => userPermissions.some(
                    (it: PermissionEntity) =>
                        [neededPriv.component, 'all'].includes(it.component) && neededPriv.privilege === it.privilege
                )
            )
            if (isGranted) {
                next()
            }
            else {
                res.status(403).json('forbidden')
            }
        }
    }

    /**
     * This function is about to generate json web token
     * (with this token the application is able to indentify the user who sent the request)
     * 
     * @param {UserEntity }user 
     * @param {PermsiisionEntity} permissions 
     * @param {String} jwtSecret 
     * @returns 
     */
    async generateJWT(user: UserEntity, permissions: PermissionEntity[]) {
        const jwtData = {
            expiresIn: '12h',
            id: user.id,
            email: user.email,
            permissions: permissions,
            jwtSecureCode: await this.crypt.hashValue(user.jwtSecureCode)
        }
        return this.jwtHandler.sign(jwtData, this.jwtSecret)
    }

    /**
     * The callback function what can be called when a given authentication is finished and it returned profile data
     * This function call the auth strategy callback function which sets the new user or handlex the error occured
     * @returns void
     */
    getAuthCallBack() {
        /**
         * This function is able to identify the user with the verifyUser function
         * if the verification was succesful it call the verifedCallback function to handle the user
         * otherwise it hanlde the error occured
         * 
         * @param payload given data
         * @param {VerifiedCallback} done callback which will be called after the checking user
         * @returns returns of the verifiedCallback function
         */
        return async (payload: any, done: VerifiedCallback) => {
            try {
                const user = await this.verifyUser(payload)
                return done(null, user)
            }
            catch (e) {
                logger.debug('[auth] problem occured during the verification process')
                return done(e, false)

            }
        }
    }
}

const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET || 'test',
}

export const jwtStrategyInstance = new JWTStrategy(
    options,
    userRepository,
    userPermissionsRepository,
    passport,
    jwt,
    crypt,
    jwtSecret
)
export default jwtStrategyInstance.getStrategy()


import { loggedMethod } from "../utils/logger/logger"
import { jwtStrategyInstance } from '../providers/auth/jwtStrategy'
import { userPermissionsRepository } from "../repositories"
import { UserEntity } from "../types/User"
import { GenerateJwt } from "../types/Permission"
import { IUserPermissionsRepository } from "../types/repositories"

export class AuthService {
    protected static _instance: AuthService
    constructor(
        protected userPermissionRepository:IUserPermissionsRepository,
        protected generateJWT: GenerateJwt
    ){}
    /**
     * This function take care about that this class can work as a singleton
     * @returns {AutService}
     */
    static getInstance() {
        if (!this._instance) {
            this._instance = new AuthService(
                userPermissionsRepository,
                jwtStrategyInstance.generateJWT.bind(jwtStrategyInstance))
        }
        return this._instance
    }
    
    /**
     * This service method perform the needed operations after the successful login. 
     * The operation is actually is the only following one: 
     * generate a JWT based on user data and users permission and send it back to the client 
     * @param {UserEntity} user 
     * @returns {Promise<{token:string}>}
     */
    @loggedMethod('[AuthService]')
    public async callback(user:UserEntity): Promise<{token:string}> {
        const userPermissions = (await this.userPermissionRepository.findOne({userId:user.id}))
        const permissions = userPermissions ? userPermissions.permissions : [] 
        const token = await this.generateJWT(user,permissions)
        return {token}
    }
}

import { loggedMethod} from "../utils/logger/logger";
import { generateJWT } from '../providers/auth/jwtStrategy'
import dotenv from 'dotenv';
import userPermissionsRepository from "../repositories/UserPermissions.repository";
import { UserEntity } from "../types/User";
dotenv.config();
const { JWT_SECRET: jwtSecret } = process.env

export class AuthService {
    protected static _instance: AuthService;
    constructor(){}
    /**
     * This function take care about that this class can work as a singleton
     * @returns {AutService}
     */
    static getInstance() {
        if (!this._instance) {
            this._instance = new AuthService()
        }
        return this._instance
    }
    
    /**
     * This service method perform the needed operations after the successful login. 
     * The operation is actually is the only following one: 
     * generate a JWT based on user data and users permission and send it back to the client 
     * @param {UserEntity} user 
     * @returns 
     */
    @loggedMethod('[AuthService]')
    public async callback(user:UserEntity): Promise<{token:string}> {
        const userPermissions = (await userPermissionsRepository.findOne({userId:user.id}))
        const permissions = userPermissions ? userPermissions.permissions : [] 
        const token = await generateJWT(user,permissions,jwtSecret);
        return {token}
    }
}

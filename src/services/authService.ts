import { loggedMethod} from "../utils/logger/logger";
import { generateJWT } from '../providers/auth/jwtStrategy'
import dotenv from 'dotenv';
import userPermissionsRepository from "../repositories/UserPermissions.repository";
import { permission } from "process";
import { UserEntity } from "../types/User";
dotenv.config();
const { JWT_SECRET: jwtSecret } = process.env

export class AuthService {
    protected static _instance: AuthService;
    constructor(){}
    static getInstance() {
        if (!this._instance) {
            this._instance = new AuthService()
        }
        return this._instance
    }
    
    @loggedMethod('[AuthService]')
    public async callback(user:UserEntity): Promise<{token:string}> {
        const userPermissions = (await userPermissionsRepository.findOne({userId:user.id}))
        const permissions = userPermissions ? userPermissions.permissions : [] 
        const token = await generateJWT(user,permissions,jwtSecret);
        return {token}
    }
}

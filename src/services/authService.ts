import { loggedMethod} from "../utils/logger/logger";
import { generateJWT } from '../providers/auth/jwtStrategy'
import dotenv from 'dotenv';
import permissionRepository from "../repositories/Permisssion.repository";
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
        const permissions = (await permissionRepository.findOne({userId:user.id}))
        const rights = permissions ? permissions.rights : [] 
        const token = await generateJWT(user,rights,jwtSecret);
        return {token}
    }
}

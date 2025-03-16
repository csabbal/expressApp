import { User } from "../types/User";
import { loggedMethod} from "../utils/logger/logger";
import dotenv from 'dotenv';
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
    public async callback(user:User): Promise<{token:string}> {
        const token = await user.generateJWT(jwtSecret);
        return {token}
    }
}

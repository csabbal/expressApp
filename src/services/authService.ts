import { User } from "../types/User";
import  {UserModel} from '../entities/User.schema'
import { loggedMethod, logger, LoggerClass } from "../utils/logger/logger";

const options = {
    clientID: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL: `${process.env.BE_BASE_URL}/api/auth/callback`,
  };

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
    public async auth(): Promise<void> {
        logger.info('params'+LoggerClass.objectToString(options))
    }

    @loggedMethod('[AuthService]')
    public async callback(data:{ id: string, jwtSecureCode: string }): Promise<void> {
        logger.info('auth ok '+LoggerClass.objectToString(data))
    }
}

import { User } from "../types/User";
import { logger } from "../utils/logger/logger";

export class UserService {
    protected static _instance: UserService;
    constructor(){}
    static getInstance() {
        if (!this._instance) {
            this._instance = new UserService()
        }
        return this._instance
    }
    getAllUsers(): Promise<User[]> {
        logger.info('[UserService][getAllUsers] called' )
        return Promise.resolve([{ id: '1', name: 'John Doe' }])
    }
}

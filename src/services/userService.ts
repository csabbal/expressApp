import { User } from "../types/User";

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
        return Promise.resolve([{ id: '1', name: 'John Doe' }])
    }
}

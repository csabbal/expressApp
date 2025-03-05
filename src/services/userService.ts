import { AppDataSource } from "../component/data/data-source";
import { User } from "../types/User";
import {User as UserEntity} from '../entities/User.entity'
import { loggedMethod } from "../utils/logger/logger";

export class UserService {
    protected static _instance: UserService;
    constructor(){}
    static getInstance() {
        if (!this._instance) {
            this._instance = new UserService()
        }
        return this._instance
    }
    @loggedMethod('[UserService]')
    public async getAllUsers(): Promise<UserEntity[]> {
        const users = await AppDataSource.getRepository(UserEntity).find()
        return users
    }
    @loggedMethod('[UserService]')
    public async throwError(): Promise<void> {
        throw new Error('somehting went wrong')
    }
}

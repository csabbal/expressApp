import { User, UserEntity } from "../types/User";
import  {UserModel} from '../entities/User.schema'
import { loggedMethod } from "../utils/logger/logger";
import userRepository from "../repositories/User.repository";

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
        const users = await userRepository.find()
        return users
    }
    @loggedMethod('[UserService]')
    public async throwError(): Promise<void> {
        throw new Error('somehting went wrong')
    }
}

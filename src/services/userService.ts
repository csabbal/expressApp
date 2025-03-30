import { UserEntity } from "../types/User"
import { loggedMethod } from "../utils/logger/logger"
import { userRepository } from "../repositories"
import { IUserRepository } from "../types/repositories"

export class UserService {
    protected static _instance: UserService
    constructor(protected userRepository:IUserRepository){}

    /**
     * getInstance function provides that this class work as a singleton
     * @returns 
     */
    static getInstance() {
        if (!this._instance) {
            this._instance = new UserService(userRepository)
        }
        return this._instance
    }
    /**
     * getAllUsers method take care about fetching all visible user data from the db
     * @returns {UserEntity} returns with all UserEntity via userRepository
     */
    @loggedMethod('[UserService]')
    public async getAllUsers(): Promise<UserEntity[]> {
        const users = await this.userRepository.find()
        return users
    }
}

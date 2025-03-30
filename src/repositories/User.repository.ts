import mongoose from 'mongoose'
import { IUserRepository } from '../types/repositories'
import { UserEntity } from '../types/User'

/**
 * This class is to take care about the handling of users in the database
 */
export class UserRepository implements IUserRepository {

    constructor(protected userModel: mongoose.Model<UserEntity>) { }

    async find(data?: Partial<UserEntity>):Promise<UserEntity[]> {
        return await this.userModel.find(data).select('id name')
    }
    async findOne(data: Partial<UserEntity>):Promise<UserEntity> {
        return await this.userModel.findOne(data)
    }

    async create(data: UserEntity):Promise<UserEntity> {
        return await this.userModel.create(data)
    }
}



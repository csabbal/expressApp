import mongoose from 'mongoose'
import { UserEntity } from '../types/User'
import { UserModel } from '../entities/User.schema'

class UserRepository {

    constructor(protected userModel: mongoose.Model<UserEntity>) { }

    async find(data?: Partial<UserEntity>):Promise<UserEntity[]> {
        return await UserModel.find(data)
    }
    async findOne(data: Partial<UserEntity>):Promise<UserEntity> {
        return await UserModel.findOne(data)
    }

    async create(data: UserEntity):Promise<UserEntity> {
        return await UserModel.create(data)
    }
}

const userRepository = new UserRepository(UserModel)
export default userRepository



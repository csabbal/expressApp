import mongoose from 'mongoose'
import { User } from '../types/User'
import { UserModel } from '../entities/User.schema'

class UserRepository {

    constructor(protected userModel: mongoose.Model<User>) { }

    async find(data: Record<keyof User, any>):Promise<User[]> {
        return await UserModel.find(data)
    }
    async findOne(data: Record<keyof User, any>):Promise<User> {
        return await UserModel.findOne(data)
    }

    async create(data: User):Promise<User> {
        return await UserModel.create(data)
    }
}


export default new UserRepository(UserModel)



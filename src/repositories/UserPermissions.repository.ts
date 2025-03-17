import mongoose from 'mongoose'
import { UserPermissionsEntity } from '../types/Permission'
import { UserPermissionsModel } from '../entities/UserPermissions.schema'

export class UserPermissionsRepository {

    constructor(protected userModel: mongoose.Model<UserPermissionsEntity>) { }

    async find(data?: Partial<UserPermissionsEntity>):Promise<UserPermissionsEntity[]> {
        return await UserPermissionsModel.find(data)
    }
    async findOne(data: Partial<UserPermissionsEntity>):Promise<UserPermissionsEntity> {
        return await UserPermissionsModel.findOne(data)
    }

    async create(data: UserPermissionsEntity):Promise<UserPermissionsEntity> {
        return await UserPermissionsModel.create(data)
    }
}

const userPermissionsRepository = new UserPermissionsRepository(UserPermissionsModel)
export default userPermissionsRepository



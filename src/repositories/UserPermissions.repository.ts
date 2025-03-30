import mongoose from 'mongoose'
import { UserPermissionsEntity } from '../types/Permission'
import { UserPermissionsModel } from '../entities/UserPermissions.schema'

/**
 * This class is to take care about the handling of user permissions in the database
 */
export class UserPermissionsRepository {

    constructor(protected userPermissionsModel: mongoose.Model<UserPermissionsEntity>) { }

    async find(data?: Partial<UserPermissionsEntity>):Promise<UserPermissionsEntity[]> {
        return await this.userPermissionsModel.find(data)
    }
    async findOne(data: Partial<UserPermissionsEntity>):Promise<UserPermissionsEntity> {
        return await this.userPermissionsModel.findOne(data)
    }

    async create(data: UserPermissionsEntity):Promise<UserPermissionsEntity> {
        return await this.userPermissionsModel.create(data)
    }
}



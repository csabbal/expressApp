import mongoose from 'mongoose'
import { PermissionEntity } from '../types/Permission'
import { PermissionModel } from '../entities/Permissions.schema'

/**
 * This class is to take care about the handling of permissions in the database
 */
export class PermissionRepository {

    constructor(protected userModel: mongoose.Model<PermissionEntity>) { }

    async find(data?: Partial<PermissionEntity>):Promise<PermissionEntity[]> {
        return await PermissionModel.find(data).select('id name')
    }
    async findOne(data: Partial<PermissionEntity>):Promise<PermissionEntity> {
        return await PermissionModel.findOne(data)
    }

    async create(data: PermissionEntity):Promise<PermissionEntity> {
        return await PermissionModel.create(data)
    }
}

const permissionRepository = new PermissionRepository(PermissionModel)
export default permissionRepository



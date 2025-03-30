import mongoose from 'mongoose'
import { PermissionEntity } from '../types/Permission'

/**
 * This class is to take care about the handling of permissions in the database
 */
export class PermissionRepository {

    constructor(protected permissionModel: mongoose.Model<PermissionEntity>) { }

    async find(data?: Partial<PermissionEntity>): Promise<PermissionEntity[]> {
        return await this.permissionModel.find(data)
    }
    async findOne(data: Partial<PermissionEntity>): Promise<PermissionEntity> {
        return await this.permissionModel.findOne(data)
    }

    async create(data: PermissionEntity): Promise<PermissionEntity> {
        return await this.permissionModel.create(data)
    }
}



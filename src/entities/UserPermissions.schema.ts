import mongoose, { Model } from 'mongoose'
import type { UserPermissionsEntity } from '../types/Permission'
import { PermissionSchema } from './Permissions.schema'

const UserPermissionsSchema = new mongoose.Schema({
  id: {
    required: true,
    type: String
  },
  userId: {
    required: true,
    type: String
  },
  permissions: {
    required: true,
    type: [PermissionSchema]
  }
})

export const UserPermissionsModel = mongoose.model<UserPermissionsEntity>('UserPermissions', UserPermissionsSchema)
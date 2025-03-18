import mongoose from 'mongoose'
import type { UserPermissionsEntity } from '../types/Permission'
import { PermissionSchema } from './Permissions.schema'

/**
 * Initialization a mongoose schema to store the connection between the users and it's permissions
 */
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
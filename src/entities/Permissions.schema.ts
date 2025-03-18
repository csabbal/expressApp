import mongoose from 'mongoose'
import { PermissionEntity } from '../types/Permission'

/**
 * Initialization a mongoose schema to store the permissions
 */
export const PermissionSchema = new mongoose.Schema({
  id: {
    required: true,
    type: String
  },
  component: {
    required: true,
    type: String
  },
  privilege: {
    required: true,
    type: String
  }
})

export const PermissionModel = mongoose.model<PermissionEntity>('Permission', PermissionSchema)
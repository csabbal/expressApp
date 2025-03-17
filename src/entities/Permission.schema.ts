import mongoose from 'mongoose'
import { PermissionEntity } from '../types/Permission'

const PermissionSchema = new mongoose.Schema({
  id: {
    required: true,
    type: String
  },
  userId: {
    required: true,
    type: String
  },
  rights: {
    required: true,
    type: Array
  }
})

export const PermissionModel = mongoose.model<PermissionEntity>('Permission', PermissionSchema)
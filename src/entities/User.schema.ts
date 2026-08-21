import mongoose from 'mongoose'
import {UserEntity } from '../types/User'
import { getConnection } from '../providers/data'

/**
 * Initialization a mongoose schema to store the user
 */
const UserSchema = new mongoose.Schema({
  id: {
    required: true,
    type: String
  },
  googleId: {
    type: String
  },
  name: {
    required: true,
    type: String
  },
  fullName: {
    type: String
  },
  email: {
    required: true,
    type: String
  },
  jwtSecureCode: {
    required: true,
    type: String
  },
  password: {
    type: String
  }
})

export const UserModel = getConnection('primary').model<UserEntity>('User', UserSchema)
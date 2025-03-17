import mongoose from 'mongoose'
import {UserEntity } from '../types/User'

const UserSchema = new mongoose.Schema({
  id: {
    required: true,
    type: String
  },
  googleId: {
    required: true,
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
  }
})

export const UserModel = mongoose.model<UserEntity>('User', UserSchema)
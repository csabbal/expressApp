import mongoose from 'mongoose'
import { User } from '../types/User'
import { logger, LoggerClass } from '../utils/logger/logger';

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
  }, 
  accessToken: {
    type: String
  }

})

export const UserModel = mongoose.model<User>('User', UserSchema)
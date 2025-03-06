import mongoose from 'mongoose'
import { User } from '../types/User'
import { logger, LoggerClass } from '../utils/logger/logger';

const UserSchema = new mongoose.Schema({
  id: {
      required: true,
      type: String
  },
  name: {
      required: true,
      type: String
  }
})

export const UserModel = mongoose.model<User>('User', UserSchema)
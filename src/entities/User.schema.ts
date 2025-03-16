import mongoose from 'mongoose'
import { User } from '../types/User'
import { hashValue } from '../utils/Crypt'
import jwt from 'jsonwebtoken'

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

UserSchema.methods = {
  generateJWT: async function (jwtSecret) {
    const jwtData = {
      expiresIn: '12h',
      id: this.id,
      email: this.email,
      jwtSecureCode: await hashValue(this.jwtSecureCode)
    }
    return jwt.sign(jwtData, jwtSecret)
  }
}

export const UserModel = mongoose.model<User>('User', UserSchema)
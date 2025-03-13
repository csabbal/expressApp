import mongoose from 'mongoose'
import jwt from 'jsonwebtoken';
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
  },

 

})


UserSchema.methods.generateJWT = function () {
  const token = jwt.sign(
    {
      expiresIn: '12h',
      id: this.googleId,
      email: this.email,
      jwtSecureCode:this.jwtSecureCode
    },
    process.env.JWT_SECRET
  );
  return token;
};

export const UserModel = mongoose.model<User>('User', UserSchema)
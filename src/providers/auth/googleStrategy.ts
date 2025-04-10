import passport from 'passport-google-oauth20'
import AuthStrategy from './authStrategy'
import {userRepository}  from '../../repositories'
import dotenv from 'dotenv'
dotenv.config()

// parameters for google authentication
const options = {
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.PROTOCOL}://${process.env.URL}:${process.env.PORT}/api/auth/google/callback`,
  proxy: true
}

/**
 * This class is descentor of authstrategy class, is to perform the Google authentication
 */
export class CustomGoogleStrategy extends AuthStrategy {}
export default new CustomGoogleStrategy(options,userRepository, passport).getStrategy()

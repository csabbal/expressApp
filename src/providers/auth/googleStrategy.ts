import { Strategy as GoogleStrategy, StrategyOptions } from 'passport-google-oauth20';
import AuthStrategy from './authStrategy';
import userRepository  from '../../repositories/User.repository';


const options = {
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.BE_BASE_URL}/api/auth/google/callback`,
  proxy: true
}

class CustomGoogleStrategy extends AuthStrategy {

  getStrategy() {
    return new GoogleStrategy(this.options, this.getAuthCallBack());
  }

}

export default new CustomGoogleStrategy(options,userRepository).getStrategy()

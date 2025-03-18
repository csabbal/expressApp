import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import AuthStrategy from './authStrategy';
import userRepository  from '../../repositories/User.repository';

// parameters for google authentication
const options = {
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.BASE_URL}/api/auth/google/callback`,
  proxy: true
}

/**
 * This class is descentor of authstrategy class, is to perform the Google authentication
 */
class CustomGoogleStrategy extends AuthStrategy {

  getStrategy() {
    return new GoogleStrategy(this.options, this.getAuthCallBack());
  }

}

export default new CustomGoogleStrategy(options,userRepository).getStrategy()

import passport from 'passport-local';
import AuthStrategy from './authStrategy';
import { userRepository } from '../../repositories';
import { logger, LoggerClass } from '../../utils/logger/logger';
import { UserEntity } from '../../types/User';
import md5 from 'md5'
const options = {
  username: 'username', // Field name for username
  password: 'password'  // Field name for password
}
/**
 * This class is descentor of authstrategy class, is to perform the local authentication
 */
export class CustomLocalStrategy extends AuthStrategy {

  async checkExistingUserByProfile(profile: { username: string, password: string }): Promise<UserEntity> {
    return await this.userRepository.findOne({ name: profile.username, password: md5(profile.password) })
  }

  /**
   * this function is to check the actual user is existing or not, if not it will send error 
   * otherwise call the successcallback and finishes the authentication process
   * @returns 
   */
  getAuthCallBack() {
    return async (username: string, password: string, done: any) => {
      const profile = { username, password }
      try {
        logger.info('search existing user based on profile: ' + LoggerClass.objectToString(profile))
        const user = await this.checkExistingUserByProfile(profile)
        return done(null, user);
      } catch (error) {
        logger.error('the user does not exist ' + LoggerClass.objectToString(profile))
        return done(error as Error);
      }
    }
  }

}

export default new CustomLocalStrategy(options, userRepository, passport).getStrategy()

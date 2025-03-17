import { Strategy } from 'passport-local';
import {Request} from 'express'
import AuthStrategy from './authStrategy';
import userRepository from '../../repositories/User.repository';
import { logger, LoggerClass } from '../../utils/logger/logger';
import { UserEntity } from '../../types/User';
import md5 from 'md5'
const options = {
  username: 'username', // Field name for username
  password: 'password'  // Field name for password
}
class CustomLocalStrategy extends AuthStrategy {

  async checkExistingUserByProfile(profile: { username: string, password: string }): Promise<UserEntity> {
    return await this.userRepository.findOne({ name: profile.username, password: md5(profile.password) })
  }

  getAuthCallBack() {
    return async (username: string, password: string, done: any) => {
      logger.info('search existing user based on profile')
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

  getStrategy() {
    return new Strategy(this.options, this.getAuthCallBack());
  }

}

export default new CustomLocalStrategy(options, userRepository).getStrategy()

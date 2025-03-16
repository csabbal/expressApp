import  { Strategy }  from 'passport-local';
import AuthStrategy from './authStrategy';
import userRepository from '../../repositories/User.repository';
import { logger, LoggerClass } from '../../utils/logger/logger';
import { UserEntity } from '../../types/User';
import md5 from 'md5'
class CustomLocalStrategy extends AuthStrategy {

  async checkExistingUserByProfile(profile:{username: string,password:string}): Promise<UserEntity> {
    return await this.userRepository.findOne({ name: profile.username, password:md5(profile.password) })
  }

  getAuthCallBack() {
    return async (username: string, password: string, done: any) => {
      const profile = {username, password}
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

export default new CustomLocalStrategy({}, userRepository).getStrategy()

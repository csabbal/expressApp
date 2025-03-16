import { v4 as uuidv4 } from 'uuid'
import { logger, LoggerClass } from "../../utils/logger/logger";
import { _StrategyOptionsBase, Strategy as GoogleStrategy, StrategyOptions } from 'passport-google-oauth20';
import { UserRepository } from "../../repositories/User.repository";
import { UserEntity } from "../../types/User";
import { Strategy } from 'passport-oauth2';

export default abstract class AuthStrategy {

    constructor(protected options:any, protected userRepository:UserRepository){}

    async createNewUserFromAuthUser(profile: any): Promise<UserEntity> {
        const newUser = {
            id: uuidv4(),
            name: profile.displayName,
            googleId: profile.id,
            email: profile.emails?.[0]?.value,
            fullName: profile.name.givenName + " " + profile.name.familyName,
            jwtSecureCode: uuidv4()
        } as UserEntity
        logger.info('create User' + LoggerClass.objectToString(newUser))
        return await this.userRepository.create(newUser)
    }

    async checkExistingUserByProfile(profile: any): Promise<UserEntity> {
        return await this.userRepository.findOne({ googleId: profile.id, })
    }

    getAuthCallBack() {
        return async(_accessToken: unknown, _refreshToken: unknown, profile: any, done: any) => {
            try {
                logger.info('search existing user based on profile: ' + LoggerClass.objectToString(profile))
                const user = await this.checkExistingUserByProfile(profile) ?? await this.createNewUserFromAuthUser(profile)
                return done(null, user);
            } catch (error) {
                return done(error as Error);
            }
        }
    }

    getStrategy():any{
        return new Strategy(this.options, this.getAuthCallBack.bind(this));
    }


}


import { v4 as uuidv4 } from 'uuid'
import { logger, LoggerClass } from "../../utils/logger/logger";
import { _StrategyOptionsBase } from 'passport-google-oauth20';
import { UserRepository } from "../../repositories/User.repository";
import { UserEntity } from "../../types/User";

/**
 *  this class is for creating new users and performing an authentication strategy
 */
export default abstract class AuthStrategy {

    constructor(protected options:any, protected userRepository:UserRepository,protected passport: any){}

    /**
     * Create a new user based on the given profile data
     * @param profile 
     * @returns {Prmoise<UserEntity>} the created user
     */
    async createNewUserFromAuthUser(profile: any): Promise<UserEntity> {
        const newUser = {
            id: uuidv4(),
            name: profile.displayName,
            googleId: profile.id,
            email: profile.emails?.[0]?.value,
            fullName: profile.name && profile.name.givenName + " " + profile.name.familyName,
            jwtSecureCode: uuidv4()
        } as UserEntity
        logger.info('create User' + LoggerClass.objectToString(newUser))
        return await this.userRepository.create(newUser)
    }

    /**
     * checking if the user is existing or not based on the given profile data
     * @param profile 
     * @returns {Prmoise<UserEntity>} the existing user or null
     */
    async checkExistingUserByProfile(profile: any): Promise<UserEntity> {
        return await this.userRepository.findOne({ googleId: profile.id })
    }

    /**
     * The callback function what can be called when a given authentication is finished and it returned profile data
     * This function call the auth strategy callback function which sets the new user or handlex the error occured
     * @returns void
     */
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

    /**
     * return back the actual authentication strategy
     * @returns {Strategy}
     */
    getStrategy():any{
        return new this.passport.Strategy(this.options, this.getAuthCallBack.bind(this)());
    }


}


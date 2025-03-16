import { UserModel } from "../../entities/User.schema";
import { v4 as uuidv4 } from 'uuid'
import { logger, LoggerClass } from "../../utils/logger/logger";
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';


const options = {
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.BE_BASE_URL}/api/auth/callback`,
  proxy: true
}

const authCallback = async (accessToken, refreshToken, profile, done) => {
  try {
    logger.info('search existing user based on profile id: ' + LoggerClass.objectToString(profile.id))

    let user = await UserModel.findOne({ googleId: profile.id, });

    if (!user) {
      const newUser = {
        id: uuidv4(),
        name: profile.displayName,
        googleId: profile.id,
        email: profile.emails?.[0]?.value,
        fullName: profile.name.givenName + " " + profile.name.familyName,
        jwtSecureCode: uuidv4()
      }
      logger.info('create User' + LoggerClass.objectToString(newUser))
      user = await UserModel.create(newUser);
    }

    logger.info('profile' + LoggerClass.objectToString(profile))

    // auth the User
    return done(null, user);
  } catch (error) {
    return done(error as Error);
  }
}

export default new GoogleStrategy(options, authCallback)

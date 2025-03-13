import { UserModel } from "../../entities/User.schema";
import { logger, LoggerClass } from "../../utils/logger/logger";

const GoogleStrategy = require('passport-google-oauth20').Strategy; 

 
const googleStrategy =  new GoogleStrategy(  
    {  
      clientID: process.env.GOOGLE_CLIENT_ID,  
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,  
      callbackURL: `${process.env.BE_BASE_URL}/api/auth/callback`,
      proxy:true
    },  
    async (accessToken, refreshToken, profile, done) => {  
      // 🗂️ In a real app, you'd save the user info to your DB here  
      try {
        // we check for if the user is present in our system/database.
        // which states that; is that a sign-up or sign-in?
        logger.info('search existing user based on profile id: ' + LoggerClass.objectToString(profile.id))
        logger.info('accesstoken: ' + accessToken)

        let user = await UserModel.findOne({
                googleId: profile.id,
        });

        
        // if not
        if (!user) {
            const newUser = {
                id: uuidv4(),
                name:profile.displayName,
                googleId: profile.id,
                email: profile.emails?.[0]?.value,
                fullName: profile.name.givenName +" "+profile.name.familyName,
                accessToken: accessToken,
                jwtSecureCode: uuidv4(),
            }
            logger.info('create User' + LoggerClass.objectToString(newUser))
            // create new user if doesn't exist
            user = await UserModel.create(newUser);
        }

        logger.info('profile' + LoggerClass.objectToString(profile))

        // auth the User
        return done(null, user);
    } catch (error) {
        return done(error as Error);
    }
    }  
  )   
 

export default googleStrategy

function uuidv4() {
  throw new Error("Function not implemented.");
}

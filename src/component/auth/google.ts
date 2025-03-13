const passport = require('passport');  
const GoogleStrategy = require('passport-google-oauth20').Strategy; 

 
const googleStrategy =  new GoogleStrategy(  
    {  
      clientID: process.env.GOOGLE_CLIENT_ID,  
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,  
      callbackURL: `${process.env.BE_BASE_URL}/api/auth/callback`,
    },  
    (accessToken, refreshToken, profile, done) => {  
      // 🗂️ In a real app, you'd save the user info to your DB here  
      console.log('Google profile:', profile);  
      done(null, profile);  
    }  
  )   
// 🚀 Serialize user into session  
passport.serializeUser((user, done) => {  
  done(null, user);  
});  
passport.deserializeUser((user, done) => {  
  done(null, user);  
}); 

export default googleStrategy
// passport.ts
import passport from 'passport';
import googleStrategy from './google';
import jwtStrategy from './jwt';

// initialize passport with Google and JWT strategies
passport.use('google', googleStrategy);
passport.use('jwt', jwtStrategy);

// 🚀 Serialize user into session  
passport.serializeUser((user, done) => {
    done(null, user);
});
passport.deserializeUser((user, done) => {
    done(null, user);
});

export default passport;
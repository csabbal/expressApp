// requireJwt.ts
import jwt from 'jsonwebtoken';
import passport from './passport';  // import passport from our custom passport file

// requireJwt middleware to authenticate the request using JWT
const requireJwt = passport.authenticate('jwt', { session: false});


export default requireJwt;
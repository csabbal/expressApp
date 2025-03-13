// requireJwt.ts
import jwt from 'jsonwebtoken';
import passport from 'passport';  // import passport from our custom passport file

// requireJwt middleware to authenticate the request using JWT
const requireJwt = passport.authenticate('jwt', { session: true});


// const requireJwt = (req, res, next) => {
//     const token = req.headers['authorization']?.split(' ')[1]; // Get the token from the Authorization header

//     if (!token) {
//         return res.sendStatus(403); // Forbidden
//     }

//     jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
//         if (err) {
//             return res.sendStatus(403); // Forbidden
//         }
//         req.user = user; // Attach user info to request
//         next();
//     });
// };

export default requireJwt;
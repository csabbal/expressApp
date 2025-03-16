import dotenv from 'dotenv';
import express, { Response } from 'express';
import passport from 'passport';
import { User } from '../types/User';
import { logger } from '../utils/logger/logger';
const router = express.Router();
dotenv.config();
const { JWT_SECRET: jwtSecret } = process.env

/**
 * @swagger
 * /api/auth:
 *   get:
 *     summary: auth users
 *     responses:
 *       200:
 *         description: auth user via google
 *          
 */
router.get('/', passport.authenticate('google', { scope: ['profile', 'email'] }));

/**
 * @swagger
 * /api/auth/callback:
 *   get:
 *     summary: callback after auth
 *     responses:
 *       200:
 *         description: auth user via google
 *          
 */
router.get('/callback', passport.authenticate('google', { scope: ['profile', 'email'], session: false }), async (req: any, res: Response) => {
  const user = req.user as User;
  const token = await req.user.generateJWT(jwtSecret);
  logger.info('callback user ' + JSON.stringify(user))
  res.json({token})
});

/**
* @swagger
* /api/auth/logout:
*   post:
*     summary: logout
*     responses:
*       200:
*         description: user logged out
*          
*/
router.post('/logout', function (req, res, next) {
  req.logout(function (err) {
    if (err) { return next(err); }
    res.redirect('http://localhost:8080');
  });
});


export default router
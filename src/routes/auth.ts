import express, {Request, Response} from 'express';
import { AuthController } from '../controllers/authController';
import passport from 'passport';
import { User } from '../types/User';
import { AuthService } from '../services/authService';
import { logger } from '../utils/logger/logger';
const router = express.Router();



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
router.get('/callback', passport.authenticate('google', { scope: ['profile', 'email'], session:false  }), (req: any, res: Response) => {
    // try {
    //   // we can use req.user because the GoogleStrategy that we've 
    //   // implemented in `google.ts` attaches the user
    const user = req.user as User;

    logger.info('callback user '+JSON.stringify(user))

  //   //    res.send({success:true,user:user});
  //   // } catch (error) {
  //   //   return res.status(500).json({ message: 'An error occurred during authentication', error });
  //   // }
  //   res.json({
  //     message: 'Authentication successful!',
  //     user: user // User info here
  // });

  const token = req.user.generateJWT();
  res.location('/api/user/all')
    res.setHeader('Authorization', 'Bearer '+token)


  res.status(302).end()
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
  router.post('/logout', function(req, res, next){
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('http://localhost:8080');
    });
  });


export default router
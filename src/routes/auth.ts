
import express from 'express';
import passport from 'passport';
import {AuthController} from '../controllers/authController'
import {requireGoogleAuth} from '../providers/auth/passport';
const router = express.Router();
const authController = AuthController.getInstance()

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
router.get('/google', requireGoogleAuth);

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
router.get('/google/callback', requireGoogleAuth, (req, res, next) => authController.authCallback(req, res, next));

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
router.post('/logout', authController.logout);


export default router
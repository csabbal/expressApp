
import express from 'express';
import {AuthController} from '../controllers/authController'
import {requireGoogleAuth, requireLocalAuth} from '../providers/auth/passport';
const router = express.Router();
const authController = AuthController.getInstance()



/**
 * @swagger
 * /api/auth/local:
 *   post:
 *     summary: auth users
 *     responses:
 *       200:
 *         description: auth user via local
 *          
 */
router.post('/local', requireLocalAuth, authController.authCallback.bind(authController));

/**
 * @swagger
 * /api/auth/google:
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
 * /api/auth/google/callback:
 *   get:
 *     summary: callback after auth
 *     responses:
 *       200:
 *         description: auth user via google
 *          
 */
router.get('/google/callback', requireGoogleAuth, authController.authCallback.bind(authController));

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
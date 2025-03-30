
import express from 'express'
import {AuthController} from '../controllers/authController'
import {requireGoogleAuth, requireLocalAuth} from '../providers/auth/passport'

// get the current router instance
const router = express.Router()

// get the current authController instance
const authController = AuthController.getInstance()

/**
 * @swagger
 * /api/auth/local:
 *   post:
 *     summary: auth users
 *    
 *     requestBody:
 *       content:
 *         application/json:
 *          schema:
 *            type: object
 *            properties:
 *             username:
 *               type: string
 *               example: admin
 *             password:
 *               type: string
 *               example: admin
 *     responses:
 *       "200":
 *         description: the authentication was successful via local strategy 
 *         content:
 *          application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: the token is to identify the user    
 */
router.post('/local', requireLocalAuth, authController.authCallback.bind(authController))

router.get('/google', requireGoogleAuth)

router.get('/google/callback', requireGoogleAuth, authController.authCallback.bind(authController))

/**
* @swagger
* /api/auth/logout:
*   post:
*     summary: logout
*     responses:
*       200:
*         description: user logged out        
*/
router.post('/logout', authController.logout)


export default router
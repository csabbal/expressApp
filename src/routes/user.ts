import express from 'express';
import { UserController } from '../controllers/userController';
import { requireJwt } from '../providers/auth/passport';
import { verifyPrivileges } from '../providers/auth/jwtStrategy';

// get the current router instance
const router = express.Router();

// get the current user controller instance
const userController = UserController.getInstance()

/**
 * @swagger
 * /api/user/all:
 *   get:
 *     summary: Retrieve a list of users
 *     security:
 *        - BearerAuth: [] 
 *     responses:
 *       200:
 *         description: A list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: John Doe
 */
router.get('/all', requireJwt, verifyPrivileges([{component:'users', privilege:'read'}]), userController.getAllUsers.bind(userController));


export default router

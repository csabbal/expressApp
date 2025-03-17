import express from 'express';
import { UserController } from '../controllers/userController';
import {requireJwt} from '../providers/auth/passport';
const router = express.Router();
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
router.get('/all', requireJwt, (req, res, next) => userController.getAllUsers(req, res, next));

/**
 * @swagger
 * /api/user/error:
 *   get:
 *     summary: Retrieve n error
 *     responses:
 *       200:
 *         description: An error tester method
 *         content:
 *           application/json:
 *             schema:
 *               type: error
 *               items:
 *                 type: error
 */
router.get('/error', (req, res, next) => userController.getError(req, res, next));


export default router

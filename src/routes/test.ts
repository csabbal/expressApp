import express from 'express';
import { UserController } from '../controllers/userController';
const router = express.Router();

/**
 * @swagger
 * /api/user/all:
 *   get:
 *     summary: Retrieve a list of users
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
router.get('/user/all', (req, res, next) => UserController.getInstance().getAllUsers(req, res, next));

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
router.get('/user/error', (req, res, next) => UserController.getInstance().getError(req, res, next));


export default router

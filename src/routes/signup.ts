import express from 'express'
import { SignupController } from '../controllers/signupController'

// get the current router instance
const router = express.Router()

// get the current signup controller instance
const signupController = SignupController.getInstance()

/**
 * @swagger
 * /api/signup/local:
 *   post:
 *     summary: register a new local user
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password]
 *             properties:
 *               username:
 *                 type: string
 *                 example: jdoe
 *               email:
 *                 type: string
 *                 example: jdoe@example.com
 *               password:
 *                 type: string
 *                 example: s3cretpw
 *     responses:
 *       "201":
 *         description: user created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *       "400":
 *         description: username, email or password missing/invalid
 *       "409":
 *         description: username or email already taken
 */
router.post('/local', signupController.signupLocal.bind(signupController))

export default router

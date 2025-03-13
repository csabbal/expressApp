import express from 'express';
import { UserController } from '../controllers/userController';
import requireJwt from '../component/auth/requireJwt';
import passport from 'passport';
import { logger } from '../utils/logger/logger';
import { ExtractJwt } from 'passport-jwt';
import axios from 'axios';
import { register } from 'module';
const router = express.Router();

// Passport JWT Strategy
const opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET // This is not used for Google tokens, but kept for JWT strategy
};

// Middleware to validate Google access token
const validateGoogleToken = async (req, res, next) => {
  
    logger.info('isAuthenticated:'+req.isAuthenticated())
    if(req.isAuthenticated()){
        next()
    }else{
        res.send('unauthorized')
    }

};

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
router.get('/all', requireJwt, (req, res, next) => UserController.getInstance().getAllUsers(req, res, next));

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
router.get('/error', (req, res, next) => UserController.getInstance().getError(req, res, next));


export default router

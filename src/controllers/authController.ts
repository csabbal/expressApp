import express, { Request, Response } from 'express'
import { AuthService } from '../services/authService'
import { loggedMethod, logger } from '../utils/logger/logger'
import { UserEntity } from '../types/User'

/**
 * This class is about to provides all requests of the authentication related endpoints via auth service 
 */
export class AuthController {
    protected static _instance: AuthController
    constructor(private authService: AuthService) { }

    /**
     * This mehtod ensure that this class can work as a singleton
     * @returns 
     */
    static getInstance(): AuthController {
        if (!this._instance) {
            this._instance = new AuthController(AuthService.getInstance())
        }
        return this._instance
    }

    /**
     * This callback function call the user service callback with the user conteined by the request
     * @param {Request} req 
     * @param {Response} res 
     * @param {NextFunction} next 
     */
    @loggedMethod('[AuthController]')
    public async authCallback(req: Request, res: Response, next: express.NextFunction) {
        const user = req.user as UserEntity
        const token = await this.authService.callback(user)
        res.json(token)
    }

    /**
     * This function is to take care about the log out function
     * @param {Request} req 
     * @param {Response} res 
     * @param {NextFunction} next 
     */
    @loggedMethod('[AuthController]')
    public async logout(req: express.Request, res: express.Response, next: express.NextFunction) {
        req.logout(function (err) {
            if (err) { return next(err) }
            res.redirect('http://localhost:8080')
        })
    }
    
}
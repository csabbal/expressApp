import express from 'express';
import { AuthService } from '../services/authService';
import { loggedMethod, logger } from '../utils/logger/logger';
import { BadRequestError } from '../utils/error/Error';

export class AuthController {
    protected static _instance: AuthController;

    constructor(private authService: AuthService) { }

    static getInstance(): AuthController {
        if (!this._instance) {
            this._instance = new AuthController(new AuthService())
        }
        return this._instance
    }

    @loggedMethod('[AuthController]')
    public async auth(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            await this.authService.auth();
            res.json({success:true});
        } catch (e) {
            next(e)
        }
    }

    @loggedMethod('[AuthController]')
    public async authCallback(req: express.Request, res: express.Response, next: express.NextFunction) {
    }
}
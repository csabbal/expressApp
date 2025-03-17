import express, { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { loggedMethod, logger } from '../utils/logger/logger';
import { UserEntity } from '../types/User';
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
    public async authCallback(req: Request, res: Response, next: express.NextFunction) {
        const user = req.user as UserEntity;
        const token = await this.authService.callback(user)
        res.json(token)
    }

    @loggedMethod('[AuthController]')
    public async logout(req: express.Request, res: express.Response, next: express.NextFunction) {
        req.logout(function (err) {
            if (err) { return next(err); }
            res.redirect('http://localhost:8080');
        });
    }
    
}
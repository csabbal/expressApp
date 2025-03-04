import express from 'express';
import { UserService } from '../services/userService';
import { User } from '../types/User';
import { loggedMethod, logger } from '../utils/logger/logger';
import { BadRequestError } from '../utils/error/Error';

export class UserController {
    protected static _instance: UserController;

    constructor(private userService: UserService) { }

    static getInstance(): UserController {
        if (!this._instance) {
            this._instance = new UserController(new UserService())
        }
        return this._instance
    }

    @loggedMethod('[UserController]')
    public async getAllUsers(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const users: User[] = await this.userService.getAllUsers();
            res.json(users);
        } catch (e) {
            next(e)
        }
    }

    @loggedMethod('[getError]')
    public async getError(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            await this.userService.throwError();
        } catch (e:any) {
            next(e)
        }
    }
}
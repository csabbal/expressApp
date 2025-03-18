import express from 'express';
import { UserService } from '../services/userService';
import { UserEntity } from '../types/User';
import { loggedMethod } from '../utils/logger/logger';

/**
 * This class is about to provides all requests of the user related endpoints via user service 
 */
export class UserController {
    protected static _instance: UserController;

    constructor(private userService: UserService) { }

    static getInstance(): UserController {
        if (!this._instance) {
            this._instance = new UserController(new UserService())
        }
        return this._instance
    }

    /**
     * This controller method has only one task is to call userService getAllUsers function in order for fetching all users form the user repository
     * @param {Request} req 
     * @param {Response} res 
     * @param {NextFunction} next 
     */
    @loggedMethod('[UserController]')
    public async getAllUsers(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const users: UserEntity[] = await this.userService.getAllUsers();
            res.json(users);
        } catch (e) {
            next(e)
        }
    }
}
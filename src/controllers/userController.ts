import express from 'express';
import { UserService } from '../services/userService';
import { User } from '../types/User';
import { logger } from '../utils/logger/logger';

export class UserController {
    protected static _instance: UserController;

    constructor(private userService: UserService) {
        this.userService = userService;
    }

    static getInstance():UserController {
        if (!this._instance) {
            this._instance = new UserController(new UserService())
        }
        return this._instance
    }

    public getAllUsers = async (req: express.Request, res: express.Response) => {
        logger.info('[UserController][getAllUsers] called' )
        try {
            const users: User[] = await this.userService.getAllUsers();
            res.json(users);
        } catch (err: any) {
            res.status(500).json({ message: err.message });
        }
    }
}
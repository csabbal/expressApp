import express from 'express';
import { UserService } from '../services/userService';
import { User } from '../types/User';
import { loggedMethod,logger } from '../utils/logger/logger';

export class UserController {
    protected static _instance: UserController;

    constructor(private userService: UserService) {}

    static getInstance():UserController {
        if (!this._instance) {
            this._instance = new UserController(new UserService())
        }
        return this._instance
    }

    @loggedMethod('[UserController]')
    public async getAllUsers(req: express.Request, res: express.Response){
        try {
            const users: User[] = await this.userService.getAllUsers();
            res.json(users);
        } catch (err: any) {
            res.status(500).json({ message: err.message });
        }
    }
}
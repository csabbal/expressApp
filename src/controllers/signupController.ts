import express from 'express'
import { SignupService } from '../services/signupService'

/**
 * This class is about to provide the local signup endpoint via signup service
 */
export class SignupController {
    protected static _instance: SignupController

    constructor(private signupService: SignupService) { }

    static getInstance(): SignupController {
        if (!this._instance) {
            this._instance = new SignupController(SignupService.getInstance())
        }
        return this._instance
    }

    /**
     * This controller method registers a new local user via signupService
     * and responds with the created user (without secrets)
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     *
     * Note: intentionally NOT decorated with @loggedMethod — req.body contains
     * the plaintext signup password, and the decorator logs safeStringify(args)
     * at debug level, which would leak it.
     */
    public async signupLocal(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const createdUser = await this.signupService.signup(req.body)
            res.status(201).json(createdUser)
        } catch (e) {
            next(e)
        }
    }
}

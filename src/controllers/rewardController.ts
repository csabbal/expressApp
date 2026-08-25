import express from 'express'
import { RewardService } from '../services/rewardService'
import { RewardEntity } from '../types/Reward'
import { loggedMethod } from '../utils/logger/logger'
import _ from 'lodash'
import { BadRequestError } from '../utils/error/Error'
import { AppRequest } from '../types/CustomExpress'

/**
 * This class is about to provides all requests of the reward related endpoints via reward service
 */
export class RewardController {
    protected static _instance: RewardController

    constructor(private rewardService: RewardService) { }

    static getInstance(): RewardController {
        if (!this._instance) {
            this._instance = new RewardController(RewardService.getInstance())
        }
        return this._instance
    }

    /**
     * This controller method is about to call rewardService grantReward function with the
     * request body and the authenticated user's id, granting a random unwon reward image
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[RewardController] grantReward')
    public async grantReward(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const { category, startedAt } = req.body
            if (!_.isString(category) || _.isEmpty(category)) throw new BadRequestError('category is required')
            if (!_.isString(startedAt)) throw new BadRequestError('startedAt must be a valid date')
            const parsedStartedAt = new Date(startedAt)
            if (_.isNaN(parsedStartedAt.getTime())) throw new BadRequestError('startedAt must be a valid date')

            const userId = (req as AppRequest).user.id
            const reward: RewardEntity = await this.rewardService.grantReward(userId, category, parsedStartedAt)
            res.status(201).json(reward)
        } catch (e) {
            next(e)
        }
    }

    /**
     * This controller method is about to call rewardService getWonImageIds function with the
     * authenticated user's id
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[RewardController] getWon')
    public async getWon(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const userId = (req as AppRequest).user.id
            const imageIds: string[] = await this.rewardService.getWonImageIds(userId)
            res.json(imageIds)
        } catch (e) {
            next(e)
        }
    }

    /**
     * This controller method is about to call rewardService getAvailableImageIds function with
     * the authenticated user's id
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[RewardController] getAvailable')
    public async getAvailable(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const userId = (req as AppRequest).user.id
            const imageIds: string[] = await this.rewardService.getAvailableImageIds(userId)
            res.json(imageIds)
        } catch (e) {
            next(e)
        }
    }
}

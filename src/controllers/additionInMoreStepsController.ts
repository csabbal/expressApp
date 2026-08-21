import express from 'express'
import { AdditionInMoreStepsService } from '../services/additionInMoreStepsService'
import { AdditionInMoreStepsEntity, listRequestParams } from '../types/AdditionInMoreSteps'
import { loggedMethod, logger, LoggerClass } from '../utils/logger/logger'
import _ from 'lodash'
import { BadRequestError } from '../utils/error/Error'

/**
 * This class is about to provides all requests of the additionInMoreSteps related
 * endpoints via additionInMoreSteps service
 */
export class AdditionInMoreStepsController {
    protected static _instance: AdditionInMoreStepsController

    constructor(private additionInMoreStepsService: AdditionInMoreStepsService) { }

    static getInstance(): AdditionInMoreStepsController {
        if (!this._instance) {
            this._instance = new AdditionInMoreStepsController(AdditionInMoreStepsService.getInstance())
        }
        return this._instance
    }

    /**
     * This controller method has only one task is to call additionInMoreStepsService getAll function
     * in order for fetching all additionInMoreSteps items from the additionInMoreSteps repository
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[AdditionInMoreStepsController] getAll')
    public async getAll(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const items: AdditionInMoreStepsEntity[] = await this.additionInMoreStepsService.getAll()
            res.json(items)
        } catch (e) {
            next(e)
        }
    }

    /**
     * This controller method is about to call additionInMoreStepsService getList function with
     * paramaters taken as querystring, but before that it perform all of validations on those paramaters
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[AdditionInMoreStepsController] getList')
    public async getList(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const params = req.query as unknown as listRequestParams
            // if the sort is not an array, then convert it to an array
            if (params.sort && !Array.isArray(params.sort)) {
                params.sort = [params.sort]
            }
            logger.info('[getList] params' + LoggerClass.objectToString(params))
            // checking the querystring paramaters
            if (_.isNaN(params.limit)) throw new BadRequestError('limit is not a number')
            if (_.isNaN(params.offset)) throw new BadRequestError('offset is not a number')
            if (!_.isArray(params.sort)) throw new BadRequestError('sort is not an array')

            // calling the additionInMoreStepsService getList function with the querystring paramaters
            const items: AdditionInMoreStepsEntity[] = await this.additionInMoreStepsService.getList(params)
            res.json(items)
        } catch (e) {
            next(e)
        }
    }

    /**
     * This controller method is about to call additionInMoreStepsService getById function with id param
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[AdditionInMoreStepsController] getById')
    public async getById(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const { id } = req.params
            const item: AdditionInMoreStepsEntity = await this.additionInMoreStepsService.getById(id)
            res.json(item)
        } catch (e) {
            next(e)
        }
    }

    /**
     * This controller method is about to call additionInMoreStepsService update function
     * with id param and the request body
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[AdditionInMoreStepsController] update')
    public async update(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const { id } = req.params
            const item: AdditionInMoreStepsEntity = await this.additionInMoreStepsService.update(id, req.body)
            res.json(item)
        } catch (e) {
            next(e)
        }
    }

    /**
     * This controller method is about to call additionInMoreStepsService create function with the request body
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[AdditionInMoreStepsController] create')
    public async create(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const item: AdditionInMoreStepsEntity = await this.additionInMoreStepsService.create(req.body)
            res.status(201).json(item)
        } catch (e) {
            next(e)
        }
    }

    /**
     * This controller method is about to call additionInMoreStepsService delete function with id param
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[AdditionInMoreStepsController] delete')
    public async delete(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const { id } = req.params
            const item: AdditionInMoreStepsEntity = await this.additionInMoreStepsService.delete(id)
            res.json(item)
        } catch (e) {
            next(e)
        }
    }
}

import express from 'express'
import { SubtractionInMoreStepsService } from '../services/subtractionInMoreStepsService'
import { listRequestParams, SubtractionInMoreStepsEntity } from '../types/SubtractionInMoreSteps'
import { loggedMethod, logger, LoggerClass } from '../utils/logger/logger'
import _ from 'lodash'
import { BadRequestError } from '../utils/error/Error'

/**
 * This class is about to provides all requests of the subtractionInMoreSteps related
 * endpoints via subtractionInMoreSteps service
 */
export class SubtractionInMoreStepsController {
    protected static _instance: SubtractionInMoreStepsController

    constructor(private subtractionInMoreStepsService: SubtractionInMoreStepsService) { }

    static getInstance(): SubtractionInMoreStepsController {
        if (!this._instance) {
            this._instance = new SubtractionInMoreStepsController(SubtractionInMoreStepsService.getInstance())
        }
        return this._instance
    }

    /**
     * This controller method has only one task is to call subtractionInMoreStepsService getAll function
     * in order for fetching all subtractionInMoreSteps items from the subtractionInMoreSteps repository
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[SubtractionInMoreStepsController] getAll')
    public async getAll(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const items: SubtractionInMoreStepsEntity[] = await this.subtractionInMoreStepsService.getAll()
            res.json(items)
        } catch (e) {
            next(e)
        }
    }

    /**
     * This controller method is about to call subtractionInMoreStepsService getList function with
     * paramaters taken as querystring, but before that it perform all of validations on those paramaters
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[SubtractionInMoreStepsController] getList')
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

            // calling the subtractionInMoreStepsService getList function with the querystring paramaters
            const items: SubtractionInMoreStepsEntity[] = await this.subtractionInMoreStepsService.getList(params)
            res.json(items)
        } catch (e) {
            next(e)
        }
    }

    /**
     * This controller method is about to call subtractionInMoreStepsService getById function with id param
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[SubtractionInMoreStepsController] getById')
    public async getById(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const { id } = req.params
            const item: SubtractionInMoreStepsEntity = await this.subtractionInMoreStepsService.getById(id)
            res.json(item)
        } catch (e) {
            next(e)
        }
    }

    /**
     * This controller method is about to call subtractionInMoreStepsService update function
     * with id param and the request body
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[SubtractionInMoreStepsController] update')
    public async update(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const { id } = req.params
            const item: SubtractionInMoreStepsEntity = await this.subtractionInMoreStepsService.update(id, req.body)
            res.json(item)
        } catch (e) {
            next(e)
        }
    }

    /**
     * This controller method is about to call subtractionInMoreStepsService create function with the request body
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[SubtractionInMoreStepsController] create')
    public async create(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const item: SubtractionInMoreStepsEntity = await this.subtractionInMoreStepsService.create(req.body)
            res.status(201).json(item)
        } catch (e) {
            next(e)
        }
    }

    /**
     * This controller method is about to call subtractionInMoreStepsService delete function with id param
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[SubtractionInMoreStepsController] delete')
    public async delete(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const { id } = req.params
            const item: SubtractionInMoreStepsEntity = await this.subtractionInMoreStepsService.delete(id)
            res.json(item)
        } catch (e) {
            next(e)
        }
    }
}

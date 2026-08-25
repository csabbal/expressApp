import express from 'express'
import { TaskFailureService } from '../services/taskFailureService'
import { listRequestParams, TaskFailureEntity } from '../types/TaskFailure'
import { loggedMethod, logger, LoggerClass } from '../utils/logger/logger'
import _ from 'lodash'
import { BadRequestError } from '../utils/error/Error'
import { AppRequest } from '../types/CustomExpress'

/**
 * This class is about to provides all requests of the task failure related endpoints via task failure service
 */
export class TaskFailureController {
    protected static _instance: TaskFailureController

    constructor(private taskFailureService: TaskFailureService) { }

    static getInstance(): TaskFailureController {
        if (!this._instance) {
            this._instance = new TaskFailureController(TaskFailureService.getInstance())
        }
        return this._instance
    }

    /**
     * This controller method is about to call taskFailureService recordFailure function with the
     * request body and the authenticated user's id, upserting a (userId, taskId) failure record
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[TaskFailureController] recordFailure')
    public async recordFailure(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const { taskId, taskTypeName, errorMessage } = req.body
            if (!_.isString(taskId) || _.isEmpty(taskId)) throw new BadRequestError('taskId is required')
            if (!_.isString(taskTypeName) || _.isEmpty(taskTypeName)) {
                throw new BadRequestError('taskTypeName is required')
            }
            if (!_.isNil(errorMessage) && !_.isString(errorMessage)) {
                throw new BadRequestError('errorMessage must be a string')
            }
            const userId = (req as AppRequest).user.id
            const taskFailure = await this.taskFailureService.recordFailure(userId, taskId, taskTypeName, errorMessage)
            res.json(taskFailure)
        } catch (e) {
            next(e)
        }
    }

    /**
     * This controller method has only one task is to call taskFailureService getAll function
     * in order for fetching all task failures from the task failure repository
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[TaskFailureController] getAll')
    public async getAll(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const taskFailures: TaskFailureEntity[] = await this.taskFailureService.getAll()
            res.json(taskFailures)
        } catch (e) {
            next(e)
        }
    }

    /**
     * This controller method is about to call taskFailureService getList function with paramaters taken
     * as querystring but before that it perform all of validations what it makes sens on the querystring paramaters
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[TaskFailureController] getList')
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

            // calling the taskFailureService getList function with the querystring paramaters
            const taskFailures: TaskFailureEntity[] = await this.taskFailureService.getList(params)
            res.json(taskFailures)
        } catch (e) {
            next(e)
        }
    }

    /**
     * This controller method is about to call taskFailureService getById function with id param
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[TaskFailureController] getById')
    public async getById(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const { id } = req.params
            const taskFailure: TaskFailureEntity = await this.taskFailureService.getById(id)
            res.json(taskFailure)
        } catch (e) {
            next(e)
        }
    }

    /**
     * This controller method is about to call taskFailureService delete function with id param
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[TaskFailureController] delete')
    public async delete(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const { id } = req.params
            const taskFailure: TaskFailureEntity = await this.taskFailureService.delete(id)
            res.json(taskFailure)
        } catch (e) {
            next(e)
        }
    }
}

import express from 'express'
import { TaskTypeService } from '../services/taskTypeService'
import { listRequestParams, TaskTypeEntity } from '../types/TaskType'
import { loggedMethod, logger, LoggerClass } from '../utils/logger/logger'
import _ from 'lodash'
import { BadRequestError } from '../utils/error/Error'

/**
 * This class is about to provides all requests of the task type related endpoints via task type service
 */
export class TaskTypeController {
    protected static _instance: TaskTypeController

    constructor(private taskTypeService: TaskTypeService) { }

    static getInstance(): TaskTypeController {
        if (!this._instance) {
            this._instance = new TaskTypeController(TaskTypeService.getInstance())
        }
        return this._instance
    }

    /**
     * This controller method has only one task is to call taskTypeService getAll function
     * in order for fetching all task types from the task type repository
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[TaskTypeController] getAll')
    public async getAll(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const taskTypes: TaskTypeEntity[] = await this.taskTypeService.getAll()
            res.json(taskTypes)
        } catch (e) {
            next(e)
        }
    }

    /**
     * This controller method is about to call taskTypeService getList function with paramaters taken as querystring
     * but before that it perform all of validations what it makes sens on the querystring paramaters
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[TaskTypeController] getList')
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

            // calling the taskTypeService getList function with the querystring paramaters
            const taskTypes: TaskTypeEntity[] = await this.taskTypeService.getList(params)
            res.json(taskTypes)
        } catch (e) {
            next(e)
        }
    }

    /**
     * This controller method is about to call taskTypeService getById function with id param
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[TaskTypeController] getById')
    public async getById(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const { id } = req.params
            const taskType: TaskTypeEntity = await this.taskTypeService.getById(id)
            res.json(taskType)
        } catch (e) {
            next(e)
        }
    }

    /**
     * This controller method is about to call taskTypeService update function with id param and the request body
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[TaskTypeController] update')
    public async update(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const { id } = req.params
            const taskType: TaskTypeEntity = await this.taskTypeService.update(id, req.body)
            res.json(taskType)
        } catch (e) {
            next(e)
        }
    }

    /**
     * This controller method is about to call taskTypeService create function with the request body
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[TaskTypeController] create')
    public async create(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const taskType: TaskTypeEntity = await this.taskTypeService.create(req.body)
            res.status(201).json(taskType)
        } catch (e) {
            next(e)
        }
    }

    /**
     * This controller method is about to call taskTypeService delete function with id param
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[TaskTypeController] delete')
    public async delete(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const { id } = req.params
            const taskType: TaskTypeEntity = await this.taskTypeService.delete(id)
            res.json(taskType)
        } catch (e) {
            next(e)
        }
    }
}

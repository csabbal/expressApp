import express from 'express'
import { TestService } from '../services/testService'
import { TestEntity, TestStartResult, listRequestParams } from '../types/Test'
import { loggedMethod, logger, LoggerClass } from '../utils/logger/logger'
import _ from 'lodash'
import { BadRequestError } from '../utils/error/Error'
import { AppRequest } from '../types/CustomExpress'

/**
 * This class is about to provides all requests of the test related endpoints via test service
 */
export class TestController {
    protected static _instance: TestController

    constructor(private testService: TestService) { }

    static getInstance(): TestController {
        if (!this._instance) {
            this._instance = new TestController(TestService.getInstance())
        }
        return this._instance
    }

    /**
     * This controller method is about to call testService start function with the request body
     * and the authenticated user's id, returning the user's already unfinished test if one
     * exists instead of starting a second one. A fresh reward is granted for a new test - the
     * client does not supply one.
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[TestController] start')
    public async start(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const { taskType } = req.body
            if (!_.isString(taskType) || _.isEmpty(taskType)) throw new BadRequestError('taskType is required')

            const userId = (req as AppRequest).user.id
            const test: TestStartResult = await this.testService.start(userId, taskType)
            res.json(test)
        } catch (e) {
            next(e)
        }
    }

    /**
     * This controller method is about to call testService end function with id param and the
     * authenticated user's id, setting the test's endedAt
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[TestController] end')
    public async end(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const { id } = req.params
            const userId = (req as AppRequest).user.id
            const test: TestEntity = await this.testService.end(userId, id)
            res.json(test)
        } catch (e) {
            next(e)
        }
    }

    /**
     * This controller method has only one task is to call testService getAll function
     * in order for fetching all test records from the test repository
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[TestController] getAll')
    public async getAll(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const tests: TestEntity[] = await this.testService.getAll()
            res.json(tests)
        } catch (e) {
            next(e)
        }
    }

    /**
     * This controller method is about to call testService getList function with paramaters taken
     * as querystring but before that it perform all of validations what it makes sens on the querystring paramaters
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[TestController] getList')
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

            // calling the testService getList function with the querystring paramaters
            const tests: TestEntity[] = await this.testService.getList(params)
            res.json(tests)
        } catch (e) {
            next(e)
        }
    }

    /**
     * This controller method is about to call testService getById function with id param
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[TestController] getById')
    public async getById(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const { id } = req.params
            const test: TestEntity = await this.testService.getById(id)
            res.json(test)
        } catch (e) {
            next(e)
        }
    }

    /**
     * This controller method is about to call testService delete function with id param
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[TestController] delete')
    public async delete(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const { id } = req.params
            const test: TestEntity = await this.testService.delete(id)
            res.json(test)
        } catch (e) {
            next(e)
        }
    }
}

import { listRequestParams, TaskFailureEntity } from "../types/TaskFailure"
import { loggedMethod, logger } from "../utils/logger/logger"
import { taskFailureRepository } from "../repositories"
import { FindOptions, ITaskFailureRepository, SortOptions } from "../types/repositories"
import { BadRequestError, NotFoundError } from "../utils/error/Error"
import { v4 as uuidv4 } from "uuid"

export class TaskFailureService {
    protected static _instance: TaskFailureService
    constructor(protected taskFailureRepository: ITaskFailureRepository) { }

    /**
     * getInstance function provides that this class work as a singleton
     * @returns
    */
    static getInstance() {
        if (!this._instance) {
            this._instance = new TaskFailureService(taskFailureRepository)
        }
        return this._instance
    }

    /**
     * recordFailure method upserts a (userId, taskId) failure record: if one already
     * exists it increments count, bumps lastFailedAt, and overwrites taskTypeName/errorMessage;
     * otherwise it creates a new record with count 1 and firstFailedAt = lastFailedAt = now.
     * @param {string} userId
     * @param {string} taskId
     * @param {string} taskTypeName
     * @param {string} errorMessage
     * @returns {TaskFailureEntity}
    */
    @loggedMethod('[TaskFailureService] recordFailure')
    public async recordFailure(
        userId: string,
        taskId: string,
        taskTypeName: string,
        errorMessage: string | null = null
    ): Promise<TaskFailureEntity> {
        const existing = await this.taskFailureRepository.findOne({ userId, taskId })
        const now = new Date()

        if (existing) {
            const updated = await this.taskFailureRepository.updateOne(
                { userId, taskId },
                { count: existing.count + 1, lastFailedAt: now, errorMessage, taskTypeName } as Partial<TaskFailureEntity>
            )
            // updateOne is typed Promise<T|null> (it targets an arbitrary filter), but we just
            // confirmed this (userId, taskId) pair exists via findOne above, so this narrows it.
            if (!updated) throw new NotFoundError(`task failure not found: ${userId}/${taskId}`, 'task failure not found')
            return updated
        }

        const created = await this.taskFailureRepository.create({
            id: uuidv4(),
            userId,
            taskId,
            taskTypeName,
            errorMessage,
            count: 1,
            firstFailedAt: now,
            lastFailedAt: now
        } as TaskFailureEntity)
        return created
    }

    /**
     * getAll method take care of fetching all task failures from the db
     * @returns {TaskFailureEntity[]} returns with all TaskFailureEntity via taskFailureRepository
    */
    @loggedMethod('[TaskFailureService] getAll')
    public async getAll(): Promise<TaskFailureEntity[]> {
        const taskFailures = await this.taskFailureRepository.find()
        return taskFailures
    }

    /**
     * getList method take care of fetching task failures from the db
     * based on the offset, limit and the sort paramaters what client define in params attribute
     * @returns {TaskFailureEntity[]} returns with all TaskFailureEntity based on the options via taskFailureRepository
    */
    @loggedMethod('[TaskFailureService] getList')
    public async getList(queryParams: listRequestParams): Promise<TaskFailureEntity[]> {
        const params = this.mapRequestParamToFind(queryParams)
        const taskFailures = await this.taskFailureRepository.findWithParams(params)
        return taskFailures
    }

    /**
     * getById method take care of fetching one task failure based on the id from the db
     * @returns {TaskFailureEntity} returns with the found TaskFailureEntity via taskFailureRepository
    */
    @loggedMethod('[TaskFailureService] getById')
    public async getById(id: string): Promise<TaskFailureEntity> {
        const taskFailure = await this.taskFailureRepository.findOne({ id })
        if (!taskFailure) throw new NotFoundError(`task failure not found: ${id}`, 'task failure not found')
        return taskFailure
    }

    /**
     * delete method take care of deleting one task failure based on the id from the db
     * @returns {TaskFailureEntity} returns with the deleted TaskFailureEntity via taskFailureRepository
    */
    @loggedMethod('[TaskFailureService] delete')
    public async delete(id: string): Promise<TaskFailureEntity> {
        const taskFailure = await this.taskFailureRepository.deleteOne({ id })
        if (!taskFailure) throw new NotFoundError(`task failure not found: ${id}`, 'task failure not found')
        return taskFailure
    }

    /**
     * mapRequestParamToFind method is to map the request paramaters to the findOptions
     * what is needed by the taskFailureRepository
     * @param {listRequestParams} queryParams
     * @returns {findOptions<ITaskFailureRepository>} returns with the mapped findOptions
    */
    @loggedMethod('[TaskFailureService] mapRequestParamToFind')
    private mapRequestParamToFind(queryParams: listRequestParams): FindOptions<TaskFailureEntity> {
        try {
            const validSortArray = (queryParams.sort ?
                queryParams.sort.map(it => JSON.parse(it)) : []
            ) as SortOptions<TaskFailureEntity>[]
            const params = {
                filter: queryParams.filter,
                limit: queryParams.limit,
                offset: queryParams.offset,
                sort: validSortArray
            } as any as FindOptions<TaskFailureEntity>
            return params
        } catch (e) {
            logger.error('[TaskFailureService] mapRequestParamToFind error: ' + e.message)
            throw new BadRequestError(e.message, 'request params are not proper')
        }
    }
}

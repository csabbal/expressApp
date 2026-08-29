import { TestEntity, TestStartResult, listRequestParams } from "../types/Test"
import { loggedMethod, logger } from "../utils/logger/logger"
import { testRepository, rewardRepository } from "../repositories"
import { FindOptions, IRewardRepository, ITestRepository, SortOptions } from "../types/repositories"
import { BadRequestError, NotFoundError } from "../utils/error/Error"
import { v4 as uuidv4 } from "uuid"
import { RewardService } from "./rewardService"

export class TestService {
    protected static _instance: TestService
    constructor(
        protected testRepository: ITestRepository,
        protected rewardRepository: IRewardRepository,
        protected rewardService: RewardService
    ) { }

    /**
     * getInstance function provides that this class work as a singleton
     * @returns
    */
    static getInstance() {
        if (!this._instance) {
            this._instance = new TestService(testRepository, rewardRepository, RewardService.getInstance())
        }
        return this._instance
    }

    /**
     * start method returns the user's already unfinished (no endedAt) test's id if one exists;
     * otherwise it grants a new reward for taskType via rewardService (taskType is a bare
     * string tag, same as taskTypeName elsewhere - no TaskType lookup is done) and creates a
     * new test with startedAt = now referencing that reward. Either way, returns the test's id
     * alongside the granted reward's imageId.
     * @param {string} userId
     * @param {string} taskType
     * @returns {TestStartResult}
    */
    @loggedMethod('[TestService] start')
    public async start(userId: string, taskType: string): Promise<TestStartResult> {
        const unfinished = await this.testRepository.findOne({ userId, endedAt: null } as Partial<TestEntity>)
        if (unfinished) {
            const existingReward = await this.rewardRepository.findOne({ id: unfinished.rewardId })
            if (!existingReward) {
                throw new NotFoundError(`reward not found: ${unfinished.rewardId}`, 'reward not found')
            }
            return { testId: unfinished.id, imageId: existingReward.imageId }
        }

        const reward = await this.rewardService.grantReward(userId, taskType)

        const test = await this.testRepository.create({
            id: uuidv4(),
            userId,
            taskType,
            rewardId: reward.id,
            startedAt: new Date(),
            endedAt: null
        } as TestEntity)
        return { testId: test.id, imageId: reward.imageId }
    }

    /**
     * end method sets endedAt = now for the given test, provided it belongs to userId and
     * isn't already ended.
     * @param {string} userId
     * @param {string} id
     * @returns {TestEntity}
    */
    @loggedMethod('[TestService] end')
    public async end(userId: string, id: string): Promise<TestEntity> {
        const test = await this.testRepository.findOne({ id })
        if (!test) throw new NotFoundError(`test not found: ${id}`, 'test not found')
        if (test.userId !== userId) throw new BadRequestError('test does not belong to this user')
        if (test.endedAt) throw new BadRequestError('test already ended')

        const updated = await this.testRepository.updateOne({ id }, { endedAt: new Date() } as Partial<TestEntity>)
        if (!updated) throw new NotFoundError(`test not found: ${id}`, 'test not found')
        return updated
    }

    /**
     * getAll method take care of fetching all test records from the db
     * @returns {TestEntity[]} returns with all TestEntity via testRepository
    */
    @loggedMethod('[TestService] getAll')
    public async getAll(): Promise<TestEntity[]> {
        const tests = await this.testRepository.find()
        return tests
    }

    /**
     * getList method take care of fetching test records from the db
     * based on the offset, limit and the sort paramaters what client define in params attribute
     * @returns {TestEntity[]} returns with all TestEntity based on the options via testRepository
    */
    @loggedMethod('[TestService] getList')
    public async getList(queryParams: listRequestParams): Promise<TestEntity[]> {
        const params = this.mapRequestParamToFind(queryParams)
        const tests = await this.testRepository.findWithParams(params)
        return tests
    }

    /**
     * getById method take care of fetching one test record based on the id from the db
     * @returns {TestEntity} returns with the found TestEntity via testRepository
    */
    @loggedMethod('[TestService] getById')
    public async getById(id: string): Promise<TestEntity> {
        const test = await this.testRepository.findOne({ id })
        if (!test) throw new NotFoundError(`test not found: ${id}`, 'test not found')
        return test
    }

    /**
     * delete method take care of deleting one test record based on the id from the db
     * @returns {TestEntity} returns with the deleted TestEntity via testRepository
    */
    @loggedMethod('[TestService] delete')
    public async delete(id: string): Promise<TestEntity> {
        const test = await this.testRepository.deleteOne({ id })
        if (!test) throw new NotFoundError(`test not found: ${id}`, 'test not found')
        return test
    }

    /**
     * mapRequestParamToFind method is to map the request paramaters to the findOptions
     * what is needed by the testRepository
     * @param {listRequestParams} queryParams
     * @returns {findOptions<ITestRepository>} returns with the mapped findOptions
    */
    @loggedMethod('[TestService] mapRequestParamToFind')
    private mapRequestParamToFind(queryParams: listRequestParams): FindOptions<TestEntity> {
        try {
            const validSortArray = (queryParams.sort ?
                queryParams.sort.map(it => JSON.parse(it)) : []
            ) as SortOptions<TestEntity>[]
            const params = {
                filter: queryParams.filter,
                limit: queryParams.limit,
                offset: queryParams.offset,
                sort: validSortArray
            } as any as FindOptions<TestEntity>
            return params
        } catch (e) {
            logger.error('[TestService] mapRequestParamToFind error: ' + e.message)
            throw new BadRequestError(e.message, 'request params are not proper')
        }
    }
}

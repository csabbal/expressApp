import { TaskSuccessEntity } from "../types/TaskSuccess"
import { loggedMethod } from "../utils/logger/logger"
import { taskSuccessRepository } from "../repositories"
import { ITaskSuccessRepository } from "../types/repositories"
import { NotFoundError } from "../utils/error/Error"
import { v4 as uuidv4 } from "uuid"

export class TaskSuccessService {
    protected static _instance: TaskSuccessService
    constructor(protected taskSuccessRepository: ITaskSuccessRepository) { }

    /**
     * getInstance function provides that this class work as a singleton
     * @returns
    */
    static getInstance() {
        if (!this._instance) {
            this._instance = new TaskSuccessService(taskSuccessRepository)
        }
        return this._instance
    }

    /**
     * recordSuccess method upserts a (userId, taskId, testId) solved-task record: if one
     * already exists it just bumps solvedAt, otherwise it creates a new record.
     * @param {string} userId
     * @param {string} taskId
     * @param {string} taskTypeName
     * @param {string} testId
     * @returns {TaskSuccessEntity}
    */
    @loggedMethod('[TaskSuccessService] recordSuccess')
    public async recordSuccess(
        userId: string,
        taskId: string,
        taskTypeName: string,
        testId: string
    ): Promise<TaskSuccessEntity> {
        const existing = await this.taskSuccessRepository.findOne({ userId, taskId, testId })
        const solvedAt = new Date()

        if (existing) {
            const updated = await this.taskSuccessRepository.updateOne(
                { userId, taskId, testId },
                { solvedAt } as Partial<TaskSuccessEntity>
            )
            if (!updated) {
                throw new NotFoundError(
                    `task success not found: ${userId}/${taskId}/${testId}`, 'task success not found'
                )
            }
            return updated
        }

        const created = await this.taskSuccessRepository.create({
            id: uuidv4(),
            userId,
            taskId,
            testId,
            taskTypeName,
            solvedAt
        } as TaskSuccessEntity)
        return created
    }
}

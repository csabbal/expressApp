import { FileEntity } from "../types/File"
import { RewardEntity } from "../types/Reward"
import { loggedMethod } from "../utils/logger/logger"
import { rewardRepository } from "../repositories"
import { IRewardRepository } from "../types/repositories"
import { NotFoundError } from "../utils/error/Error"
import { v4 as uuidv4 } from "uuid"
import { FileService } from "./fileService"

export class RewardService {
    protected static _instance: RewardService
    constructor(protected rewardRepository: IRewardRepository, protected fileService: FileService) { }

    /**
     * getInstance function provides that this class work as a singleton
     * @returns
    */
    static getInstance() {
        if (!this._instance) {
            this._instance = new RewardService(rewardRepository, FileService.getInstance())
        }
        return this._instance
    }

    /**
     * grantReward method picks one random 'taskType'-category file the given user hasn't
     * already won, records the win, and returns the created reward record
     * @param {string} userId
     * @param {string} category
     * @param {Date} startedAt
     * @returns {RewardEntity}
    */
    @loggedMethod('[RewardService] grantReward')
    public async grantReward(userId: string, category: string, startedAt: Date): Promise<RewardEntity> {
        const unwonPool = await this.getUnwonPool(userId)
        if (unwonPool.length === 0) throw new NotFoundError('no reward available', 'no reward available')

        const picked = unwonPool[Math.floor(Math.random() * unwonPool.length)]
        const reward = await this.rewardRepository.create({
            id: uuidv4(),
            userId,
            imageId: picked.id,
            category,
            startedAt,
            wonAt: new Date()
        } as RewardEntity)
        return reward
    }

    /**
     * getWonImageIds method returns the ids of every image the given user has already won
     * @param {string} userId
     * @returns {string[]}
    */
    @loggedMethod('[RewardService] getWonImageIds')
    public async getWonImageIds(userId: string): Promise<string[]> {
        const rewards = await this.rewardRepository.find({ userId })
        return rewards.map(reward => reward.imageId)
    }

    /**
     * getAvailableImageIds method returns the ids of every 'taskType'-category image the
     * given user has not won yet
     * @param {string} userId
     * @returns {string[]}
    */
    @loggedMethod('[RewardService] getAvailableImageIds')
    public async getAvailableImageIds(userId: string): Promise<string[]> {
        const unwonPool = await this.getUnwonPool(userId)
        return unwonPool.map(file => file.id)
    }

    /**
     * getUnwonPool method resolves the full 'taskType'-category file pool, then filters out
     * every image the given user has already won. Shared by grantReward and
     * getAvailableImageIds, which both need exactly this computation.
     * @param {string} userId
     * @returns {FileEntity[]}
    */
    private async getUnwonPool(userId: string): Promise<FileEntity[]> {
        const pool = await this.fileService.getAllFiles('taskType')
        const wonImageIds = new Set((await this.rewardRepository.find({ userId })).map(reward => reward.imageId))
        return pool.filter(file => !wonImageIds.has(file.id))
    }
}

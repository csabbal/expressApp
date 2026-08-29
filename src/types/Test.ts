import { IEntity } from "./repositories"

export interface TestEntity extends IEntity {
    userId: string,
    taskType: string,
    rewardId: string,
    startedAt: Date,
    endedAt: Date | null
}

export interface TestStartResult {
    testId: string,
    imageId: string
}

export interface listRequestParams {
    filter?: string,
    limit?: number,
    offset?: number,
    sort?: string[]
}

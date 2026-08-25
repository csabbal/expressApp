import { IEntity } from "./repositories"

export interface TaskFailureEntity extends IEntity {
    userId: string,
    taskId: string,
    taskTypeName: string,
    errorMessage: string | null,
    count: number,
    firstFailedAt: Date,
    lastFailedAt: Date
}

export interface listRequestParams {
    filter?: string,
    limit?: number,
    offset?: number,
    sort?: string[]
}

import { IEntity } from "./repositories"

export interface TaskSuccessEntity extends IEntity {
    userId: string,
    taskId: string,
    testId: string,
    taskTypeName: string,
    solvedAt: Date
}

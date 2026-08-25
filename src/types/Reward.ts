import { IEntity } from "./repositories"

export interface RewardEntity extends IEntity {
    userId: string,
    imageId: string,
    category: string,
    startedAt: Date,
    wonAt: Date
}

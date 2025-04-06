import { UserEntity } from "../types/User"
import { Repository } from "./Repository"


/**
 * This class is to take care about the handling of users in the database
 */
export class UserRepository<T extends UserEntity = UserEntity> extends Repository<T> {
    async find(data?: Partial<T>): Promise<T[]> {
        return await this.model.find(data).select('id name')
    }
}

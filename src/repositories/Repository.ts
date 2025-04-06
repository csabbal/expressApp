import mongoose from 'mongoose'
import { FindOptions, IEntity, IRepository } from '../types/repositories'
import { MovieEntity } from '../types/Movie'
import { logger } from '../utils/logger/logger'

/**
 * This class is the parent class of all class what's task is to take care about the handling
 * of one of the entities in the database
 */
export class Repository<T extends IEntity = IEntity> implements IRepository {

    constructor(protected model: mongoose.Model<T>) { }

    async find(data?: Partial<T>): Promise<T[]> {
        return await this.model.find(data)
    }

    async findWithParams(data?: Partial<MovieEntity> | FindOptions<T>): Promise<T[]> {

        const { limit, offset, sort, ...otherFindParams } = data as FindOptions<T>
        const query = this.model.find(otherFindParams)

        if (offset) query.skip(offset)
        if (limit) query.limit(limit)
        if (sort) {
            logger.info('[Repository] findWithParams sort ' + JSON.stringify(sort))
            const sortOptions = {} as any as Record<keyof T,string>
            for(const option in sort) {
                const { direction, field } = sort[option]
                sortOptions[field] = direction
            }
            query.sort(sortOptions as any)
        }
        return await query.exec()
    }

    async findOne(data: Partial<T>): Promise<T> {
        return await this.model.findOne(data)
    }

    async create(data: T): Promise<T> {
        return await this.model.create(data)
    }
}



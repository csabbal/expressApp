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

    getFindParams(otherFindParams: { filter: string }) {
        const stringFields:string[] = []
        const numberFields:string[] = []
        const filter = otherFindParams.filter
        if (!filter) return {}
       this.model.schema.eachPath((path, schemaType) => {
        if (["_id", "__v"].includes(path)) return

        if (schemaType.instance === "String") {
            stringFields.push(path)
        } else if (schemaType.instance === "Number") {
            numberFields.push(path)
        }
        })

        const orConditions = [
        ...stringFields.map(field => ({
            [field]: { $regex: filter, $options: "i" }
        })),
        ...numberFields.map(field => ({
            $expr: {
            $regexMatch: {
                input: { $toString: `$${field}` },
                regex: filter,
                options: "i"
            }
            }
        }))]

        return { $or: orConditions }
    }

    async find(data?: Partial<T>): Promise<T[]> {
        return await this.model.find(data)
    }

    async findWithParams(data?: Partial<MovieEntity> | FindOptions<T>): Promise<T[]> {

        const { limit, offset, sort, ...otherFindParams } = data as FindOptions<T>
        const findParams = this.getFindParams(otherFindParams as any)
        const query = this.model.find(findParams as any)

        if (offset) query.skip(offset)
        if (limit) query.limit(limit)
        if (sort) {
            logger.info('[Repository] findWithParams sort ' + JSON.stringify(sort))
            const sortOptions = {} as any as Record<keyof T, string>
            for (const option in sort) {
                const { direction, field } = sort[option]
                sortOptions[field] = direction
            }
            query.sort(sortOptions as any)
        }
        return await query.exec()
    }

    async findOne(data: Partial<T>): Promise<T | null> {
        return await this.model.findOne(data)
    }

    async create(data: T): Promise<T> {
        return await this.model.create(data)
    }

    async updateOne(filter: Partial<T>, data: Partial<T>): Promise<T | null> {
        return await this.model.findOneAndUpdate(filter, data, { new: true })
    }

    async deleteOne(filter: Partial<T>): Promise<T | null> {
        return await this.model.findOneAndDelete(filter)
    }
}



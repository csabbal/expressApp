import { listRequestParams, SubtractionInMoreStepsEntity } from "../types/SubtractionInMoreSteps"
import { loggedMethod, logger } from "../utils/logger/logger"
import { subtractionInMoreStepsRepository } from "../repositories"
import { FindOptions, ISubtractionInMoreStepsRepository, SortOptions } from "../types/repositories"
import { BadRequestError, NotFoundError } from "../utils/error/Error"
import { v4 as uuidv4 } from "uuid"

export class SubtractionInMoreStepsService {
    protected static _instance: SubtractionInMoreStepsService
    constructor(protected subtractionInMoreStepsRepository: ISubtractionInMoreStepsRepository) { }

    /**
     * getInstance function provides that this class work as a singleton
     * @returns
    */
    static getInstance() {
        if (!this._instance) {
            this._instance = new SubtractionInMoreStepsService(subtractionInMoreStepsRepository)
        }
        return this._instance
    }

    /**
     * getAll method take care of fetching all subtractionInMoreSteps items from the db
     * @returns {SubtractionInMoreStepsEntity[]} returns with all items via subtractionInMoreStepsRepository
    */
    @loggedMethod('[SubtractionInMoreStepsService] getAll')
    public async getAll(): Promise<SubtractionInMoreStepsEntity[]> {
        const items = await this.subtractionInMoreStepsRepository.find()
        return items
    }

    /**
     * getList method take care of fetching subtractionInMoreSteps items from the db
     * based on the offset, limit and the sort paramaters what client define in params attribute
     * @returns {SubtractionInMoreStepsEntity[]} returns with items based on the options
    */
    @loggedMethod('[SubtractionInMoreStepsService] getList')
    public async getList(queryParams: listRequestParams): Promise<SubtractionInMoreStepsEntity[]> {
        const params = this.mapRequestParamToFind(queryParams)
        const items = await this.subtractionInMoreStepsRepository.findWithParams(params)
        return items
    }

    /**
     * getById method take care of fetching one subtractionInMoreSteps item based on the id from the db
     * @returns {SubtractionInMoreStepsEntity} returns with the found item
    */
    @loggedMethod('[SubtractionInMoreStepsService] getById')
    public async getById(id: string): Promise<SubtractionInMoreStepsEntity> {
        const item = await this.subtractionInMoreStepsRepository.findOne({ id })
        if (!item) throw new NotFoundError(`subtractionInMoreSteps item not found: ${id}`, 'subtraction item not found')
        return item
    }

    /**
     * create method take care of creating a new subtractionInMoreSteps entry in the db
     * @returns {SubtractionInMoreStepsEntity} returns with the created item
    */
    @loggedMethod('[SubtractionInMoreStepsService] create')
    public async create(data: Partial<SubtractionInMoreStepsEntity>): Promise<SubtractionInMoreStepsEntity> {
        const item = await this.subtractionInMoreStepsRepository.create(
            { ...data, id: uuidv4() } as SubtractionInMoreStepsEntity
        )
        return item
    }

    /**
     * update method take care of updating one subtractionInMoreSteps item based on the id from the db
     * @returns {SubtractionInMoreStepsEntity|null} returns with the updated item
    */
    @loggedMethod('[SubtractionInMoreStepsService] update')
    public async update(
        id: string, data: Partial<SubtractionInMoreStepsEntity>
    ): Promise<SubtractionInMoreStepsEntity> {
        const item = await this.subtractionInMoreStepsRepository.updateOne({ id }, data)
        if (!item) throw new NotFoundError(`subtractionInMoreSteps item not found: ${id}`, 'subtraction item not found')
        return item
    }

    /**
     * delete method take care of deleting one subtractionInMoreSteps item based on the id from the db
     * @returns {SubtractionInMoreStepsEntity} returns with the deleted item
    */
    @loggedMethod('[SubtractionInMoreStepsService] delete')
    public async delete(id: string): Promise<SubtractionInMoreStepsEntity> {
        const item = await this.subtractionInMoreStepsRepository.deleteOne({ id })
        if (!item) throw new NotFoundError(`subtractionInMoreSteps item not found: ${id}`, 'subtraction item not found')
        return item
    }

    /**
     * mapRequestParamToFind method is to map the request paramaters to the findOptions
     * what is needed by the subtractionInMoreStepsRepository
     * @param {listRequestParams} queryParams
     * @returns {findOptions<ISubtractionInMoreStepsRepository>} returns with the mapped findOptions
    */
    @loggedMethod('[SubtractionInMoreStepsService] mapRequestParamToFind')
    private mapRequestParamToFind(queryParams: listRequestParams): FindOptions<SubtractionInMoreStepsEntity> {
        try {
            const validSortArray = (queryParams.sort ?
                queryParams.sort.map(it => JSON.parse(it)) : []
            ) as SortOptions<SubtractionInMoreStepsEntity>[]
            const params = {
                filter: queryParams.filter,
                limit: queryParams.limit,
                offset: queryParams.offset,
                sort: validSortArray
            } as any as FindOptions<SubtractionInMoreStepsEntity>
            return params
        } catch (e) {
            logger.error('[SubtractionInMoreStepsService] mapRequestParamToFind error: ' + e.message)
            throw new BadRequestError(e.message, 'request params are not proper')
        }
    }
}

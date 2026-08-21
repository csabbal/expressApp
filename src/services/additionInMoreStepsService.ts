import { AdditionInMoreStepsEntity, listRequestParams } from "../types/AdditionInMoreSteps"
import { loggedMethod, logger } from "../utils/logger/logger"
import { additionInMoreStepsRepository } from "../repositories"
import { FindOptions, IAdditionInMoreStepsRepository, SortOptions } from "../types/repositories"
import { BadRequestError, NotFoundError } from "../utils/error/Error"
import { v4 as uuidv4 } from "uuid"

export class AdditionInMoreStepsService {
    protected static _instance: AdditionInMoreStepsService
    constructor(protected additionInMoreStepsRepository: IAdditionInMoreStepsRepository) { }

    /**
     * getInstance function provides that this class work as a singleton
     * @returns
    */
    static getInstance() {
        if (!this._instance) {
            this._instance = new AdditionInMoreStepsService(additionInMoreStepsRepository)
        }
        return this._instance
    }

    /**
     * getAll method take care of fetching all additionInMoreSteps items from the db
     * @returns {AdditionInMoreStepsEntity[]} returns with all items via additionInMoreStepsRepository
    */
    @loggedMethod('[AdditionInMoreStepsService] getAll')
    public async getAll(): Promise<AdditionInMoreStepsEntity[]> {
        const items = await this.additionInMoreStepsRepository.find()
        return items
    }

    /**
     * getList method take care of fetching additionInMoreSteps items from the db
     * based on the offset, limit and the sort paramaters what client define in params attribute
     * @returns {AdditionInMoreStepsEntity[]} returns with items based on the options
    */
    @loggedMethod('[AdditionInMoreStepsService] getList')
    public async getList(queryParams: listRequestParams): Promise<AdditionInMoreStepsEntity[]> {
        const params = this.mapRequestParamToFind(queryParams)
        const items = await this.additionInMoreStepsRepository.findWithParams(params)
        return items
    }

    /**
     * getById method take care of fetching one additionInMoreSteps item based on the id from the db
     * @returns {AdditionInMoreStepsEntity} returns with the found item
    */
    @loggedMethod('[AdditionInMoreStepsService] getById')
    public async getById(id: string): Promise<AdditionInMoreStepsEntity> {
        const item = await this.additionInMoreStepsRepository.findOne({ id })
        if (!item) throw new NotFoundError(`additionInMoreSteps item not found: ${id}`, 'addition item not found')
        return item
    }

    /**
     * create method take care of creating a new additionInMoreSteps entry in the db
     * @returns {AdditionInMoreStepsEntity} returns with the created item
    */
    @loggedMethod('[AdditionInMoreStepsService] create')
    public async create(data: Partial<AdditionInMoreStepsEntity>): Promise<AdditionInMoreStepsEntity> {
        const item = await this.additionInMoreStepsRepository.create(
            { ...data, id: uuidv4() } as AdditionInMoreStepsEntity
        )
        return item
    }

    /**
     * update method take care of updating one additionInMoreSteps item based on the id from the db
     * @returns {AdditionInMoreStepsEntity|null} returns with the updated item
    */
    @loggedMethod('[AdditionInMoreStepsService] update')
    public async update(id: string, data: Partial<AdditionInMoreStepsEntity>): Promise<AdditionInMoreStepsEntity> {
        const item = await this.additionInMoreStepsRepository.updateOne({ id }, data)
        if (!item) throw new NotFoundError(`additionInMoreSteps item not found: ${id}`, 'addition item not found')
        return item
    }

    /**
     * delete method take care of deleting one additionInMoreSteps item based on the id from the db
     * @returns {AdditionInMoreStepsEntity} returns with the deleted item
    */
    @loggedMethod('[AdditionInMoreStepsService] delete')
    public async delete(id: string): Promise<AdditionInMoreStepsEntity> {
        const item = await this.additionInMoreStepsRepository.deleteOne({ id })
        if (!item) throw new NotFoundError(`additionInMoreSteps item not found: ${id}`, 'addition item not found')
        return item
    }

    /**
     * mapRequestParamToFind method is to map the request paramaters to the findOptions
     * what is needed by the additionInMoreStepsRepository
     * @param {listRequestParams} queryParams
     * @returns {findOptions<IAdditionInMoreStepsRepository>} returns with the mapped findOptions
    */
    @loggedMethod('[AdditionInMoreStepsService] mapRequestParamToFind')
    private mapRequestParamToFind(queryParams: listRequestParams): FindOptions<AdditionInMoreStepsEntity> {
        try {
            const validSortArray = (queryParams.sort ?
                queryParams.sort.map(it => JSON.parse(it)) : []
            ) as SortOptions<AdditionInMoreStepsEntity>[]
            const params = {
                filter: queryParams.filter,
                limit: queryParams.limit,
                offset: queryParams.offset,
                sort: validSortArray
            } as any as FindOptions<AdditionInMoreStepsEntity>
            return params
        } catch (e) {
            logger.error('[AdditionInMoreStepsService] mapRequestParamToFind error: ' + e.message)
            throw new BadRequestError(e.message, 'request params are not proper')
        }
    }
}

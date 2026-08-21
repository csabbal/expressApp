import { listRequestParams, TaskTypeEntity } from "../types/TaskType"
import { loggedMethod, logger } from "../utils/logger/logger"
import { taskTypeRepository } from "../repositories"
import { FindOptions, ITaskTypeRepository, SortOptions } from "../types/repositories"
import { BadRequestError, NotFoundError } from "../utils/error/Error"
import { v4 as uuidv4 } from "uuid"
import { FileService } from "./fileService"

export class TaskTypeService {
    protected static _instance: TaskTypeService
    constructor(protected taskTypeRepository: ITaskTypeRepository, protected fileService: FileService) { }

    /**
     * getInstance function provides that this class work as a singleton
     * @returns
    */
    static getInstance() {
        if (!this._instance) {
            this._instance = new TaskTypeService(taskTypeRepository, FileService.getInstance())
        }
        return this._instance
    }

    /**
     * uploadImage method stores the given file under the 'taskType' category via fileService,
     * then updates the task type record to reference the resulting file's id
     * @param {string} id
     * @param {Express.Multer.File} file
     * @param {string} uploadedBy
     * @returns {TaskTypeEntity|null}
    */
    public async uploadImage(
        id: string,
        file: Express.Multer.File,
        uploadedBy: string
    ): Promise<TaskTypeEntity | null> {
        logger.info('[TaskTypeService] uploadImage ' + id)
        const existingTaskType = await this.taskTypeRepository.findOne({ id })
        if (!existingTaskType) throw new NotFoundError(`task type not found: ${id}`, 'task type not found')
        const fileEntity = await this.fileService.uploadFile(file, { category: 'taskType', uploadedBy })
        const taskType = await this.taskTypeRepository.updateOne({ id }, { image: fileEntity.id } as Partial<TaskTypeEntity>)
        return taskType
    }

    /**
     * streamImage method resolves the physical file to stream for a task type's image,
     * delegating the quality-based path resolution to fileService
     * @param {string} id
     * @param {'low'|'high'} quality
     * @returns {{path: string, mimeType: string, originalName: string}}
    */
    public async streamImage(
        id: string,
        quality: 'low' | 'high'
    ): Promise<{ path: string, mimeType: string, originalName: string }> {
        const taskType = await this.taskTypeRepository.findOne({ id })
        if (!taskType) throw new NotFoundError(`task type not found: ${id}`, 'task type not found')
        if (!taskType.image) throw new NotFoundError(`task type has no image: ${id}`, 'task type has no image')

        return await this.fileService.getDownloadTarget(taskType.image, quality)
    }

    /**
     * getAll method take care of fetching all task types from the db
     * @returns {TaskTypeEntity[]} returns with all TaskTypeEntity via taskTypeRepository
    */
    @loggedMethod('[TaskTypeService] getAll')
    public async getAll(): Promise<TaskTypeEntity[]> {
        const taskTypes = await this.taskTypeRepository.find()
        return taskTypes
    }

    /**
     * getList method take care of fetching task types from the db
     * based on the offset, limit and the sort paramaters what client define in params attribute
     * @returns {TaskTypeEntity[]} returns with all TaskTypeEntity based on the options via taskTypeRepository
    */
    @loggedMethod('[TaskTypeService] getList')
    public async getList(queryParams: listRequestParams): Promise<TaskTypeEntity[]> {
        const params = this.mapRequestParamToFind(queryParams)
        const taskTypes = await this.taskTypeRepository.findWithParams(params)
        return taskTypes
    }

    /**
     * getById method take care of fetching one task type based on the id from the db
     * @returns {TaskTypeEntity} returns with the found TaskTypeEntity via taskTypeRepository
    */
    @loggedMethod('[TaskTypeService] getById')
    public async getById(id: string): Promise<TaskTypeEntity> {
        const taskType = await this.taskTypeRepository.findOne({ id })
        if (!taskType) throw new NotFoundError(`task type not found: ${id}`, 'task type not found')
        return taskType
    }

    /**
     * create method take care of creating a new task type entry in the db
     * @returns {TaskTypeEntity} returns with the created TaskTypeEntity via taskTypeRepository
    */
    @loggedMethod('[TaskTypeService] create')
    public async create(data: Partial<TaskTypeEntity>): Promise<TaskTypeEntity> {
        const taskType = await this.taskTypeRepository.create({ ...data, id: uuidv4() } as TaskTypeEntity)
        return taskType
    }

    /**
     * update method take care of updating one task type based on the id from the db
     * @returns {TaskTypeEntity|null} returns with the updated TaskTypeEntity via taskTypeRepository
    */
    @loggedMethod('[TaskTypeService] update')
    public async update(id: string, data: Partial<TaskTypeEntity>): Promise<TaskTypeEntity> {
        const taskType = await this.taskTypeRepository.updateOne({ id }, data)
        if (!taskType) throw new NotFoundError(`task type not found: ${id}`, 'task type not found')
        return taskType
    }

    /**
     * delete method take care of deleting one task type based on the id from the db
     * @returns {TaskTypeEntity} returns with the deleted TaskTypeEntity via taskTypeRepository
    */
    @loggedMethod('[TaskTypeService] delete')
    public async delete(id: string): Promise<TaskTypeEntity> {
        const taskType = await this.taskTypeRepository.deleteOne({ id })
        if (!taskType) throw new NotFoundError(`task type not found: ${id}`, 'task type not found')
        return taskType
    }

    /**
     * mapRequestParamToFind method is to map the request paramaters to the findOptions
     * what is needed by the taskTypeRepository
     * @param {listRequestParams} queryParams
     * @returns {findOptions<ITaskTypeRepository>} returns with the mapped findOptions
    */
    @loggedMethod('[TaskTypeService] mapRequestParamToFind')
    private mapRequestParamToFind(queryParams: listRequestParams): FindOptions<TaskTypeEntity> {
        try {
            const validSortArray = (queryParams.sort ?
                queryParams.sort.map(it => JSON.parse(it)) : []
            ) as SortOptions<TaskTypeEntity>[]
            const params = {
                filter: queryParams.filter,
                limit: queryParams.limit,
                offset: queryParams.offset,
                sort: validSortArray
            } as any as FindOptions<TaskTypeEntity>
            return params
        } catch (e) {
            logger.error('[TaskTypeService] mapRequestParamToFind error: ' + e.message)
            throw new BadRequestError(e.message, 'request params are not proper')
        }
    }
}

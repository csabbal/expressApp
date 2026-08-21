import { MovieEntity } from "./Movie"
import { PermissionEntity, UserPermissionsEntity } from "./Permission"
import { UserEntity } from "./User"
import { FileEntity } from "./File"
import { TaskTypeEntity } from "./TaskType"
import { AdditionInMoreStepsEntity } from "./AdditionInMoreSteps"
import { SubtractionInMoreStepsEntity } from "./SubtractionInMoreSteps"


export interface IEntity {
    id: string
}

export interface SortOptions<T extends IEntity = IEntity> {
    direction: 'asc' | 'desc'
    field: keyof T
}
export interface FindOptions<T extends IEntity = IEntity> {
    limit?: number
    offset?: number
    filter?: string
    sort?: SortOptions<T>[]
}

export interface IRepository<T extends IEntity = IEntity> {
    find(data?: Partial<T>): Promise<T[]>
    findOne(data: Partial<T>): Promise<T|null>
    create(data: any): Promise<any>
    findWithParams(data?: Partial<T> | FindOptions<T>): Promise<T[]>
    updateOne(filter: Partial<T>, data: Partial<T>): Promise<T|null>
    deleteOne(filter: Partial<T>): Promise<T|null>
}

// [INFRASTRUCTURE] Keep these — required for auth to work
export interface IUserRepository<T extends UserEntity=UserEntity> extends IRepository<T> {}
export interface IUserPermissionsRepository<T extends UserPermissionsEntity> extends IRepository<T> {}
export interface IPermissionRepository<T extends PermissionEntity> extends IRepository<T> {}
export interface IFileRepository<T extends FileEntity=FileEntity> extends IRepository<T> {}

// [EXAMPLE] Remove and add your own domain repository interfaces
export interface IMovieRepository<T extends MovieEntity=MovieEntity> extends IRepository<T> {}

// [EXAMPLE]
export interface ITaskTypeRepository<T extends TaskTypeEntity=TaskTypeEntity> extends IRepository<T> {}
export interface IAdditionInMoreStepsRepository<
    T extends AdditionInMoreStepsEntity=AdditionInMoreStepsEntity
> extends IRepository<T> {}
export interface ISubtractionInMoreStepsRepository<
    T extends SubtractionInMoreStepsEntity=SubtractionInMoreStepsEntity
> extends IRepository<T> {}

export interface IRepositories {
    // [INFRASTRUCTURE] Keep these — required for auth to work
    User?: IUserRepository<UserEntity>
    Permission?: IPermissionRepository<PermissionEntity>
    UserPermissions?: IUserPermissionsRepository<UserPermissionsEntity>
    File?: IFileRepository<FileEntity>

    // ================================================================
    // [BUSINESS] Add your domain repository types here.
    // When bootstrapping a new app: remove Movie/TaskType/AdditionInMoreSteps/
    // SubtractionInMoreSteps below and add your own.
    // ================================================================
    Movie?: IMovieRepository<MovieEntity> // [EXAMPLE]
    TaskType?: ITaskTypeRepository<TaskTypeEntity> // [EXAMPLE]
    AdditionInMoreSteps?: IAdditionInMoreStepsRepository<AdditionInMoreStepsEntity> // [EXAMPLE]
    SubtractionInMoreSteps?: ISubtractionInMoreStepsRepository<SubtractionInMoreStepsEntity> // [EXAMPLE]
}
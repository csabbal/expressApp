import { MovieEntity } from "./Movie"
import { PermissionEntity, UserPermissionsEntity } from "./Permission"
import { UserEntity } from "./User"


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
}

// [INFRASTRUCTURE] Keep these — required for auth to work
export interface IUserRepository<T extends UserEntity=UserEntity> extends IRepository<T> {}
export interface IUserPermissionsRepository<T extends UserPermissionsEntity> extends IRepository<T> {}
export interface IPermissionRepository<T extends PermissionEntity> extends IRepository<T> {}

// [EXAMPLE] Remove and add your own domain repository interfaces
export interface IMovieRepository<T extends MovieEntity=MovieEntity> extends IRepository<T> {}

export interface IRepositories {
    // [INFRASTRUCTURE] Keep these — required for auth to work
    User?: IUserRepository<UserEntity>
    Permission?: IPermissionRepository<PermissionEntity>
    UserPermissions?: IUserPermissionsRepository<UserPermissionsEntity>

    // ================================================================
    // [BUSINESS] Add your domain repository types here.
    // When bootstrapping a new app: remove Movie and add your own.
    // ================================================================
    Movie?: IMovieRepository<MovieEntity> // [EXAMPLE]
}
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
    sort?: SortOptions<T>[]
}

export interface IRepository<T extends IEntity = IEntity> {
    find(data?: Partial<T>): Promise<T[]>
    findOne(data: Partial<T>): Promise<T>
    create(data: any): Promise<any>
    findWithParams(data?: Partial<T> | FindOptions<T>): Promise<T[]>
}

export interface IUserRepository<T extends UserEntity=UserEntity> extends IRepository<T> {}

export interface IMovieRepository<T extends MovieEntity=MovieEntity> extends IRepository<T> {}

export interface IUserPermissionsRepository<T extends UserPermissionsEntity> extends IRepository<T> {}

export interface IPermissionRepository<T extends PermissionEntity> extends IRepository<T> {}

export interface IRepositories {
    User?: IUserRepository<UserEntity>,
    Permission?: IPermissionRepository<PermissionEntity>,
    UserPermissions?: IUserPermissionsRepository<UserPermissionsEntity>,
    Movie?: IMovieRepository<MovieEntity>
}
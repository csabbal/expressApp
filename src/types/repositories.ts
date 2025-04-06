


export interface IRepository {
    find(data?: Partial<any>): Promise<any[]>
    findOne(data: Partial<any>): Promise<any>
    create(data: any): Promise<any>
}

export interface IUserRepository extends IRepository { }

export interface IMovieRepository extends IRepository { }

export interface IUserPermissionsRepository extends IRepository { }

export interface IPermissionRepository extends IRepository { }

export interface IRepositories {
    User?: IUserRepository,
    Permission?: IPermissionRepository,
    UserPermissions?: IUserPermissionsRepository,
    Movie?: IMovieRepository
}
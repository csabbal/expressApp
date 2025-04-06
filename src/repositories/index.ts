import dotenv from 'dotenv'
import { PermissionModel } from "../entities/Permissions.schema"
import { UserModel } from "../entities/User.schema"
import { MovieModel } from "../entities/Movie.schema"
import { UserPermissionsModel } from "../entities/UserPermissions.schema"
import { PermissionRepository } from "./Permission.repository"
import { UserRepository } from "./User.repository"
import { MovieRepository } from "./Movie.repository"
import { UserPermissionsRepository } from "./UserPermissions.repository"
import { IRepositories } from "../types/repositories"
dotenv.config()
const { DB_TYPE: type } = process.env


export class RepositoryFactory {
    repositories: IRepositories = {} as any
    constructor(protected type: string) { }

    create() {
        switch (this.type) {
            case 'mongo':
                this.repositories.User = new UserRepository(UserModel)
                this.repositories.Permission = new PermissionRepository(PermissionModel)
                this.repositories.UserPermissions = new UserPermissionsRepository(UserPermissionsModel)
                this.repositories.Movie = new MovieRepository(MovieModel)
                break
            default:
                throw new Error('database type is unknown')
        }
    }

}
function initRepositories(type: string = 'mongo') {
    const factory = new RepositoryFactory(type)
    factory.create()
    return factory.repositories
}
const repositories = initRepositories(type)

export const userRepository = repositories.User
export const permissionRepository = repositories.Permission
export const userPermissionsRepository = repositories.UserPermissions
export const movieRepository = repositories.Movie
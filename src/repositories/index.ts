import dotenv from 'dotenv'
import { PermissionModel } from "../entities/Permissions.schema"
import { UserModel } from "../entities/User.schema"
import { MovieModel } from "../entities/Movie.schema"
import { UserPermissionsModel } from "../entities/UserPermissions.schema"
import { FileModel } from "../entities/File.schema"
import { PermissionRepository } from "./Permission.repository"
import { UserRepository } from "./User.repository"
import { MovieRepository } from "./Movie.repository"
import { UserPermissionsRepository } from "./UserPermissions.repository"
import { FileRepository } from "./File.repository"
import { IRepositories } from "../types/repositories"
dotenv.config()
const { DB_TYPE: type } = process.env


export class RepositoryFactory {
    repositories: IRepositories = {} as any
    constructor(protected type: string) { }

    create() {
        switch (this.type) {
            case 'mongo':
                // [INFRASTRUCTURE] Keep these — required for auth to work
                this.repositories.User = new UserRepository(UserModel)
                this.repositories.Permission = new PermissionRepository(PermissionModel)
                this.repositories.UserPermissions = new UserPermissionsRepository(UserPermissionsModel)

                // ================================================================
                // [BUSINESS] Register your domain repositories here.
                // When bootstrapping a new app: remove the movie lines and add your own.
                // ================================================================
                this.repositories.Movie = new MovieRepository(MovieModel) // [EXAMPLE]
                this.repositories.File = new FileRepository(FileModel)
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

// [INFRASTRUCTURE] Keep these exports
export const userRepository = repositories.User
export const permissionRepository = repositories.Permission
export const userPermissionsRepository = repositories.UserPermissions

// [EXAMPLE] Remove and add your own domain repository exports
export const movieRepository = repositories.Movie
export const fileRepository = repositories.File
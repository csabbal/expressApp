import dotenv from 'dotenv'
import { PermissionModel } from "../entities/Permissions.schema"
import { UserModel } from "../entities/User.schema"
import { MovieModel } from "../entities/Movie.schema"
import { UserPermissionsModel } from "../entities/UserPermissions.schema"
import { FileModel } from "../entities/File.schema"
import { TaskTypeModel } from "../entities/TaskType.schema"
import { AdditionInMoreStepsModel } from "../entities/AdditionInMoreSteps.schema"
import { SubtractionInMoreStepsModel } from "../entities/SubtractionInMoreSteps.schema"
import { PermissionRepository } from "./Permission.repository"
import { UserRepository } from "./User.repository"
import { MovieRepository } from "./Movie.repository"
import { UserPermissionsRepository } from "./UserPermissions.repository"
import { FileRepository } from "./File.repository"
import { TaskTypeRepository } from "./TaskType.repository"
import { AdditionInMoreStepsRepository } from "./AdditionInMoreSteps.repository"
import { SubtractionInMoreStepsRepository } from "./SubtractionInMoreSteps.repository"
import { IRepositories } from "../types/repositories"
dotenv.config()

/**
 * Builds every repository. Every repository implementation here is mongo-only
 * (it wraps a Mongoose Model), so before constructing the repositories backed
 * by a given DataSource, check that DataSource's own <PREFIX>_DB_TYPE - the
 * same way DataSourceFactory.create() (providers/data/index.ts) checks it
 * before building the DataSource itself. Different DataSources can be
 * different types, so there is no single app-wide check to do this with.
 */
export class RepositoryFactory {
    repositories: IRepositories = {} as any

    create() {
        // [INFRASTRUCTURE] Keep these — required for auth to work
        switch (process.env.AUTH_DB_TYPE) {
            case 'mongo':
                this.repositories.User = new UserRepository(UserModel)
                this.repositories.Permission = new PermissionRepository(PermissionModel)
                this.repositories.UserPermissions = new UserPermissionsRepository(UserPermissionsModel)
                break
            default:
                throw new Error('auth database type is unknown')
        }

        switch (process.env.GENERAL_DB_TYPE) { // [INFRASTRUCTURE]
            case 'mongo':
                this.repositories.File = new FileRepository(FileModel)
                break
            default:
                throw new Error('general database type is unknown')
        }

        // ================================================================
        // [BUSINESS] Register your domain repositories here.
        // When bootstrapping a new app: remove the movie/TaskType/
        // AdditionInMoreSteps/SubtractionInMoreSteps cases below and add your own.
        // ================================================================
        switch (process.env.MOVIE_DB_TYPE) { // [EXAMPLE]
            case 'mongo':
                this.repositories.Movie = new MovieRepository(MovieModel)
                break
            default:
                throw new Error('movie database type is unknown')
        }

        // [EXAMPLE] TaskType/AdditionInMoreSteps/SubtractionInMoreSteps are backed
        // by the 'learning' DataSource (see providers/data/index.ts) - their Models
        // are already bound to that connection in their schema files.
        switch (process.env.LEARNING_DB_TYPE) {
            case 'mongo':
                this.repositories.TaskType = new TaskTypeRepository(TaskTypeModel)
                this.repositories.AdditionInMoreSteps =
                    new AdditionInMoreStepsRepository(AdditionInMoreStepsModel)
                this.repositories.SubtractionInMoreSteps =
                    new SubtractionInMoreStepsRepository(SubtractionInMoreStepsModel)
                break
            default:
                throw new Error('learning database type is unknown')
        }
    }

}
function initRepositories() {
    const factory = new RepositoryFactory()
    factory.create()
    return factory.repositories
}
const repositories = initRepositories()

// [INFRASTRUCTURE] Keep these exports
export const userRepository = repositories.User
export const permissionRepository = repositories.Permission
export const userPermissionsRepository = repositories.UserPermissions
export const fileRepository = repositories.File

// [EXAMPLE] Remove and add your own domain repository exports
export const movieRepository = repositories.Movie

// [EXAMPLE] Remove and add your own domain repository exports
export const taskTypeRepository = repositories.TaskType
export const additionInMoreStepsRepository = repositories.AdditionInMoreSteps
export const subtractionInMoreStepsRepository = repositories.SubtractionInMoreSteps

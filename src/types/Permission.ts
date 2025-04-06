import { IEntity } from "./repositories"
import { UserEntity } from "./User"

export interface Permission{
    component:string,
    privilege:string
}

export interface PermissionEntity extends IEntity{
    component:string,
    privilege:string
}

export interface UserPermissionsEntity{
    id:string,
    userId:string,
    permissions:PermissionEntity[]
}

export type GenerateJwt = (user: UserEntity, permissions: PermissionEntity[]) => Promise<string>

export type PermissionEntityArray = PermissionEntity[]
import { UserEntity } from "./User"

export interface PermissionEntity{
    id:string,
    component:string,
    privilege:string
}

export interface UserPermissionsEntity{
    id:string,
    userId:string,
    permissions:PermissionEntity[]
}

export type GenerateJwt = (user: UserEntity, permissions: PermissionEntity[], jwtSecret: string) => Promise<string>

export type PermissionEntityArray = PermissionEntity[]
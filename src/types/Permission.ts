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

export type PermissionEntityArray = PermissionEntity[]
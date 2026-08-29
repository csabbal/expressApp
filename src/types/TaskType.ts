import { IEntity } from "./repositories"

export interface TaskTypeEntity extends IEntity{
    subject: string,
    name: string,
    description: string,
    rating: number
}

export interface listRequestParams{
    filter?:string,
    limit?:number,
    offset?:number,
    sort?:string[]
}

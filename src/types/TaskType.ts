import { IEntity } from "./repositories"

export interface TaskTypeEntity extends IEntity{
    subject: string,
    name: string,
    description: string,
    rating: number,
    image: string | null
}

export interface listRequestParams{
    filter?:string,
    limit?:number,
    offset?:number,
    sort?:string[]
}

import { IEntity } from "./repositories"

export interface AdditionInMoreStepsEntity extends IEntity{
    term1: number,
    term2: number,
    result: number
}

export interface listRequestParams{
    filter?:string,
    limit?:number,
    offset?:number,
    sort?:string[]
}

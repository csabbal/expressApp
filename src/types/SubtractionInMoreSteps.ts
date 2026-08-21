import { IEntity } from "./repositories"

export interface SubtractionInMoreStepsEntity extends IEntity{
    substractor: number,
    reducer: number,
    result: number
}

export interface listRequestParams{
    filter?:string,
    limit?:number,
    offset?:number,
    sort?:string[]
}

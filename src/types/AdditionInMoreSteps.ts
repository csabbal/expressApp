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

export interface AdditionInMoreStepsResult {
    term1: number,
    term2: number,
    helper1term1: number,
    helper1term2: number,
    helper1Result: number,
    helper2term1: number,
    helper2term2: number,
    helper2Result: number
}

export type AdditionStateError = Partial<Record<keyof AdditionInMoreStepsResult,string[]>>

export interface AdditionInMoreStepsValidationResult {
    isValid: boolean,
    errors: Partial<AdditionStateError>
}

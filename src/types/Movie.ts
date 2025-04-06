import { IEntity } from "./repositories"

export interface MovieEntity extends IEntity{
    title: string,
    description: string,
    image: string,
    releaseDate: string,
    rating: number,
    genre: string,
    duration: string,
    director: string
}

export interface listRequestParams{
    limit:number,
    offset:number,
    sort:string[]
}
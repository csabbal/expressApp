import mongoose from 'mongoose'
import { IMovieRepository } from '../types/repositories'
import { MovieEntity } from '../types/Movie'

/**
 * This class is to take care about the handling of users in the database
 */
export class MovieRepository implements IMovieRepository {

    constructor(protected movieModel: mongoose.Model<MovieEntity>) { }

    async find(data?: Partial<MovieEntity>):Promise<MovieEntity[]> {
        return await this.movieModel.find(data)
    }
    async findOne(data: Partial<MovieEntity>):Promise<MovieEntity> {
        return await this.movieModel.findOne(data)
    }

    async create(data: MovieEntity):Promise<MovieEntity> {
        return await this.movieModel.create(data)
    }
}



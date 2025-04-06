import { MovieEntity } from "../types/Movie"
import { loggedMethod } from "../utils/logger/logger"
import { movieRepository } from "../repositories"
import { IMovieRepository } from "../types/repositories"

export class MovieService {
    protected static _instance: MovieService
    constructor(protected movieRepository:IMovieRepository){}

    /**
     * getInstance function provides that this class work as a singleton
     * @returns 
     */
    static getInstance() {
        if (!this._instance) {
            this._instance = new MovieService(movieRepository)
        }
        return this._instance
    }
    /**
     * getAllMovies method take care of fetching all visible user data from the db
     * @returns {UserEntity} returns with all MovieEntity via movieRepository
     */
    @loggedMethod('[MovieService]')
    public async getAllMovies(): Promise<MovieEntity[]> {
        const movies = await this.movieRepository.find()
        return movies
    }
}

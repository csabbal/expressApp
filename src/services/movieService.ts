import { listRequestParams, MovieEntity } from "../types/Movie"
import { loggedMethod, logger } from "../utils/logger/logger"
import { movieRepository } from "../repositories"
import { FindOptions, IMovieRepository, SortOptions } from "../types/repositories"
import { BadRequestError } from "../utils/error/Error"

export class MovieService {
    protected static _instance: MovieService
    constructor(protected movieRepository: IMovieRepository) { }

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
     * getAllMovies method take care of fetching all visible movie data from the db
     * @returns {UserEntity[]} returns with all MovieEntity via movieRepository
    */
    @loggedMethod('[MovieService] getAllMovies')
    public async getAllMovies(): Promise<MovieEntity[]> {
        const movies = await this.movieRepository.find()
        return movies
    }

    /**
     * getMovies method take care of fetching all visible movie data from the db
     * but the return data based on the offset, limit and the sort paramaters what client define in params attribute
     * with mapRequestParamToFind method the request paramaters will be mapped to the findOptions
     * @returns {MovieEntity[]} returns with all MovieEntity based on the options via movieRepository
    */
    @loggedMethod('[MovieService] getMovies')
    public async getMovies(queryParams: listRequestParams): Promise<MovieEntity[]> {
        const params = this.mapRequestParamToFind(queryParams)
        const movies = await this.movieRepository.findWithParams(params)
        return movies
    }
    /**
     * mapRequestParamToFind method is to map the request paramaters to the findOptions
     * what is needed by the movieRepository
     * @param {listRequestParams} queryParams 
     * @returns {findOptions<IMovieRepository>} returns with the mapped findOptions
    */
    @loggedMethod('[MovieService] mapRequestParamToFind')
    private mapRequestParamToFind(queryParams: listRequestParams): FindOptions<MovieEntity> {
        try {
            const validSortArray = queryParams.sort.map(it => JSON.parse(it)) as SortOptions<MovieEntity>[]
            const params = {
                limit: queryParams.limit,
                offset: queryParams.offset,
                sort: validSortArray
            } as any as FindOptions<MovieEntity>
            return params
        } catch (e) {
            logger.error('[MovieService] mapRequestParamToFind error: ' + e.message)
            throw new BadRequestError(e.message, 'request params are not proper')
        }
    }
}

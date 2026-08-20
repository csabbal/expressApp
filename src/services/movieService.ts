import { listRequestParams, MovieEntity } from "../types/Movie"
import { loggedMethod, logger } from "../utils/logger/logger"
import { movieRepository } from "../repositories"
import { FindOptions, IMovieRepository, SortOptions } from "../types/repositories"
import { BadRequestError, NotFoundError } from "../utils/error/Error"
import { v4 as uuidv4 } from "uuid"
import { FileService } from "./fileService"

export class MovieService {
    protected static _instance: MovieService
    constructor(protected movieRepository: IMovieRepository, protected fileService: FileService) { }

    /**
     * getInstance function provides that this class work as a singleton
     * @returns
    */
    static getInstance() {
        if (!this._instance) {
            this._instance = new MovieService(movieRepository, FileService.getInstance())
        }
        return this._instance
    }

    /**
     * uploadImage method stores the given file under the 'movie' category via fileService,
     * then updates the movie record to reference the resulting file's id
     * @param {string} id
     * @param {Express.Multer.File} file
     * @param {string} uploadedBy
     * @returns {MovieEntity|null}
    */
    public async uploadImage(
        id: string,
        file: Express.Multer.File,
        uploadedBy: string
    ): Promise<MovieEntity | null> {
        logger.info('[MovieService] uploadImage ' + id)
        const existingMovie = await this.movieRepository.findOne({ id })
        if (!existingMovie) throw new NotFoundError(`movie not found: ${id}`, 'movie not found')
        const fileEntity = await this.fileService.uploadFile(file, { category: 'movie', uploadedBy })
        const movie = await this.movieRepository.updateOne({ id }, { image: fileEntity.id } as Partial<MovieEntity>)
        return movie
    }

    /**
     * streamImage method resolves the physical file to stream for a movie's image,
     * delegating the quality-based path resolution to fileService
     * @param {string} id
     * @param {'low'|'high'} quality
     * @returns {{path: string, mimeType: string, originalName: string}}
    */
    public async streamImage(
        id: string,
        quality: 'low' | 'high'
    ): Promise<{ path: string, mimeType: string, originalName: string }> {
        const movie = await this.movieRepository.findOne({ id })
        logger.info('movie',JSON.stringify(movie))
        if (!movie) throw new NotFoundError(`movie not found: ${id}`, 'movie not found')
        if (!movie.image) throw new NotFoundError(`movie has no image: ${id}`, 'movie has no image')
        
        return await this.fileService.getDownloadTarget(movie.image, quality)
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
     * getMoviespageCount method take care of fetching all visible movie data from the db
     * but it returns only just the total numbers. it omit the offset and page params.
     * @returns {MovieEntity[]} returns with all MovieEntity based on the options via movieRepository
    */
    @loggedMethod('[MovieService] getMoviesPageCount')
    public async getMoviesPageCount(queryParams: listRequestParams): Promise<number> {
        const {limit, offset, ...filteringQueryParams} = queryParams
        const movies = await this.getMovies(filteringQueryParams as listRequestParams)
        return Math.round(movies.length / (limit ?? 1))
    }

    /**
     * getMovieById method take care of fetching one visible movie data based on the id from the db
     * @returns {MovieEntity[]} returns with all MovieEntity based on the options via movieRepository
    */
    @loggedMethod('[MovieService] getMovieById')
    public async getMovieById(id:string): Promise<MovieEntity|null> {
        const movies = await this.movieRepository.findOne({id})
        return movies
    }

    /**
     * updateMovie method take care of updating one visible movie data based on the id from the db
     * @returns {MovieEntity|null} returns with the updated MovieEntity via movieRepository
    */
    @loggedMethod('[MovieService] updateMovie')
    public async updateMovie(id: string, data: Partial<MovieEntity>): Promise<MovieEntity|null> {
        const movie = await this.movieRepository.updateOne({ id }, data)
        return movie
    }

    /**
     * createMovie method take care of creating a new movie entry in the db
     * @returns {MovieEntity} returns with the created MovieEntity via movieRepository
    */
    @loggedMethod('[MovieService] createMovie')
    public async createMovie(data: Partial<MovieEntity>): Promise<MovieEntity> {
        const movie = await this.movieRepository.create({ ...data, id: uuidv4() } as MovieEntity)
        return movie
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
            const validSortArray = (queryParams.sort ? 
                queryParams.sort.map(it => JSON.parse(it)) : []
            ) as SortOptions<MovieEntity>[]
            const params = {
                filter: queryParams.filter,
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

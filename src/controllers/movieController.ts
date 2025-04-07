import express from 'express'
import { MovieService } from '../services/movieService'
import { listRequestParams, MovieEntity } from '../types/Movie'
import { loggedMethod, logger, LoggerClass } from '../utils/logger/logger'
import _ from 'lodash'
import { BadRequestError } from '../utils/error/Error'

/**
 * This class is about to provides all requests of the user related endpoints via user service 
 */
export class MovieController {
    protected static _instance: MovieController

    constructor(private movieService: MovieService) { }

    static getInstance(): MovieController {
        if (!this._instance) {
            this._instance = new MovieController(MovieService.getInstance())
        }
        return this._instance
    }

    /**
     * This controller method has only one task is to call movieService getAllMovies function
     * in order for fetching all movies form the movie repository
     * @param {Request} req 
     * @param {Response} res 
     * @param {NextFunction} next 
     */
    @loggedMethod('[MovieController] getAllMovies')
    public async getAllMovies(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const movies: MovieEntity[] = await this.movieService.getAllMovies()
            res.json(movies)
        } catch (e) {
            next(e)
        }
    }

    /**
     * This controller method is about to call movieService getMovies function with paramaters taken as querystring
     * but before that it perform all of validations what it makes sens on the querystring paramaters
     * @param {Request} req 
     * @param {Response} res 
     * @param {NextFunction} next 
     */
    @loggedMethod('[MovieController] getMovies')
    public async getMovies(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const params = req.query as unknown as listRequestParams
            // if the sort is not an array, then convert it to an array
            if (params.sort && !Array.isArray(params.sort)) {
                params.sort = [params.sort]
            }
            logger.info('[getMovies] params' + LoggerClass.objectToString(params))
            // checking the querystring paramaters
            if (_.isNaN(params.limit)) throw new BadRequestError('limit is not a number')
            if (_.isNaN(params.offset)) throw new BadRequestError('offset is not a number')
            if (!_.isArray(params.sort)) throw new BadRequestError('sort is not an array')

            // calling the movieService getMovies function with the querystring paramaters
            const { count, data } = await this.movieService.getMovies(params)
            res.json({ count, data })
        } catch (e) {
            next(e)
        }
    }
}
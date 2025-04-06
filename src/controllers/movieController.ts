import express from 'express'
import { MovieService } from '../services/movieService'
import { MovieEntity } from '../types/Movie'
import { loggedMethod } from '../utils/logger/logger'

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
    @loggedMethod('[MovieController]')
    public async getAllMovies(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const movies: MovieEntity[] = await this.movieService.getAllMovies()
            res.json(movies)
        } catch (e) {
            next(e)
        }
    }
}
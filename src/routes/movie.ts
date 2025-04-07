import express from 'express'
import { MovieController } from '../controllers/movieController'
import { requireJwt } from '../providers/auth/passport'
import { jwtStrategyInstance } from '../providers/auth/jwtStrategy'

// get the current router instance
const router = express.Router()

// get the current movie controller instance
const movieController = MovieController.getInstance()
const verifyPrivileges = jwtStrategyInstance.verifyPrivileges.bind(jwtStrategyInstance)

/**
 * @swagger
 * /api/movie/all:
 *   get:
 *     summary: Retrieve a list of movies
 *     security:
 *        - BearerAuth: [] 
 *     responses:
 *       200:
 *         description: A list of movies
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   title:
 *                     type: string
 *                     example: Inception
 *                   director:
 *                     type: string
 *                     example: Christopher Nolan
 *                   releaseDate:
 *                     type: integer
 *                     example: 2010.07.16
 *                   genre:
 *                     type: string
 *                     example: Science Fiction
 *                   rating:
 *                     type: number
 *                     format: float
 *                     example: 8.8
 */
router.get('/all',
    requireJwt,
    verifyPrivileges([{ component: 'movie', privilege: 'read' }]),
    movieController.getAllMovies.bind(movieController)
)

/**
 * @swagger
 * /api/movie/list:
 *   get:
 *     summary: Retrieve a list of movies
 *     security:
 *        - BearerAuth: [] 
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 50
 *         description: The maximum number of movies to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           example: 0
 *         description: The number of movies to skip before starting to collect the result set
 *       - in: query
 *         name: sort
 *         schema:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *                 example: rating
 *                 description: The field by which to sort the movies (e.g., title, releaseDate, rating)
 *               direction:
 *                 type: string
 *                 enum: [asc, desc]
 *                 example: desc
 *                 description: The order in which to sort the movies (ascending or descending)
 *         description: The sorting options for the movies, including field and order
 *     responses:
 *       200:
 *         description: A list of movies
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: number
 *                   example: 100
 *                   description: The total number of movies available
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       title:
 *                         type: string
 *                         example: Inception
 *                       director:
 *                         type: string
 *                         example: Christopher Nolan
 *                       releaseDate:
 *                         type: integer
 *                         example: 2010.07.16
 *                       genre:
 *                         type: string
 *                         example: Science Fiction
 *                       rating:
 *                         type: number
 *                         format: float
 *                         example: 8.8
 */
router.get('/list',
    requireJwt,
    verifyPrivileges([{ component: 'movie', privilege: 'read' }]),
    movieController.getMovies.bind(movieController)
)


export default router

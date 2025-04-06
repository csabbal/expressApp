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


export default router

import express from 'express'
import { MovieController } from '../controllers/movieController'
import { requireJwt } from '../providers/auth/passport'
import { jwtStrategyInstance } from '../providers/auth/jwtStrategy'
import { singleFileUpload } from '../utils/upload/multer'

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
 *     tags: [Movie]
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
 * /api/movie/pageCount:
 *   get:
 *     summary: Retrieve the total page count list of movies
 *     tags: [Movie]
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
 *         name: filter
 *         schema:
 *           type: string
 *           example: Spielberg
 *         description: filtering the movie list
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
 *         description: A number of total page count
 *         content:
 *           application/json:
 *             schema:
 *               type: number
 */
router.get('/pageCount',
    requireJwt,
    verifyPrivileges([{ component: 'movie', privilege: 'read' }]),
    movieController.getMoviesPageCount.bind(movieController)
)

/**
 * @swagger
 * /api/movie/list:
 *   get:
 *     summary: Retrieve a list of movies
 *     tags: [Movie]
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
 *         name: filter
 *         schema:
 *           type: string
 *           example: Spielberg
 *         description: filtering the movie list
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
router.get('/list',
    requireJwt,
    verifyPrivileges([{ component: 'movie', privilege: 'read' }]),
    movieController.getMovies.bind(movieController)
)

/**
 * @swagger
 * /api/movie/{id}:
 *   get:
 *     summary: Retrieve a concrete movie
 *     tags: [Movie]
 *     security:
 *        - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The id of the movie to retrieve
 *     responses:
 *       200:
 *         description: a movie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 title:
 *                   type: string
 *                   example: Inception
 *                 director:
 *                   type: string
 *                   example: Christopher Nolan
 *                 releaseDate:
 *                   type: integer
 *                   example: 2010.07.16
 *                 genre:
 *                   type: string
 *                   example: Science Fiction
 *                 rating:
 *                   type: number
 *                   format: float
 *                   example: 8.8
 *       404:
 *         description: Movie not found
 */
router.get('/:id',
    requireJwt,
    verifyPrivileges([{ component: 'movie', privilege: 'read' }]),
    movieController.getMovieById.bind(movieController)
)

/**
 * @swagger
 * /api/movie/{id}:
 *   put:
 *     summary: Update a concrete movie
 *     tags: [Movie]
 *     security:
 *        - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The id of the movie to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Inception
 *               description:
 *                 type: string
 *                 example: A thief who steals corporate secrets through dream-sharing technology.
 *               image:
 *                 type: string
 *                 description: id of a file uploaded via POST /api/movie/{id}/image
 *                 example: 3f1c9b2a-6f7e-4a1d-9c3e-2b7a5d6e8f10
 *               director:
 *                 type: string
 *                 example: Christopher Nolan
 *               releaseDate:
 *                 type: string
 *                 example: 2010-07-16
 *               genre:
 *                 type: string
 *                 example: Science Fiction
 *               duration:
 *                 type: string
 *                 example: 148 min
 *               rating:
 *                 type: number
 *                 format: float
 *                 example: 8.8
 *     responses:
 *       200:
 *         description: the updated movie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 title:
 *                   type: string
 *                   example: Inception
 *                 director:
 *                   type: string
 *                   example: Christopher Nolan
 *                 releaseDate:
 *                   type: integer
 *                   example: 2010.07.16
 *                 genre:
 *                   type: string
 *                   example: Science Fiction
 *                 rating:
 *                   type: number
 *                   format: float
 *                   example: 8.8
 *       404:
 *         description: Movie not found
 */
router.put('/:id',
    requireJwt,
    verifyPrivileges([{ component: 'movie', privilege: 'write' }]),
    movieController.updateMovie.bind(movieController)
)

/**
 * @swagger
 * /api/movie:
 *   post:
 *     summary: Create a new movie
 *     tags: [Movie]
 *     security:
 *        - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Inception
 *               description:
 *                 type: string
 *                 example: A thief who steals corporate secrets through dream-sharing technology.
 *               image:
 *                 type: string
 *                 description: id of a file uploaded via POST /api/movie/{id}/image
 *                 example: 3f1c9b2a-6f7e-4a1d-9c3e-2b7a5d6e8f10
 *               director:
 *                 type: string
 *                 example: Christopher Nolan
 *               releaseDate:
 *                 type: string
 *                 example: 2010-07-16
 *               genre:
 *                 type: string
 *                 example: Science Fiction
 *               duration:
 *                 type: string
 *                 example: 148 min
 *               rating:
 *                 type: number
 *                 format: float
 *                 example: 8.8
 *     responses:
 *       201:
 *         description: the created movie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 title:
 *                   type: string
 *                   example: Inception
 *                 director:
 *                   type: string
 *                   example: Christopher Nolan
 *                 releaseDate:
 *                   type: integer
 *                   example: 2010.07.16
 *                 genre:
 *                   type: string
 *                   example: Science Fiction
 *                 rating:
 *                   type: number
 *                   format: float
 *                   example: 8.8
 */
router.post('/',
    requireJwt,
    verifyPrivileges([{ component: 'movie', privilege: 'write' }]),
    movieController.createMovie.bind(movieController)
)

/**
 * @swagger
 * /api/movie/image/{id}:
 *   post:
 *     summary: Upload (or replace) a movie's image
 *     tags: [Movie]
 *     security:
 *        - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The id of the movie to attach the image to
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: the movie, with image set to the uploaded file's id
 *       400:
 *         description: no image file was provided
 */
router.post('/image/:id',
    requireJwt,
    verifyPrivileges([{ component: 'movie', privilege: 'write' }]),
    singleFileUpload('image'),
    movieController.uploadImage.bind(movieController)
)

/**
 * @swagger
 * /api/movie/image/{id}:
 *   get:
 *     summary: Download a movie's image, streamed from disk
 *     tags: [Movie]
 *     security:
 *        - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The id of the movie whose image to retrieve
 *       - in: query
 *         name: quality
 *         schema:
 *           type: string
 *           enum: [low, high]
 *           default: high
 *         description: low returns the degraded copy (falls back to the original if none exists)
 *     responses:
 *       200:
 *         description: the image bytes
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: movie not found, or the movie has no image
 */
router.get('/image/:id',
    requireJwt,
    verifyPrivileges([{ component: 'movie', privilege: 'read' }]),
    movieController.downloadImage.bind(movieController)
)

export default router

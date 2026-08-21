import express from 'express'
import { TaskTypeController } from '../controllers/taskTypeController'
import { requireJwt } from '../providers/auth/passport'
import { jwtStrategyInstance } from '../providers/auth/jwtStrategy'
import { singleFileUpload } from '../utils/upload/multer'

// get the current router instance
const router = express.Router()

// get the current task type controller instance
const taskTypeController = TaskTypeController.getInstance()
const verifyPrivileges = jwtStrategyInstance.verifyPrivileges.bind(jwtStrategyInstance)

/**
 * @swagger
 * /api/taskType/all:
 *   get:
 *     summary: Retrieve a list of task types
 *     tags: [Learning]
 *     security:
 *        - BearerAuth: []
 *     responses:
 *       200:
 *         description: A list of task types
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: 3f1c9b2a-6f7e-4a1d-9c3e-2b7a5d6e8f10
 *                   subject:
 *                     type: string
 *                     example: math
 *                   name:
 *                     type: string
 *                     example: additionInMoreSteps
 *                   description:
 *                     type: string
 *                     example: Addition in more steps to practice shifting by 10.
 *                   rating:
 *                     type: number
 *                     example: 10
 */
router.get('/all',
    requireJwt,
    verifyPrivileges([{ component: 'learning', privilege: 'read' }]),
    taskTypeController.getAll.bind(taskTypeController)
)

/**
 * @swagger
 * /api/taskType/list:
 *   get:
 *     summary: Retrieve a list of task types
 *     tags: [Learning]
 *     security:
 *        - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 50
 *         description: The maximum number of task types to return
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *           example: math
 *         description: filtering the task type list
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           example: 0
 *         description: The number of task types to skip before starting to collect the result set
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
 *                 description: The field by which to sort the task types (e.g., name, subject, rating)
 *               direction:
 *                 type: string
 *                 enum: [asc, desc]
 *                 example: desc
 *                 description: The order in which to sort the task types (ascending or descending)
 *         description: The sorting options for the task types, including field and order
 *     responses:
 *       200:
 *         description: A list of task types
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   subject:
 *                     type: string
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   rating:
 *                     type: number
 */
router.get('/list',
    requireJwt,
    verifyPrivileges([{ component: 'learning', privilege: 'read' }]),
    taskTypeController.getList.bind(taskTypeController)
)

/**
 * @swagger
 * /api/taskType/{id}:
 *   get:
 *     summary: Retrieve a concrete task type
 *     tags: [Learning]
 *     security:
 *        - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The id of the task type to retrieve
 *     responses:
 *       200:
 *         description: a task type
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 subject:
 *                   type: string
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 rating:
 *                   type: number
 *       404:
 *         description: Task type not found
 */
router.get('/:id',
    requireJwt,
    verifyPrivileges([{ component: 'learning', privilege: 'read' }]),
    taskTypeController.getById.bind(taskTypeController)
)

/**
 * @swagger
 * /api/taskType/{id}:
 *   put:
 *     summary: Update a concrete task type
 *     tags: [Learning]
 *     security:
 *        - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The id of the task type to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subject:
 *                 type: string
 *                 example: math
 *               name:
 *                 type: string
 *                 example: additionInMoreSteps
 *               image:
 *                 type: string
 *                 description: id of a file uploaded via POST /api/taskType/image/{id}
 *                 example: 3f1c9b2a-6f7e-4a1d-9c3e-2b7a5d6e8f10
 *               description:
 *                 type: string
 *                 example: Addition in more steps to practice shifting by 10.
 *               rating:
 *                 type: number
 *                 example: 10
 *     responses:
 *       200:
 *         description: the updated task type
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 subject:
 *                   type: string
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 rating:
 *                   type: number
 *       404:
 *         description: Task type not found
 */
router.put('/:id',
    requireJwt,
    verifyPrivileges([{ component: 'learning', privilege: 'write' }]),
    taskTypeController.update.bind(taskTypeController)
)

/**
 * @swagger
 * /api/taskType:
 *   post:
 *     summary: Create a new task type
 *     tags: [Learning]
 *     security:
 *        - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subject:
 *                 type: string
 *                 example: math
 *               name:
 *                 type: string
 *                 example: additionInMoreSteps
 *               image:
 *                 type: string
 *                 description: id of a file uploaded via POST /api/taskType/image/{id}
 *                 example: 3f1c9b2a-6f7e-4a1d-9c3e-2b7a5d6e8f10
 *               description:
 *                 type: string
 *                 example: Addition in more steps to practice shifting by 10.
 *               rating:
 *                 type: number
 *                 example: 10
 *     responses:
 *       201:
 *         description: the created task type
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 subject:
 *                   type: string
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 rating:
 *                   type: number
 */
router.post('/',
    requireJwt,
    verifyPrivileges([{ component: 'learning', privilege: 'write' }]),
    taskTypeController.create.bind(taskTypeController)
)

/**
 * @swagger
 * /api/taskType/image/{id}:
 *   post:
 *     summary: Upload (or replace) a task type's image
 *     tags: [Learning]
 *     security:
 *        - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The id of the task type to attach the image to
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
 *         description: the task type, with image set to the uploaded file's id
 *       400:
 *         description: no image file was provided
 *       404:
 *         description: task type not found
 */
router.post('/image/:id',
    requireJwt,
    verifyPrivileges([{ component: 'learning', privilege: 'write' }]),
    singleFileUpload('image'),
    taskTypeController.uploadImage.bind(taskTypeController)
)

/**
 * @swagger
 * /api/taskType/image/{id}:
 *   get:
 *     summary: Download a task type's image, streamed from disk
 *     tags: [Learning]
 *     security:
 *        - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The id of the task type whose image to retrieve
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
 *         description: task type not found, or the task type has no image
 */
router.get('/image/:id',
    requireJwt,
    verifyPrivileges([{ component: 'learning', privilege: 'read' }]),
    taskTypeController.downloadImage.bind(taskTypeController)
)

/**
 * @swagger
 * /api/taskType/{id}:
 *   delete:
 *     summary: Delete a concrete task type
 *     tags: [Learning]
 *     security:
 *        - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The id of the task type to delete
 *     responses:
 *       200:
 *         description: the deleted task type
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 subject:
 *                   type: string
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 rating:
 *                   type: number
 *       404:
 *         description: Task type not found
 */
router.delete('/:id',
    requireJwt,
    verifyPrivileges([{ component: 'learning', privilege: 'delete' }]),
    taskTypeController.delete.bind(taskTypeController)
)

export default router

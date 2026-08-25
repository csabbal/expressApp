import express from 'express'
import { TaskFailureController } from '../controllers/taskFailureController'
import { requireJwt } from '../providers/auth/passport'
import { jwtStrategyInstance } from '../providers/auth/jwtStrategy'

// get the current router instance
const router = express.Router()

// get the current task failure controller instance
const taskFailureController = TaskFailureController.getInstance()
const verifyPrivileges = jwtStrategyInstance.verifyPrivileges.bind(jwtStrategyInstance)

/**
 * @swagger
 * /api/taskFailure:
 *   post:
 *     summary: Record that the authenticated user failed to solve a task
 *     description: >
 *       Upserts by (userId, taskId): a repeat failure of the same task by the same
 *       user increments count and updates lastFailedAt/errorMessage/taskTypeName on
 *       the existing record instead of creating a new one.
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
 *               taskId:
 *                 type: string
 *                 description: id of the task instance the user failed (e.g. an AdditionInMoreSteps id)
 *                 example: 3f1c9b2a-6f7e-4a1d-9c3e-2b7a5d6e8f10
 *               taskTypeName:
 *                 type: string
 *                 description: name of the TaskType the task belongs to
 *                 example: additionInMoreSteps
 *               errorMessage:
 *                 type: string
 *                 description: optional, what went wrong
 *                 example: expected 42, got 24
 *             required:
 *               - taskId
 *               - taskTypeName
 *     responses:
 *       200:
 *         description: the created or updated task failure record
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 userId:
 *                   type: string
 *                 taskId:
 *                   type: string
 *                 taskTypeName:
 *                   type: string
 *                 errorMessage:
 *                   type: string
 *                   nullable: true
 *                 count:
 *                   type: number
 *                 firstFailedAt:
 *                   type: string
 *                   format: date-time
 *                 lastFailedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: taskId or taskTypeName missing or invalid
 */
router.post('/',
    requireJwt,
    verifyPrivileges([{ component: 'learning', privilege: 'write' }]),
    taskFailureController.recordFailure.bind(taskFailureController)
)

/**
 * @swagger
 * /api/taskFailure/all:
 *   get:
 *     summary: Retrieve a list of task failures
 *     tags: [Learning]
 *     security:
 *        - BearerAuth: []
 *     responses:
 *       200:
 *         description: A list of task failures
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   userId:
 *                     type: string
 *                   taskId:
 *                     type: string
 *                   taskTypeName:
 *                     type: string
 *                   errorMessage:
 *                     type: string
 *                     nullable: true
 *                   count:
 *                     type: number
 *                   firstFailedAt:
 *                     type: string
 *                     format: date-time
 *                   lastFailedAt:
 *                     type: string
 *                     format: date-time
 */
router.get('/all',
    requireJwt,
    verifyPrivileges([{ component: 'learning', privilege: 'failure-read' }]),
    taskFailureController.getAll.bind(taskFailureController)
)

/**
 * @swagger
 * /api/taskFailure/list:
 *   get:
 *     summary: Retrieve a list of task failures
 *     tags: [Learning]
 *     security:
 *        - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 50
 *         description: The maximum number of task failures to return
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *           example: additionInMoreSteps
 *         description: filtering the task failure list
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           example: 0
 *         description: The number of task failures to skip before starting to collect the result set
 *       - in: query
 *         name: sort
 *         schema:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *                 example: count
 *                 description: The field by which to sort the task failures (e.g., count, lastFailedAt)
 *               direction:
 *                 type: string
 *                 enum: [asc, desc]
 *                 example: desc
 *                 description: The order in which to sort the task failures (ascending or descending)
 *         description: The sorting options for the task failures, including field and order
 *     responses:
 *       200:
 *         description: A list of task failures
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   userId:
 *                     type: string
 *                   taskId:
 *                     type: string
 *                   taskTypeName:
 *                     type: string
 *                   errorMessage:
 *                     type: string
 *                     nullable: true
 *                   count:
 *                     type: number
 *                   firstFailedAt:
 *                     type: string
 *                     format: date-time
 *                   lastFailedAt:
 *                     type: string
 *                     format: date-time
 */
router.get('/list',
    requireJwt,
    verifyPrivileges([{ component: 'learning', privilege: 'failure-read' }]),
    taskFailureController.getList.bind(taskFailureController)
)

/**
 * @swagger
 * /api/taskFailure/{id}:
 *   get:
 *     summary: Retrieve a concrete task failure record
 *     tags: [Learning]
 *     security:
 *        - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The id of the task failure record to retrieve
 *     responses:
 *       200:
 *         description: a task failure record
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 userId:
 *                   type: string
 *                 taskId:
 *                   type: string
 *                 taskTypeName:
 *                   type: string
 *                 errorMessage:
 *                   type: string
 *                   nullable: true
 *                 count:
 *                   type: number
 *                 firstFailedAt:
 *                   type: string
 *                   format: date-time
 *                 lastFailedAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Task failure not found
 */
router.get('/:id',
    requireJwt,
    verifyPrivileges([{ component: 'learning', privilege: 'failure-read' }]),
    taskFailureController.getById.bind(taskFailureController)
)

/**
 * @swagger
 * /api/taskFailure/{id}:
 *   delete:
 *     summary: Delete a concrete task failure record
 *     tags: [Learning]
 *     security:
 *        - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The id of the task failure record to delete
 *     responses:
 *       200:
 *         description: the deleted task failure record
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 userId:
 *                   type: string
 *                 taskId:
 *                   type: string
 *                 taskTypeName:
 *                   type: string
 *                 errorMessage:
 *                   type: string
 *                   nullable: true
 *                 count:
 *                   type: number
 *                 firstFailedAt:
 *                   type: string
 *                   format: date-time
 *                 lastFailedAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Task failure not found
 */
router.delete('/:id',
    requireJwt,
    verifyPrivileges([{ component: 'learning', privilege: 'delete' }]),
    taskFailureController.delete.bind(taskFailureController)
)

export default router

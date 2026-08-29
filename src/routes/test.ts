import express from 'express'
import { TestController } from '../controllers/testController'
import { requireJwt } from '../providers/auth/passport'
import { jwtStrategyInstance } from '../providers/auth/jwtStrategy'

// get the current router instance
const router = express.Router()

// get the current test controller instance
const testController = TestController.getInstance()
const verifyPrivileges = jwtStrategyInstance.verifyPrivileges.bind(jwtStrategyInstance)

/**
 * @swagger
 * /api/test/start:
 *   post:
 *     summary: Start a test (practice session) for the authenticated user
 *     description: >
 *       If the user already has an unfinished test (no endedAt set), that same test's id is
 *       returned instead of starting a new one. Otherwise a reward is granted via POST
 *       /api/reward's underlying logic (category = taskType), and a new test is created
 *       referencing that reward, with startedAt set to now - the reward itself carries no
 *       timing, the test's startedAt/endedAt are the source of truth for when it was earned.
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
 *               taskType:
 *                 type: string
 *                 description: name of the task type this test practices (e.g. taskTypeName elsewhere)
 *                 example: additionInMoreSteps
 *             required:
 *               - taskType
 *     responses:
 *       200:
 *         description: the started (or already unfinished) test's id, and the granted reward's imageId
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 testId:
 *                   type: string
 *                 imageId:
 *                   type: string
 *                   description: id of the image granted by the reward attached to this test
 *       400:
 *         description: taskType missing or invalid
 *       404:
 *         description: no reward is available to grant (see POST /api/reward)
 */
router.post('/start',
    requireJwt,
    verifyPrivileges([{ component: 'learning', privilege: 'write' }]),
    testController.start.bind(testController)
)

/**
 * @swagger
 * /api/test/{id}/end:
 *   put:
 *     summary: End a test by setting its endedAt to now
 *     tags: [Learning]
 *     security:
 *        - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The id of the test to end
 *     responses:
 *       200:
 *         description: the ended test
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 userId:
 *                   type: string
 *                 taskType:
 *                   type: string
 *                 rewardId:
 *                   type: string
 *                 startedAt:
 *                   type: string
 *                   format: date-time
 *                 endedAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: the test belongs to another user, or is already ended
 *       404:
 *         description: Test not found
 */
router.put('/:id/end',
    requireJwt,
    verifyPrivileges([{ component: 'learning', privilege: 'write' }]),
    testController.end.bind(testController)
)

/**
 * @swagger
 * /api/test/all:
 *   get:
 *     summary: Retrieve a list of test records
 *     tags: [Learning]
 *     security:
 *        - BearerAuth: []
 *     responses:
 *       200:
 *         description: A list of test records
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
 *                   taskType:
 *                     type: string
 *                   rewardId:
 *                     type: string
 *                   startedAt:
 *                     type: string
 *                     format: date-time
 *                   endedAt:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 */
router.get('/all',
    requireJwt,
    verifyPrivileges([{ component: 'learning', privilege: 'read' }]),
    testController.getAll.bind(testController)
)

/**
 * @swagger
 * /api/test/list:
 *   get:
 *     summary: Retrieve a list of test records
 *     tags: [Learning]
 *     security:
 *        - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 50
 *         description: The maximum number of test records to return
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *         description: filtering the test list
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           example: 0
 *         description: The number of test records to skip before starting to collect the result set
 *       - in: query
 *         name: sort
 *         schema:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *                 example: startedAt
 *                 description: The field by which to sort the test records (e.g., startedAt, endedAt)
 *               direction:
 *                 type: string
 *                 enum: [asc, desc]
 *                 example: desc
 *                 description: The order in which to sort the test records (ascending or descending)
 *         description: The sorting options for the test records, including field and order
 *     responses:
 *       200:
 *         description: A list of test records
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
 *                   taskType:
 *                     type: string
 *                   rewardId:
 *                     type: string
 *                   startedAt:
 *                     type: string
 *                     format: date-time
 *                   endedAt:
 *                     type: string
 *                     format: date-time
 *                     nullable: true
 */
router.get('/list',
    requireJwt,
    verifyPrivileges([{ component: 'learning', privilege: 'read' }]),
    testController.getList.bind(testController)
)

/**
 * @swagger
 * /api/test/{id}:
 *   get:
 *     summary: Retrieve a concrete test record
 *     tags: [Learning]
 *     security:
 *        - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The id of the test record to retrieve
 *     responses:
 *       200:
 *         description: a test record
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 userId:
 *                   type: string
 *                 taskType:
 *                   type: string
 *                 rewardId:
 *                   type: string
 *                 startedAt:
 *                   type: string
 *                   format: date-time
 *                 endedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *       404:
 *         description: Test not found
 */
router.get('/:id',
    requireJwt,
    verifyPrivileges([{ component: 'learning', privilege: 'read' }]),
    testController.getById.bind(testController)
)

/**
 * @swagger
 * /api/test/{id}:
 *   delete:
 *     summary: Delete a concrete test record
 *     tags: [Learning]
 *     security:
 *        - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The id of the test record to delete
 *     responses:
 *       200:
 *         description: the deleted test record
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 userId:
 *                   type: string
 *                 taskType:
 *                   type: string
 *                 rewardId:
 *                   type: string
 *                 startedAt:
 *                   type: string
 *                   format: date-time
 *                 endedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *       404:
 *         description: Test not found
 */
router.delete('/:id',
    requireJwt,
    verifyPrivileges([{ component: 'learning', privilege: 'delete' }]),
    testController.delete.bind(testController)
)

export default router

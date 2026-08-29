import express from 'express'
import { RewardController } from '../controllers/rewardController'
import { requireJwt } from '../providers/auth/passport'
import { jwtStrategyInstance } from '../providers/auth/jwtStrategy'

// get the current router instance
const router = express.Router()

// get the current reward controller instance
const rewardController = RewardController.getInstance()
const verifyPrivileges = jwtStrategyInstance.verifyPrivileges.bind(jwtStrategyInstance)

/**
 * @swagger
 * /api/reward:
 *   post:
 *     summary: Grant the authenticated user a random unwon reward image for solving a task
 *     description: >
 *       Picks one random File (category 'taskType') the user hasn't already won, records
 *       the win, and returns the created record. Responds 404 if no reward is available -
 *       the taskType image pool is empty, or the user has already won every image in it.
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
 *               category:
 *                 type: string
 *                 description: the task's category
 *                 example: math
 *             required:
 *               - category
 *     responses:
 *       201:
 *         description: the granted reward record
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 userId:
 *                   type: string
 *                 imageId:
 *                   type: string
 *                 category:
 *                   type: string
 *       400:
 *         description: category missing or invalid
 *       404:
 *         description: >
 *           no reward available - the taskType image pool is empty, or the user has already
 *           won every image in it
 */
router.post('/',
    requireJwt,
    verifyPrivileges([{ component: 'learning', privilege: 'write' }]),
    rewardController.grantReward.bind(rewardController)
)

/**
 * @swagger
 * /api/reward/won:
 *   get:
 *     summary: Retrieve the image ids the authenticated user has already won
 *     tags: [Learning]
 *     security:
 *        - BearerAuth: []
 *     responses:
 *       200:
 *         description: a list of won image ids
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 */
router.get('/won',
    requireJwt,
    verifyPrivileges([{ component: 'learning', privilege: 'read' }]),
    rewardController.getWon.bind(rewardController)
)

/**
 * @swagger
 * /api/reward/available:
 *   get:
 *     summary: Retrieve the image ids the authenticated user could still win
 *     tags: [Learning]
 *     security:
 *        - BearerAuth: []
 *     responses:
 *       200:
 *         description: a list of image ids not yet won by this user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 */
router.get('/available',
    requireJwt,
    verifyPrivileges([{ component: 'learning', privilege: 'read' }]),
    rewardController.getAvailable.bind(rewardController)
)

/**
 * @swagger
 * /api/reward/won/count:
 *   get:
 *     summary: Retrieve the total number of rewards the authenticated user has won
 *     tags: [Learning]
 *     security:
 *        - BearerAuth: []
 *     responses:
 *       200:
 *         description: the total number of rewards won by this user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: number
 */
router.get('/won/count',
    requireJwt,
    verifyPrivileges([{ component: 'learning', privilege: 'read' }]),
    rewardController.countWon.bind(rewardController)
)

export default router

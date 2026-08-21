import express from 'express'
import { AdditionInMoreStepsController } from '../controllers/additionInMoreStepsController'
import { requireJwt } from '../providers/auth/passport'
import { jwtStrategyInstance } from '../providers/auth/jwtStrategy'

// get the current router instance
const router = express.Router()

// get the current additionInMoreSteps controller instance
const additionInMoreStepsController = AdditionInMoreStepsController.getInstance()
const verifyPrivileges = jwtStrategyInstance.verifyPrivileges.bind(jwtStrategyInstance)

/**
 * @swagger
 * /api/additionInMoreSteps/all:
 *   get:
 *     summary: Retrieve a list of additionInMoreSteps practice items
 *     tags: [Learning]
 *     security:
 *        - BearerAuth: []
 *     responses:
 *       200:
 *         description: A list of additionInMoreSteps items
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
 *                   term1:
 *                     type: number
 *                     example: 9
 *                   term2:
 *                     type: number
 *                     example: 8
 *                   result:
 *                     type: number
 *                     example: 17
 */
router.get('/all',
    requireJwt,
    verifyPrivileges([{ component: 'learning', privilege: 'read' }]),
    additionInMoreStepsController.getAll.bind(additionInMoreStepsController)
)

/**
 * @swagger
 * /api/additionInMoreSteps/list:
 *   get:
 *     summary: Retrieve a list of additionInMoreSteps practice items
 *     tags: [Learning]
 *     security:
 *        - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 50
 *         description: The maximum number of items to return
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *           example: 17
 *         description: filtering the additionInMoreSteps list
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           example: 0
 *         description: The number of items to skip before starting to collect the result set
 *       - in: query
 *         name: sort
 *         schema:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *                 example: result
 *                 description: The field by which to sort the items (e.g., term1, term2, result)
 *               direction:
 *                 type: string
 *                 enum: [asc, desc]
 *                 example: desc
 *                 description: The order in which to sort the items (ascending or descending)
 *         description: The sorting options for the items, including field and order
 *     responses:
 *       200:
 *         description: A list of additionInMoreSteps items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   term1:
 *                     type: number
 *                   term2:
 *                     type: number
 *                   result:
 *                     type: number
 */
router.get('/list',
    requireJwt,
    verifyPrivileges([{ component: 'learning', privilege: 'read' }]),
    additionInMoreStepsController.getList.bind(additionInMoreStepsController)
)

/**
 * @swagger
 * /api/additionInMoreSteps/{id}:
 *   get:
 *     summary: Retrieve a concrete additionInMoreSteps item
 *     tags: [Learning]
 *     security:
 *        - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The id of the item to retrieve
 *     responses:
 *       200:
 *         description: an additionInMoreSteps item
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 term1:
 *                   type: number
 *                 term2:
 *                   type: number
 *                 result:
 *                   type: number
 *       404:
 *         description: Item not found
 */
router.get('/:id',
    requireJwt,
    verifyPrivileges([{ component: 'learning', privilege: 'read' }]),
    additionInMoreStepsController.getById.bind(additionInMoreStepsController)
)

/**
 * @swagger
 * /api/additionInMoreSteps/{id}:
 *   put:
 *     summary: Update a concrete additionInMoreSteps item
 *     tags: [Learning]
 *     security:
 *        - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The id of the item to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               term1:
 *                 type: number
 *                 example: 9
 *               term2:
 *                 type: number
 *                 example: 8
 *               result:
 *                 type: number
 *                 example: 17
 *     responses:
 *       200:
 *         description: the updated additionInMoreSteps item
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 term1:
 *                   type: number
 *                 term2:
 *                   type: number
 *                 result:
 *                   type: number
 *       404:
 *         description: Item not found
 */
router.put('/:id',
    requireJwt,
    verifyPrivileges([{ component: 'learning', privilege: 'write' }]),
    additionInMoreStepsController.update.bind(additionInMoreStepsController)
)

/**
 * @swagger
 * /api/additionInMoreSteps:
 *   post:
 *     summary: Create a new additionInMoreSteps item
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
 *               term1:
 *                 type: number
 *                 example: 9
 *               term2:
 *                 type: number
 *                 example: 8
 *               result:
 *                 type: number
 *                 example: 17
 *     responses:
 *       201:
 *         description: the created additionInMoreSteps item
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 term1:
 *                   type: number
 *                 term2:
 *                   type: number
 *                 result:
 *                   type: number
 */
router.post('/',
    requireJwt,
    verifyPrivileges([{ component: 'learning', privilege: 'write' }]),
    additionInMoreStepsController.create.bind(additionInMoreStepsController)
)

/**
 * @swagger
 * /api/additionInMoreSteps/{id}:
 *   delete:
 *     summary: Delete a concrete additionInMoreSteps item
 *     tags: [Learning]
 *     security:
 *        - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The id of the item to delete
 *     responses:
 *       200:
 *         description: the deleted additionInMoreSteps item
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 term1:
 *                   type: number
 *                 term2:
 *                   type: number
 *                 result:
 *                   type: number
 *       404:
 *         description: Item not found
 */
router.delete('/:id',
    requireJwt,
    verifyPrivileges([{ component: 'learning', privilege: 'delete' }]),
    additionInMoreStepsController.delete.bind(additionInMoreStepsController)
)

export default router

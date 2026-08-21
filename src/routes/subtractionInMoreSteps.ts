import express from 'express'
import { SubtractionInMoreStepsController } from '../controllers/subtractionInMoreStepsController'
import { requireJwt } from '../providers/auth/passport'
import { jwtStrategyInstance } from '../providers/auth/jwtStrategy'

// get the current router instance
const router = express.Router()

// get the current subtractionInMoreSteps controller instance
const subtractionInMoreStepsController = SubtractionInMoreStepsController.getInstance()
const verifyPrivileges = jwtStrategyInstance.verifyPrivileges.bind(jwtStrategyInstance)

/**
 * @swagger
 * /api/subtractionInMoreSteps/all:
 *   get:
 *     summary: Retrieve a list of subtractionInMoreSteps practice items
 *     security:
 *        - BearerAuth: []
 *     responses:
 *       200:
 *         description: A list of subtractionInMoreSteps items
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
 *                   substractor:
 *                     type: number
 *                     example: 17
 *                   reducer:
 *                     type: number
 *                     example: 8
 *                   result:
 *                     type: number
 *                     example: 9
 */
router.get('/all',
    requireJwt,
    verifyPrivileges([{ component: 'subtractionInMoreSteps', privilege: 'read' }]),
    subtractionInMoreStepsController.getAll.bind(subtractionInMoreStepsController)
)

/**
 * @swagger
 * /api/subtractionInMoreSteps/list:
 *   get:
 *     summary: Retrieve a list of subtractionInMoreSteps practice items
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
 *           example: 9
 *         description: filtering the subtractionInMoreSteps list
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
 *                 description: The field by which to sort the items (e.g., substractor, reducer, result)
 *               direction:
 *                 type: string
 *                 enum: [asc, desc]
 *                 example: desc
 *                 description: The order in which to sort the items (ascending or descending)
 *         description: The sorting options for the items, including field and order
 *     responses:
 *       200:
 *         description: A list of subtractionInMoreSteps items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   substractor:
 *                     type: number
 *                   reducer:
 *                     type: number
 *                   result:
 *                     type: number
 */
router.get('/list',
    requireJwt,
    verifyPrivileges([{ component: 'subtractionInMoreSteps', privilege: 'read' }]),
    subtractionInMoreStepsController.getList.bind(subtractionInMoreStepsController)
)

/**
 * @swagger
 * /api/subtractionInMoreSteps/{id}:
 *   get:
 *     summary: Retrieve a concrete subtractionInMoreSteps item
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
 *         description: a subtractionInMoreSteps item
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 substractor:
 *                   type: number
 *                 reducer:
 *                   type: number
 *                 result:
 *                   type: number
 *       404:
 *         description: Item not found
 */
router.get('/:id',
    requireJwt,
    verifyPrivileges([{ component: 'subtractionInMoreSteps', privilege: 'read' }]),
    subtractionInMoreStepsController.getById.bind(subtractionInMoreStepsController)
)

/**
 * @swagger
 * /api/subtractionInMoreSteps/{id}:
 *   put:
 *     summary: Update a concrete subtractionInMoreSteps item
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
 *               substractor:
 *                 type: number
 *                 example: 17
 *               reducer:
 *                 type: number
 *                 example: 8
 *               result:
 *                 type: number
 *                 example: 9
 *     responses:
 *       200:
 *         description: the updated subtractionInMoreSteps item
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 substractor:
 *                   type: number
 *                 reducer:
 *                   type: number
 *                 result:
 *                   type: number
 *       404:
 *         description: Item not found
 */
router.put('/:id',
    requireJwt,
    verifyPrivileges([{ component: 'subtractionInMoreSteps', privilege: 'write' }]),
    subtractionInMoreStepsController.update.bind(subtractionInMoreStepsController)
)

/**
 * @swagger
 * /api/subtractionInMoreSteps:
 *   post:
 *     summary: Create a new subtractionInMoreSteps item
 *     security:
 *        - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               substractor:
 *                 type: number
 *                 example: 17
 *               reducer:
 *                 type: number
 *                 example: 8
 *               result:
 *                 type: number
 *                 example: 9
 *     responses:
 *       201:
 *         description: the created subtractionInMoreSteps item
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 substractor:
 *                   type: number
 *                 reducer:
 *                   type: number
 *                 result:
 *                   type: number
 */
router.post('/',
    requireJwt,
    verifyPrivileges([{ component: 'subtractionInMoreSteps', privilege: 'write' }]),
    subtractionInMoreStepsController.create.bind(subtractionInMoreStepsController)
)

/**
 * @swagger
 * /api/subtractionInMoreSteps/{id}:
 *   delete:
 *     summary: Delete a concrete subtractionInMoreSteps item
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
 *         description: the deleted subtractionInMoreSteps item
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 substractor:
 *                   type: number
 *                 reducer:
 *                   type: number
 *                 result:
 *                   type: number
 *       404:
 *         description: Item not found
 */
router.delete('/:id',
    requireJwt,
    verifyPrivileges([{ component: 'subtractionInMoreSteps', privilege: 'delete' }]),
    subtractionInMoreStepsController.delete.bind(subtractionInMoreStepsController)
)

export default router

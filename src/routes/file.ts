import express from 'express'
import { FileController } from '../controllers/fileController'
import { requireJwt } from '../providers/auth/passport'
import { jwtStrategyInstance } from '../providers/auth/jwtStrategy'
import { singleFileUpload } from '../utils/upload/multer'

// get the current router instance
const router = express.Router()

// get the current file controller instance
const fileController = FileController.getInstance()
const verifyPrivileges = jwtStrategyInstance.verifyPrivileges.bind(jwtStrategyInstance)

/**
 * @swagger
 * /api/file:
 *   post:
 *     summary: Upload a new file
 *     tags: [General]
 *     security:
 *        - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: the stored file's metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 originalName:
 *                   type: string
 *                 mimeType:
 *                   type: string
 *                 size:
 *                   type: number
 *                 isImage:
 *                   type: boolean
 *                 category:
 *                   type: string
 *                   nullable: true
 *       400:
 *         description: no file was provided, or the file exceeds the size limit
 */
router.post('/',
    requireJwt,
    verifyPrivileges([{ component: 'file', privilege: 'write' }]),
    singleFileUpload('file'),
    fileController.uploadFile.bind(fileController)
)

/**
 * @swagger
 * /api/file/all:
 *   get:
 *     summary: Retrieve a list of uploaded files
 *     tags: [General]
 *     security:
 *        - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: filter the list to files uploaded under this category
 *     responses:
 *       200:
 *         description: a list of file metadata records
 */
router.get('/all',
    requireJwt,
    verifyPrivileges([{ component: 'file', privilege: 'read' }]),
    fileController.getAllFiles.bind(fileController)
)

/**
 * @swagger
 * /api/file/{id}:
 *   get:
 *     summary: Retrieve a file's metadata
 *     tags: [General]
 *     security:
 *        - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: the file's metadata
 *       404:
 *         description: file not found
 */
router.get('/:id',
    requireJwt,
    verifyPrivileges([{ component: 'file', privilege: 'read' }]),
    fileController.getFileById.bind(fileController)
)

/**
 * @swagger
 * /api/file/{id}/download:
 *   get:
 *     summary: Download a file's bytes, streamed from disk
 *     tags: [General]
 *     security:
 *        - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: quality
 *         schema:
 *           type: string
 *           enum: [low, high]
 *           default: high
 *         description: low returns the degraded copy (falls back to the original if none exists)
 *     responses:
 *       200:
 *         description: the file's bytes
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: file not found
 */
router.get('/:id/download',
    requireJwt,
    verifyPrivileges([{ component: 'file', privilege: 'read' }]),
    fileController.downloadFile.bind(fileController)
)

export default router

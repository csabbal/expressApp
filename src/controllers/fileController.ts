import express from 'express'
import fs from 'fs'
import { FileService } from '../services/fileService'
import { FileEntity } from '../types/File'
import { AppRequest } from '../types/CustomExpress'
import { loggedMethod } from '../utils/logger/logger'
import { BadRequestError } from '../utils/error/Error'

/**
 * This class is about to provide all requests related to uploaded files via fileService
 */
export class FileController {
    protected static _instance: FileController

    constructor(private fileService: FileService) { }

    static getInstance(): FileController {
        if (!this._instance) {
            this._instance = new FileController(FileService.getInstance())
        }
        return this._instance
    }

    /**
     * uploadFile controller method stores the multipart file taken from multer via fileService
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[FileController] uploadFile')
    public async uploadFile(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            if (!req.file) throw new BadRequestError('file is required')
            const uploadedBy = (req as AppRequest).user?.id
            const file: FileEntity = await this.fileService.uploadFile(req.file, { uploadedBy })
            res.status(201).json(file)
        } catch (e) {
            next(e)
        }
    }

    /**
     * getAllFiles controller method lists file metadata, optionally filtered by ?category=
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[FileController] getAllFiles')
    public async getAllFiles(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const category = req.query.category as string | undefined
            const files: FileEntity[] = await this.fileService.getAllFiles(category)
            res.json(files)
        } catch (e) {
            next(e)
        }
    }

    /**
     * getFileById controller method returns one file's metadata
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[FileController] getFileById')
    public async getFileById(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const { id } = req.params
            const file: FileEntity = await this.fileService.getFileById(id)
            res.json(file)
        } catch (e) {
            next(e)
        }
    }

    /**
     * downloadFile controller method streams either the original or the degraded copy of a file
     * @param {Request} req
     * @param {Response} res
     * @param {NextFunction} next
     */
    @loggedMethod('[FileController] downloadFile')
    public async downloadFile(req: express.Request, res: express.Response, next: express.NextFunction) {
        try {
            const { id } = req.params
            const quality = req.query.quality === 'low' ? 'low' : 'high'
            const target = await this.fileService.getDownloadTarget(id, quality)
            res.setHeader('Content-Type', target.mimeType)
            res.setHeader('Content-Disposition', `attachment; filename="${target.originalName}"`)
            const stream = fs.createReadStream(target.path)
            stream.on('error', (err) => next(err))
            stream.pipe(res)
        } catch (e) {
            next(e)
        }
    }
}

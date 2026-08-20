import dotenv from 'dotenv'
import { NextFunction, Request, Response } from 'express'
import multer from 'multer'
import { BadRequestError } from '../error/Error'

dotenv.config()
const { FILE_UPLOAD_MAX_SIZE_MB: maxSizeEnv } = process.env
const maxSizeMb = Number(maxSizeEnv) || 25

const uploadMiddleware = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxSizeMb * 1024 * 1024 }
})

/**
 * Returns an Express middleware that parses a single multipart file field into req.file,
 * converting multer's own errors (e.g. file too large) into a BadRequestError so they flow
 * through the standard errorHandlerMiddleware as a 400 instead of a 500
 * @param {string} fieldName the multipart form field name holding the file
 */
export function singleFileUpload(fieldName: string) {
    return (req: Request, res: Response, next: NextFunction) => {
        uploadMiddleware.single(fieldName)(req, res, (err: any) => {
            if (err) return next(new BadRequestError(err.message, 'file upload failed'))
            next()
        })
    }
}

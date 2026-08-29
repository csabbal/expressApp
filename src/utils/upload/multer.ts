import dotenv from 'dotenv'
import { NextFunction, Request, Response } from 'express'
import multer from 'multer'
import { BadRequestError } from '../error/Error'

dotenv.config()
const { FILE_UPLOAD_MAX_SIZE_MB: maxSizeEnv, FILE_UPLOAD_MAX_COUNT: maxCountEnv } = process.env
const maxSizeMb = Number(maxSizeEnv) || 25
const maxCount = Number(maxCountEnv) || 10

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

/**
 * Returns an Express middleware that parses multiple multipart files sharing one field name
 * into req.files, converting multer's own errors (e.g. file too large, too many files) into a
 * BadRequestError so they flow through the standard errorHandlerMiddleware as a 400 instead of
 * a 500
 * @param {string} fieldName the multipart form field name holding the files
 * @param {number} maxFiles the maximum number of files accepted in one request
 */
export function multipleFileUpload(fieldName: string, maxFiles: number = maxCount) {
    return (req: Request, res: Response, next: NextFunction) => {
        uploadMiddleware.array(fieldName, maxFiles)(req, res, (err: any) => {
            if (err) return next(new BadRequestError(err.message, 'file upload failed'))
            next()
        })
    }
}

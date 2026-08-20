import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { v4 as uuidv4 } from 'uuid'
import { fileRepository } from '../repositories'
import { IFileRepository } from '../types/repositories'
import { FileEntity } from '../types/File'
import { loggedMethod, logger } from '../utils/logger/logger'
import { NotFoundError } from '../utils/error/Error'

export interface UploadFileOptions {
    category?: string
    uploadedBy?: string
}

export class FileService {
    protected static _instance: FileService
    constructor(protected fileRepository: IFileRepository) { }

    /**
     * getInstance function provides that this class work as a singleton
     * @returns
    */
    static getInstance(): FileService {
        if (!this._instance) {
            this._instance = new FileService(fileRepository)
        }
        return this._instance
    }

    /**
     * uploadFile method writes the original bytes to disk, and — for images only —
     * a degraded, resized/re-compressed copy, then persists metadata for both via fileRepository
     * @param {Express.Multer.File} file
     * @param {UploadFileOptions} options
     * @returns {FileEntity}
    */
    public async uploadFile(file: Express.Multer.File, options: UploadFileOptions = {}): Promise<FileEntity> {
        logger.info('[FileService] uploadFile ' + file.originalname)
        const id = uuidv4()
        const extension = this.extractExtension(file.originalname)
        const targetDir = path.join(this.getUploadDir(), options.category ?? '', id)
        await fs.promises.mkdir(targetDir, { recursive: true })

        const originalPath = path.join(targetDir, `original${extension}`)
        await fs.promises.writeFile(originalPath, file.buffer)

        const isImage = file.mimetype.startsWith('image/')
        let lowQualityPath: string | null = null
        if (isImage) {
            lowQualityPath = path.join(targetDir, 'low.jpg')
            await sharp(file.buffer)
                .resize({ width: this.getLowQualityMaxWidth(), withoutEnlargement: true })
                .jpeg({ quality: this.getLowQualityJpegQuality() })
                .toFile(lowQualityPath)
        }

        const fileEntity = {
            id,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            isImage,
            category: options.category ?? null,
            originalPath,
            lowQualityPath,
            uploadedBy: options.uploadedBy ?? null,
            createdAt: new Date()
        } as FileEntity

        return await this.fileRepository.create(fileEntity)
    }

    /**
     * getAllFiles method lists all stored file records, optionally filtered by category
     * @param {string} category
     * @returns {FileEntity[]}
    */
    @loggedMethod('[FileService] getAllFiles')
    public async getAllFiles(category?: string): Promise<FileEntity[]> {
        return await this.fileRepository.find(category ? ({ category } as Partial<FileEntity>) : undefined)
    }

    /**
     * getFileById method fetches one file record by id, throwing NotFoundError if it doesn't exist
     * @param {string} id
     * @returns {FileEntity}
    */
    @loggedMethod('[FileService] getFileById')
    public async getFileById(id: string): Promise<FileEntity> {
        const file = await this.fileRepository.findOne({ id } as Partial<FileEntity>)
        if (!file) throw new NotFoundError(`file not found: ${id}`, 'file not found')
        return file
    }

    /**
     * getDownloadTarget method resolves which physical path to stream for a download request:
     * the degraded copy when quality is 'low' and one exists, otherwise the original
     * @param {string} id
     * @param {'low'|'high'} quality
     * @returns {{path: string, mimeType: string, originalName: string}}
    */
    @loggedMethod('[FileService] getDownloadTarget')
    public async getDownloadTarget(
        id: string,
        quality: 'low' | 'high'
    ): Promise<{ path: string, mimeType: string, originalName: string }> {
        const file = await this.getFileById(id)
        const useLowQuality = quality === 'low' && !!file.lowQualityPath
        const targetPath = useLowQuality ? file.lowQualityPath : file.originalPath
        if (useLowQuality) {
            return {
                path: targetPath,
                mimeType: 'image/jpeg',
                originalName: `${path.parse(file.originalName).name}.jpg`
            }
        }
        return { path: targetPath, mimeType: file.mimeType, originalName: file.originalName }
    }

    private extractExtension(originalName: string): string {
        const ext = path.extname(originalName)
        return ext || '.bin'
    }

    private getUploadDir(): string {
        return process.env.FILE_UPLOAD_DIR || './uploads'
    }

    private getLowQualityJpegQuality(): number {
        return Number(process.env.FILE_LOW_QUALITY_JPEG_QUALITY) || 20
    }

    private getLowQualityMaxWidth(): number {
        return Number(process.env.FILE_LOW_QUALITY_MAX_WIDTH) || 320
    }
}

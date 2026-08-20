import { expect } from 'chai'
import fs from 'fs'
import os from 'os'
import path from 'path'
import sinon, { SinonSandbox, SinonStub } from 'sinon'
import { FileService } from './fileService'
import { FileRepository } from '../repositories/File.repository'
import { NotFoundError } from '../utils/error/Error'

const ONE_PX_PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    'base64'
)

describe('FileService', () => {
    let sandbox: SinonSandbox
    let fileRepository: { create: SinonStub, find: SinonStub, findOne: SinonStub }
    let fileService: FileService
    let testUploadDir: string
    let originalUploadDirEnv: string | undefined

    beforeEach(() => {
        sandbox = sinon.createSandbox()
        testUploadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'file-service-test-'))
        originalUploadDirEnv = process.env.FILE_UPLOAD_DIR
        process.env.FILE_UPLOAD_DIR = testUploadDir
        fileRepository = {
            create: sandbox.stub().callsFake(async (data) => data),
            find: sandbox.stub().resolves([]),
            findOne: sandbox.stub().resolves(null)
        }
        fileService = new FileService(fileRepository as unknown as FileRepository)
    })

    afterEach(() => {
        sandbox.restore()
        process.env.FILE_UPLOAD_DIR = originalUploadDirEnv
        fs.rmSync(testUploadDir, { recursive: true, force: true })
    })

    describe('uploadFile', () => {
        it('should write the original and a degraded copy for image uploads, and store both paths', async () => {
            const file = {
                buffer: ONE_PX_PNG,
                originalname: 'pixel.png',
                mimetype: 'image/png',
                size: ONE_PX_PNG.length
            } as Express.Multer.File

            const result = await fileService.uploadFile(file)

            expect(result.isImage).to.be.true
            expect(result.category).to.equal(null)
            expect(fs.existsSync(result.originalPath)).to.be.true
            expect(result.lowQualityPath).to.not.equal(null)
            expect(fs.existsSync(result.lowQualityPath as string)).to.be.true
            expect(fileRepository.create.calledOnce).to.be.true
        })

        it('should only write the original file for non-image uploads', async () => {
            const file = {
                buffer: Buffer.from('not an image'),
                originalname: 'notes.txt',
                mimetype: 'text/plain',
                size: 12
            } as Express.Multer.File

            const result = await fileService.uploadFile(file)

            expect(result.isImage).to.be.false
            expect(result.lowQualityPath).to.equal(null)
            expect(fs.existsSync(result.originalPath)).to.be.true
        })

        it('should store the file under the given category on disk and in the record', async () => {
            const file = {
                buffer: ONE_PX_PNG,
                originalname: 'pixel.png',
                mimetype: 'image/png',
                size: ONE_PX_PNG.length
            } as Express.Multer.File

            const result = await fileService.uploadFile(file, { category: 'movie', uploadedBy: 'user-1' })

            expect(result.category).to.equal('movie')
            expect(result.uploadedBy).to.equal('user-1')
            expect(result.originalPath).to.include(path.join(testUploadDir, 'movie'))
        })
    })

    describe('getAllFiles', () => {
        it('should list all files when no category is given', async () => {
            await fileService.getAllFiles()
            expect(fileRepository.find.calledOnceWith(undefined)).to.be.true
        })

        it('should filter by category when given', async () => {
            await fileService.getAllFiles('movie')
            expect(fileRepository.find.calledOnceWith({ category: 'movie' })).to.be.true
        })
    })

    describe('getFileById', () => {
        it('should throw NotFoundError when the file does not exist', async () => {
            fileRepository.findOne.resolves(null)
            try {
                await fileService.getFileById('missing-id')
                expect.fail('expected NotFoundError to be thrown')
            } catch (e) {
                expect(e).to.be.instanceOf(NotFoundError)
            }
        })

        it('should return the file record when found', async () => {
            const stored = { id: 'file-1', originalName: 'a.png' }
            fileRepository.findOne.resolves(stored)
            const result = await fileService.getFileById('file-1')
            expect(result).to.deep.equal(stored)
        })
    })

    describe('getDownloadTarget', () => {
        it('should return the original path when quality is high', async () => {
            fileRepository.findOne.resolves({
                id: 'file-1', mimeType: 'image/png', originalName: 'a.png',
                originalPath: '/uploads/file-1/original.png', lowQualityPath: '/uploads/file-1/low.jpg'
            })
            const target = await fileService.getDownloadTarget('file-1', 'high')
            expect(target.path).to.equal('/uploads/file-1/original.png')
        })

        it('should return the low quality path when quality is low and one exists', async () => {
            fileRepository.findOne.resolves({
                id: 'file-1', mimeType: 'image/png', originalName: 'a.png',
                originalPath: '/uploads/file-1/original.png', lowQualityPath: '/uploads/file-1/low.jpg'
            })
            const target = await fileService.getDownloadTarget('file-1', 'low')
            expect(target.path).to.equal('/uploads/file-1/low.jpg')
        })

        it('should fall back to the original path when quality is low but no degraded copy exists', async () => {
            fileRepository.findOne.resolves({
                id: 'file-1', mimeType: 'application/pdf', originalName: 'a.pdf',
                originalPath: '/uploads/file-1/original.pdf', lowQualityPath: null
            })
            const target = await fileService.getDownloadTarget('file-1', 'low')
            expect(target.path).to.equal('/uploads/file-1/original.pdf')
        })
    })
})

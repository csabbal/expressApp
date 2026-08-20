import { expect } from 'chai'
import sinon, { SinonSandbox, SinonStub } from 'sinon'
import { MovieService } from './movieService'
import { MovieRepository } from '../repositories/Movie.repository'
import { FileService } from './fileService'
import { NotFoundError } from '../utils/error/Error'

describe('MovieService', () => {
    let sandbox: SinonSandbox
    let movieRepository: { updateOne: SinonStub, findOne: SinonStub }
    let fileService: { uploadFile: SinonStub }
    let movieService: MovieService

    beforeEach(() => {
        sandbox = sinon.createSandbox()
        movieRepository = {
            updateOne: sandbox.stub().resolves({ id: 'movie-1', image: 'file-1' }),
            findOne: sandbox.stub().resolves({ id: 'movie-1' })
        }
        fileService = { uploadFile: sandbox.stub().resolves({ id: 'file-1' }) }
        movieService = new MovieService(
            movieRepository as unknown as MovieRepository,
            fileService as unknown as FileService
        )
    })

    afterEach(() => {
        sandbox.restore()
    })

    describe('uploadImage', () => {
        it('should upload the file under the movie category and store its id on the movie', async () => {
            const file = { originalname: 'poster.png' } as Express.Multer.File

            const result = await movieService.uploadImage('movie-1', file, 'user-1')

            expect(fileService.uploadFile.calledOnceWith(file, { category: 'movie', uploadedBy: 'user-1' }))
                .to.be.true
            expect(movieRepository.updateOne.calledOnceWith({ id: 'movie-1' }, { image: 'file-1' })).to.be.true
            expect(result).to.deep.equal({ id: 'movie-1', image: 'file-1' })
        })

        it('should throw NotFoundError and not upload the file when the movie does not exist', async () => {
            movieRepository.findOne.resolves(null)
            const file = { originalname: 'poster.png' } as Express.Multer.File

            try {
                await movieService.uploadImage('missing-movie', file, 'user-1')
                expect.fail('expected NotFoundError to be thrown')
            } catch (e) {
                expect(e).to.be.instanceOf(NotFoundError)
            }

            expect(fileService.uploadFile.called).to.be.false
            expect(movieRepository.updateOne.called).to.be.false
        })
    })
})

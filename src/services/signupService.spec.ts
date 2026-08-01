import { expect } from 'chai'
import md5 from 'md5'
import sinon, { SinonSandbox, SinonSpy, SinonStub } from 'sinon'
import { loggerInstance } from '../utils/logger/logger'
import { SignupService } from './signupService'
import { UserRepository } from '../repositories/User.repository'
import { BadRequestError, ConflictError } from '../utils/error/Error'

let sandbox: SinonSandbox

describe('SignupService', () => {
    let loggerSpy: SinonSpy
    let signupServiceInstance: SignupService
    let userRepository: { findOne: SinonStub, create: SinonStub }
    const validData = { username: 'jdoe', email: 'jdoe@example.com', password: 'longenoughpw' }
    const createdUser = {
        id: 'generated-id',
        name: 'jdoe',
        email: 'jdoe@example.com',
        password: md5('longenoughpw'),
        fullName: 'jdoe',
        jwtSecureCode: 'generated-code'
    }

    beforeEach(() => {
        sandbox = sinon.createSandbox()
        loggerSpy = sandbox.spy(loggerInstance.logger, 'info')
        userRepository = {
            findOne: sandbox.stub().resolves(null),
            create: sandbox.stub().resolves(createdUser)
        } as any
        signupServiceInstance = new SignupService(userRepository as unknown as UserRepository)
    })
    afterEach(() => {
        sandbox.restore()
    })

    describe('getInstance', () => {
        it('should return with instance', () => {
            const instance = SignupService.getInstance()
            expect(instance).deep.equal((SignupService as any)._instance)
        })
    })

    describe('signup', () => {
        it('should call the logger method', async () => {
            await signupServiceInstance.signup(validData)
            expect(loggerSpy.callCount > 0).to.be.true
        })

        it('should throw BadRequestError when username is missing', async () => {
            try {
                await signupServiceInstance.signup({ ...validData, username: '' })
                expect.fail('expected signup to throw')
            } catch (e) {
                expect(e).to.be.instanceOf(BadRequestError)
            }
        })

        it('should throw BadRequestError when email is missing', async () => {
            try {
                await signupServiceInstance.signup({ ...validData, email: '' })
                expect.fail('expected signup to throw')
            } catch (e) {
                expect(e).to.be.instanceOf(BadRequestError)
            }
        })

        it('should throw BadRequestError when password is missing', async () => {
            try {
                await signupServiceInstance.signup({ ...validData, password: '' })
                expect.fail('expected signup to throw')
            } catch (e) {
                expect(e).to.be.instanceOf(BadRequestError)
            }
        })

        it('should throw BadRequestError when email is not a valid format', async () => {
            try {
                await signupServiceInstance.signup({ ...validData, email: 'not-an-email' })
                expect.fail('expected signup to throw')
            } catch (e) {
                expect(e).to.be.instanceOf(BadRequestError)
            }
        })

        it('should throw BadRequestError when password is shorter than 8 characters', async () => {
            try {
                await signupServiceInstance.signup({ ...validData, password: 'short1' })
                expect.fail('expected signup to throw')
            } catch (e) {
                expect(e).to.be.instanceOf(BadRequestError)
            }
        })

        it('should throw ConflictError when the username is already taken', async () => {
            userRepository.findOne = sandbox.stub().resolves(createdUser)
            try {
                await signupServiceInstance.signup(validData)
                expect.fail('expected signup to throw')
            } catch (e) {
                expect(e).to.be.instanceOf(ConflictError)
            }
        })

        it('should throw ConflictError when the email is already registered', async () => {
            userRepository.findOne = sandbox.stub()
            userRepository.findOne.onFirstCall().resolves(null)
            userRepository.findOne.onSecondCall().resolves(createdUser)
            try {
                await signupServiceInstance.signup(validData)
                expect.fail('expected signup to throw')
            } catch (e) {
                expect(e).to.be.instanceOf(ConflictError)
            }
        })

        describe('userRepository create', () => {
            it('should be called with a user built from the request, password hashed with md5', async () => {
                await signupServiceInstance.signup(validData)
                const paramsOfCreate = userRepository.create.args[0][0]
                expect(paramsOfCreate.name).to.equal('jdoe')
                expect(paramsOfCreate.email).to.equal('jdoe@example.com')
                expect(paramsOfCreate.password).to.equal(md5('longenoughpw'))
                expect(paramsOfCreate.fullName).to.equal('jdoe')
                expect(paramsOfCreate.id).to.be.a('string').and.not.empty
                expect(paramsOfCreate.jwtSecureCode).to.be.a('string').and.not.empty
            })
        })

        it('should return the created user without password or jwtSecureCode', async () => {
            const result = await signupServiceInstance.signup(validData)
            expect(result).to.deep.equal({
                id: createdUser.id,
                name: createdUser.name,
                email: createdUser.email
            })
        })
    })
})

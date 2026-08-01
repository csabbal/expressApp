import { expect } from 'chai'
import sinon, { SinonSandbox, SinonSpy, SinonStub } from 'sinon'
import { SignupController } from './signupController'
import { SignupService } from '../services/signupService'
import { loggerInstance } from '../utils/logger/logger'

let sandbox: SinonSandbox

describe('SignupController', () => {
    let signupControllerInstance: SignupController
    let signupService: { signup: SinonStub }
    let req: any
    let res: any
    let next: SinonStub
    let jsonStub: SinonStub
    let statusStub: SinonStub
    let debugSpy: SinonSpy
    let infoSpy: SinonSpy
    const plaintextPassword = 'longenoughpw'

    beforeEach(() => {
        sandbox = sinon.createSandbox()
        jsonStub = sandbox.stub()
        statusStub = sandbox.stub().returns({ json: jsonStub })
        req = { body: { username: 'jdoe', email: 'jdoe@example.com', password: plaintextPassword } }
        res = { status: statusStub }
        next = sandbox.stub()
        signupService = { signup: sandbox.stub().resolves({ id: '1', name: 'jdoe', email: 'jdoe@example.com' }) }
        signupControllerInstance = new SignupController(signupService as unknown as SignupService)
        debugSpy = sandbox.spy(loggerInstance.logger, 'debug')
        infoSpy = sandbox.spy(loggerInstance.logger, 'info')
    })
    afterEach(() => {
        sandbox.restore()
    })

    describe('getInstance', () => {
        it('should return with instance', () => {
            const instance = SignupController.getInstance()
            expect(instance).deep.equal((SignupController as any)._instance)
        })
    })

    describe('signupLocal', () => {
        it('should call signupService.signup with the request body', async () => {
            await signupControllerInstance.signupLocal(req, res, next)
            expect(signupService.signup.args[0][0]).to.deep.equal(req.body)
        })

        it('should respond 201 with the created user on success', async () => {
            await signupControllerInstance.signupLocal(req, res, next)
            expect(statusStub.calledWith(201)).to.be.true
            expect(jsonStub.args[0][0]).to.deep.equal({ id: '1', name: 'jdoe', email: 'jdoe@example.com' })
        })

        it('should call next with the error when signupService.signup throws', async () => {
            const thrownError = new Error('something_went_wrong')
            signupService.signup = sandbox.stub().rejects(thrownError)
            signupControllerInstance = new SignupController(signupService as unknown as SignupService)

            await signupControllerInstance.signupLocal(req, res, next)

            expect(next.args[0][0]).to.equal(thrownError)
        })

        it('should never log the plaintext password', async () => {
            await signupControllerInstance.signupLocal(req, res, next)

            const allLoggedArgs = [...debugSpy.args, ...infoSpy.args]
            const leaked = allLoggedArgs.some(callArgs =>
                callArgs.some(arg => typeof arg === 'string' && arg.includes(plaintextPassword))
            )
            expect(leaked).to.be.false
        })
    })
})

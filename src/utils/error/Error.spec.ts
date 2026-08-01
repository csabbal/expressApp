import { expect } from 'chai'
import sinon, { SinonSandbox, SinonStub } from 'sinon'
import { ConflictError, errorHandlerMiddleware } from './Error'

describe('ConflictError', () => {
    describe('sendJSONResponse', () => {
        it('should respond with 409 and the public message', () => {
            const error = new ConflictError('email already registered')
            const json = sinon.stub()
            const res = { status: sinon.stub().returns({ json }) } as any

            error.sendJSONResponse(res)

            expect(res.status.calledWith(409)).to.be.true
            expect(json.args[0][0]).to.deep.include({
                success: false,
                status: 409,
                message: 'email already registered'
            })
        })

        it('should prefer publicInformation over message when given', () => {
            const error = new ConflictError('internal detail', 'username already taken')
            const json = sinon.stub()
            const res = { status: sinon.stub().returns({ json }) } as any

            error.sendJSONResponse(res)

            expect(json.args[0][0].message).to.equal('username already taken')
        })
    })
})

describe('errorHandlerMiddleware', () => {
    let sandbox: SinonSandbox
    let next: SinonStub
    beforeEach(() => {
        sandbox = sinon.createSandbox()
        next = sandbox.stub()
    })
    afterEach(() => {
        sandbox.restore()
    })

    it('should call sendJSONResponse on a ConflictError instance', async () => {
        const error = new ConflictError('email already registered')
        const sendJSONResponseStub = sandbox.stub(error, 'sendJSONResponse')
        const res = {} as any

        await errorHandlerMiddleware(error, {} as any, res, next as any)

        expect(sendJSONResponseStub.calledOnceWith(res)).to.be.true
    })
})

import { expect } from 'chai'
import sinon, { SinonSandbox, SinonStub } from 'sinon'
import { ConflictError, errorHandlerMiddleware, NotFoundError } from './Error'

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

describe('NotFoundError', () => {
    describe('sendJSONResponse', () => {
        it('should respond with 404 and the public message', () => {
            const error = new NotFoundError('file not found: abc-123')
            const json = sinon.stub()
            const res = { status: sinon.stub().returns({ json }) } as any

            error.sendJSONResponse(res)

            expect(res.status.calledWith(404)).to.be.true
            expect(json.args[0][0]).to.deep.include({
                success: false,
                status: 404,
                message: 'file not found: abc-123'
            })
        })

        it('should prefer publicInformation over message when given', () => {
            const error = new NotFoundError('internal detail', 'file not found')
            const json = sinon.stub()
            const res = { status: sinon.stub().returns({ json }) } as any

            error.sendJSONResponse(res)

            expect(json.args[0][0].message).to.equal('file not found')
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

    it('should call sendJSONResponse on a NotFoundError instance', async () => {
        const error = new NotFoundError('file not found: abc-123')
        const sendJSONResponseStub = sandbox.stub(error, 'sendJSONResponse')
        const res = {} as any

        await errorHandlerMiddleware(error, {} as any, res, next as any)

        expect(sendJSONResponseStub.calledOnceWith(res)).to.be.true
    })
})

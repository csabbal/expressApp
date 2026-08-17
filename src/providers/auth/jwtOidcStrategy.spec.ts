import { expect } from 'chai'
import sinon, { SinonSandbox, SinonStub } from 'sinon'
import { UserRepository } from '../../repositories/User.repository'
import { JWTOidcStrategy } from './jwtOidcStrategy'

let sandbox: SinonSandbox

describe('JWTOidcStrategy', () => {
    let jwtOidcStrategyInstance: JWTOidcStrategy
    let userRepository: { create: SinonStub, findOne: SinonStub }
    let oauth2: { Strategy: SinonStub }
    const options = {
        jwtFromRequest: () => 'token',
        secretOrKeyProvider: sinon.stub(),
        audience: 'urn:oauth-provider:services',
        issuer: 'http://localhost:3200/oidc',
        algorithms: ['RS256']
    }
    const payload = { id: 'user-1', email: 'user@example.com', permissions: [] }

    beforeEach(() => {
        sandbox = sinon.createSandbox()
        oauth2 = { Strategy: sandbox.stub() }
        userRepository = {
            create: sandbox.stub().resolves(undefined),
            findOne: sandbox.stub().resolves(undefined)
        } as any
        jwtOidcStrategyInstance = new JWTOidcStrategy(options, userRepository as unknown as UserRepository, oauth2)
    })
    afterEach(() => {
        sandbox.restore()
    })

    describe('verifyUser', () => {
        it('should return an object with id and email when the payload has an id', async () => {
            const result = await jwtOidcStrategyInstance.verifyUser(payload)
            expect(result).to.deep.equal({ id: payload.id, email: payload.email })
        })
        it('should not call the user repository', async () => {
            await jwtOidcStrategyInstance.verifyUser(payload)
            expect(userRepository.findOne.called).to.be.false
        })
        it('should return false when the payload has no id', async () => {
            const result = await jwtOidcStrategyInstance.verifyUser({ email: 'user@example.com' })
            expect(result).to.equal(false)
        })
        it('should return false when the payload is empty', async () => {
            const result = await jwtOidcStrategyInstance.verifyUser({})
            expect(result).to.equal(false)
        })
    })

    describe('getAuthCallBack', () => {
        let result: (payload: any, done: any) => Promise<any>
        let verifyStub: SinonStub
        let callbackFunction: SinonStub

        beforeEach(() => {
            verifyStub = sandbox.stub(jwtOidcStrategyInstance, 'verifyUser')
                .resolves({ id: payload.id, email: payload.email })
            callbackFunction = sandbox.stub()
            result = jwtOidcStrategyInstance.getAuthCallBack()
        })

        it('should return a function', () => {
            expect(result).to.be.a('function')
        })

        it('should call verifyUser with the given payload', async () => {
            await result(payload, callbackFunction)
            expect(verifyStub.calledOnceWith(payload)).to.be.true
        })

        it('should call done with the result of verifyUser', async () => {
            await result(payload, callbackFunction)
            expect(callbackFunction.args[0][0]).to.equal(null)
            expect(callbackFunction.args[0][1]).to.deep.equal({ id: payload.id, email: payload.email })
        })

        it('should call done with the error when verifyUser throws', async () => {
            const error = new Error('something went wrong')
            verifyStub.throws(error)
            await result(payload, callbackFunction)
            expect(callbackFunction.args[0][0]).to.equal(error)
        })
    })
})

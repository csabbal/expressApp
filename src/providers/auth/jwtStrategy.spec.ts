import { expect } from 'chai'
import sinon, { SinonSandbox, SinonSpy, SinonStub } from 'sinon'
import { UserRepository } from '../../repositories/User.repository'
import { UserPermissionsRepository } from '../../repositories/UserPermissions.repository'
import { Permission } from '../../types/Permission'
import { loggerInstance } from '../../utils/logger/logger'
import { JWTStrategy } from './jwtStrategy'

let sandbox: SinonSandbox

describe('AuthStrategy', () => {
    let jwtStrategyInstance: JWTStrategy
    let userRepository: { create: SinonStub, findOne: SinonStub }
    let userPermissionsRepository: { findOne: SinonStub }
    let jwtHandler: { sign: SinonStub }
    let crypt: { hashValue: SinonStub, checkValue: SinonStub }
    const options = {
        authorizationURL: 'authURL',
        tokenURL: 'tokenURL',
        clientID: 'clientId',
        clientSecret: 'secretId',
        callbackURL: `callback`,
        proxy: true
    }
    const mockUser = {
        id: '1',
        name: 'test',
        fullName: 'given family',
        email: 'test@gmail.com',
        password: 'testpassword',
        jwtSecureCode: 'test'
    }
    const profile = {
        displayName: 'test',
        id: 'test',
        emails: [{ value: 'test@gmail.com' }],
        fullName: 'testname',
        jwtSecureCode: 'secure',
        name: { givenName: 'given', familyName: 'family' }
    }

    let oauth2: {
        Strategy: SinonStub
    }
    const jwtSecret = 'secret'
    beforeEach(() => {
        sandbox = sinon.createSandbox()
        oauth2 = { Strategy: sandbox.stub() }
        userRepository = {
            create: sandbox.stub().resolves(mockUser),
            findOne: sandbox.stub().resolves(mockUser)
        } as any
        crypt = {
            hashValue: sandbox.stub().resolves('hashtoken'),
            checkValue: sandbox.stub().resolves(true)
        } as any
        userPermissionsRepository = {
            findOne: sandbox.stub().resolves({ permissions: [{ component: 'all', privilege: 'read' }] })
        } as any
        jwtHandler = {
            sign: sandbox.stub().resolves('token')
        } as any
        jwtStrategyInstance = new JWTStrategy(options,
            userRepository as unknown as UserRepository,
            userPermissionsRepository as unknown as UserPermissionsRepository,
            oauth2,
            jwtHandler,
            crypt,
            jwtSecret
        )
    })
    afterEach(() => {
        sandbox.restore()
    })

    describe('verifyUser', () => {
        it('should throw error if the profile is not given', async () => {
            try {
                await jwtStrategyInstance.verifyUser({})
            } catch (e) {
                expect(e).to.be.instanceOf(Error)
                expect(e.message).to.be.equals('jwtSecureCode is missing')
            }
        })
        it('should return the user if user was found in user repository', async () => {
            const result = await jwtStrategyInstance.verifyUser(profile)
            expect(result).deep.equals(mockUser)
        })
        it('should call crypt checkValue with jwtsecurecode of user returned by repository and the one contained by payload', async () => {
            crypt.checkValue.resolves(true)
            await jwtStrategyInstance.verifyUser(profile)
            expect(crypt.checkValue.calledOnce).to.be.true
            expect(crypt.checkValue.args[0][0]).deep.equals(mockUser.jwtSecureCode)
            expect(crypt.checkValue.args[0][1]).deep.equals(profile.jwtSecureCode)

        })
        it('should call the userRepository findOne method with payload id attribute', async () => {
            await jwtStrategyInstance.verifyUser(mockUser)
            const expectedArgument = { id: mockUser.id }
            expect(userRepository.findOne.args[0][0]).deep.equals(expectedArgument)
        })
    })
    describe('verifyPrivileges', () => {
        let req = {}
        let next: SinonStub
        let mockResponse = {}
        let neededPrivileges: Permission[] = []
        beforeEach(() => {
            req = { user: mockUser }
            next = sandbox.stub()
            mockResponse = { status: () => ({ json: (data) => { data } }) }
            neededPrivileges = [{ component: 'test', privilege: 'read' }]
        })

        it('should return a function ', async () => {
            const result = await jwtStrategyInstance.verifyPrivileges(neededPrivileges)
            expect(result).to.be.a('function')
        })

        it('should return a function which call userPermissions findOne with given user', async () => {
            const result = await jwtStrategyInstance.verifyPrivileges(neededPrivileges)
            await result(req, mockResponse, next)
            expect(userPermissionsRepository.findOne.calledOnce).to.be.true
        })

        it('should return a function which calls next if the current user privileges meet the requirments', async () => {
            const result = await jwtStrategyInstance.verifyPrivileges(neededPrivileges)
            await result(req, mockResponse, next)
            expect(next.calledOnce).to.be.true
        })
    })
    describe('generateJWT', () => {
        const hashSecureCode = 'hashSecureCode'
        beforeEach(() => {
            crypt.hashValue.resolves(hashSecureCode)
        })

        it('should call the crypt\'s hashValue ', async () => {

            await jwtStrategyInstance.generateJWT(mockUser, [])
            expect(crypt.hashValue.calledOnce).to.be.true
            expect(crypt.hashValue.args[0][0]).deep.equals(mockUser.jwtSecureCode)
        })
        it('should call the jwtHandler\'s sign ', async () => {
            const permissions = []
            await jwtStrategyInstance.generateJWT(mockUser, permissions)
            expect(jwtHandler.sign.calledOnce).to.be.true
            expect(jwtHandler.sign.args[0][0]).deep.equals({
                expiresIn: '12h',
                id: mockUser.id,
                email: mockUser.email,
                permissions: permissions,
                jwtSecureCode: hashSecureCode
            })
            expect(jwtHandler.sign.args[0][1]).deep.equals(jwtSecret)

        })
    })
    describe('getAuthCallBack', () => {
        const payload = { id: mockUser.id }
        let verifyStub: SinonStub
        let result = async (payload: any, done: any) => { }
        let callbackFunction: SinonStub
        beforeEach(() => {
            verifyStub = sandbox.stub(jwtStrategyInstance, 'verifyUser').resolves(mockUser)
            callbackFunction = sandbox.stub()
            result = jwtStrategyInstance.getAuthCallBack()
        })

        it('should return a function ', async () => {
            expect(result).to.be.a('function')
        })

        describe('returnd function', () => {
            it('should call verifyUser with given payload', async () => {
                result(payload, () => { })
                expect(verifyStub.calledOnce).to.be.true
                expect(verifyStub.args[0][0]).deep.equals(payload)
            })
            it('should returns the callback function call used verifyusers return value as attribute', async () => {
                await result(payload, callbackFunction)
                expect(callbackFunction.args[0][1]).equal(mockUser)

            })
            it('should returns the callback function with error as attribute if error happened', async () => {
                const error = new Error('something went wrong')
                verifyStub.throws(error)
                await result(payload, callbackFunction)
                expect(callbackFunction.args[0][0]).equal(error)

            })
        })
    })
})
import { expect } from 'chai'
import sinon, { SinonSandbox, SinonSpy, SinonStub } from 'sinon'
import { loggerInstance } from '../../utils/logger/logger'
import AuthStrategy from './authStrategy'
import { UserRepository } from '../../repositories/User.repository'

class TestAuthStrategyClass extends AuthStrategy { }

describe('AuthStrategy', () => {
    let sandbox: SinonSandbox
    let loggerSpy: SinonSpy
    let authStrategyInstance: AuthStrategy
    let userRepository: { create: SinonStub, findOne: SinonStub }
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
    beforeEach(() => {
        sandbox = sinon.createSandbox()
        oauth2 = { Strategy: sandbox.stub() }
        loggerSpy = sandbox.spy(loggerInstance.logger, 'info')
        userRepository = {
            create: sandbox.stub().resolves(mockUser),
            findOne: sandbox.stub().resolves(mockUser)
        } as any
        authStrategyInstance = new TestAuthStrategyClass(options, userRepository as unknown as UserRepository, oauth2)
    })
    afterEach(() => {
        sandbox.restore()
    })

    describe('createNewUserFromAuthUser', () => {


        it('should call the logger method', async () => {
            await authStrategyInstance.createNewUserFromAuthUser({})
            expect(loggerSpy.calledOnce).to.be.true
        })

        describe('userRepository create', () => {
            beforeEach(async () => {
                await authStrategyInstance.createNewUserFromAuthUser(profile)
            })
            it('should be called a mapped profile data', async () => {
                const paramsOfCreate = userRepository.create.args[0][0]
                expect(paramsOfCreate.name).equal(profile.displayName)
                expect(paramsOfCreate.googleId).equal(profile.id)
                expect(paramsOfCreate.email).deep.equal(profile.emails[0].value)
            })
            it('should be called in order to create a new user based on profile', async () => {
                expect(userRepository.create.calledOnce).to.be.true
            })
        })
    })
    describe('checkExistingUserByProfile', () => {
        it('should find the user in the repository, based on the given profile id', async () => {
            await authStrategyInstance.checkExistingUserByProfile(profile)
            expect(userRepository.findOne.calledOnce).to.be.true
            expect(userRepository.findOne.args[0][0]).deep.equals({ googleId: profile.id })
        })
    })
    describe('getAuthCallBack', () => {
        let callBackFunction: (_accessToken: unknown, _refreshToken: unknown, profile: any, done: any) => Promise<any>
        beforeEach(() => {
            authStrategyInstance = new TestAuthStrategyClass(options, userRepository as any as UserRepository, oauth2)
            callBackFunction = authStrategyInstance.getAuthCallBack()
        })
        describe('the callback function returned ', async () => {
            it('should call checkExistingUserByProfile with profile taken as parameter', async () => {
                const checkExsistingStub = sandbox.stub(authStrategyInstance, 'checkExistingUserByProfile').resolves()
                await callBackFunction('token', 'refreshToken', profile, () => { })
                expect(checkExsistingStub.args[0][0]).deep.equal(profile)
            })
            it('should call done function with return of the checkExistingUserByProfile', async () => {
                const returnValueOfTheExistingUser = mockUser
                sandbox.stub(authStrategyInstance, 'checkExistingUserByProfile').resolves(returnValueOfTheExistingUser)
                const doneStub = sandbox.stub()
                await callBackFunction('token', 'refreshToken', profile, doneStub)
                expect(doneStub.args[0][1]).deep.equal(returnValueOfTheExistingUser)
            })
            it('should call done function with error thrown by checkExistingUserByProfile', async () => {
                const tobeCaughtError = new Error('something_went_wrong')
                sandbox.stub(authStrategyInstance, 'checkExistingUserByProfile').throws(tobeCaughtError)
                const doneStub = sandbox.stub()
                await callBackFunction('token', 'refreshToken', profile, doneStub)
                expect(doneStub.args[0][0]).deep.equal(tobeCaughtError)
            })
        })
    })
    describe('getStrategy', () => {
        let strategyInstance: any
        beforeEach(() => {
            strategyInstance = authStrategyInstance.getStrategy()
        })

        it('should return with a strategy instance ', async () => {
            expect(strategyInstance instanceof oauth2.Strategy).to.be.true
        })
        it('should instantiate a new Strategy instance ', async () => {
            expect(oauth2.Strategy.calledOnce).to.be.true
        })

        it('should instantiate a new Strategy instance with given options', async () => {
            expect(oauth2.Strategy.args[0][0]).deep.equal(options)
        })

        it('should instantiate a new Strategy instance with getAuthCallBack method as second attribute', async () => {
            const expectedCallback = authStrategyInstance.getAuthCallBack.bind(authStrategyInstance)().toString()
            const callback = oauth2.Strategy.args[0][1]
            expect(typeof callback).to.equal('function')
            expect(expectedCallback).equal(callback.toString())
        })

    })
})
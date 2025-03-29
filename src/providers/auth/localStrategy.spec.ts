import { expect } from 'chai'
import sinon, { SinonSandbox, SinonSpy, SinonStub } from 'sinon'
import { loggerInstance } from '../../utils/logger/logger'
import { CustomLocalStrategy } from './localStrategy'
import { UserRepository } from '../../repositories/User.repository'
import md5 from 'md5'

let sandbox: SinonSandbox

describe('LocalStrategy', () => {
    let loggerSpy: SinonSpy
    let authStrategyInstance: CustomLocalStrategy
    const options = {
        username: 'username', // Field name for username
        password: 'password'  // Field name for password
    }
    let userRepository: { create: SinonStub, findOne: SinonStub }
    let oauth2: {
        Strategy: SinonStub
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
        username: 'user', password: 'password'
    }
    beforeEach(() => {
        sandbox = sinon.createSandbox()
        oauth2 = { Strategy: sandbox.stub() }
        loggerSpy = sandbox.spy(loggerInstance.logger, 'info')
        userRepository = {
            create: sandbox.stub().resolves(mockUser),
            findOne: sandbox.stub().resolves(mockUser)
        } as any
        authStrategyInstance = new CustomLocalStrategy(options, userRepository as unknown as UserRepository, oauth2)
    })
    afterEach(() => {
        sandbox.restore()
    })
    describe('checkExistingUserByProfile', () => {
        it('should find the user in the repository, based on the given profile id', async () => {
            await authStrategyInstance.checkExistingUserByProfile(profile)
            expect(userRepository.findOne.calledOnce).to.be.true
            expect(userRepository.findOne.args[0][0]).deep.equals({ name: profile.username, password: md5(profile.password) })
        })
    })
    describe('getAuthCallBack', () => {
        let callBackFunction: (username: string, password: string, done: any) => Promise<any>
        beforeEach(() => {
            callBackFunction = authStrategyInstance.getAuthCallBack()
        })
        describe('the callback function returned ', async () => {
            it('should call checkExistingUserByProfile with profile taken as parameter', async () => {
                const checkExsistingStub = sandbox.stub(authStrategyInstance, 'checkExistingUserByProfile').resolves()
                await callBackFunction('user', 'password', () => { })
                expect(checkExsistingStub.args[0][0]).deep.equal(profile)
            })
            it('should call done function with return of the checkExistingUserByProfile', async () => {
                const returnValueOfTheExistingUser = mockUser
                sandbox.stub(authStrategyInstance, 'checkExistingUserByProfile').resolves(returnValueOfTheExistingUser)
                const doneStub = sandbox.stub()
                await callBackFunction('user', 'password', doneStub)
                expect(doneStub.args[0][1]).deep.equal(returnValueOfTheExistingUser)
            })
            it('should call done function with error thrown by checkExistingUserByProfile', async () => {
                const tobeCaughtError = new Error('something_went_wrong')
                sandbox.stub(authStrategyInstance, 'checkExistingUserByProfile').throws(tobeCaughtError)
                const doneStub = sandbox.stub()
                await callBackFunction('user', 'password', doneStub)
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
            const callback = oauth2.Strategy.args[0][1]
            expect(typeof callback).to.equal('function')
            expect(authStrategyInstance.getAuthCallBack().toString()).equal(callback.toString())
        })
    })
})
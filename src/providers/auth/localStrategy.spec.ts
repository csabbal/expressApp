import { expect } from 'chai'
import sinon, { SinonSandbox, SinonStub } from 'sinon'
import { UserRepository } from '../../repositories/User.repository'
import { CustomLocalStrategy } from './localStrategy'
import crypt from '../../utils/Crypt'

let sandbox: SinonSandbox

describe('LocalStrategy', () => {
    let authStrategyInstance: CustomLocalStrategy
    let checkValueStub: SinonStub
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
        userRepository = {
            create: sandbox.stub().resolves(mockUser),
            findOne: sandbox.stub().resolves(mockUser)
        } as any
        checkValueStub = sandbox.stub(crypt, 'checkValue').resolves(true)
        authStrategyInstance = new CustomLocalStrategy(options, userRepository as unknown as UserRepository, oauth2)
    })
    afterEach(() => {
        sandbox.restore()
    })
    describe('checkExistingUserByProfile', () => {
        it('should find the user in the repository by username only', async () => {
            await authStrategyInstance.checkExistingUserByProfile(profile)
            expect(userRepository.findOne.calledOnceWith({ name: profile.username })).to.be.true
        })
        it('should compare the given password against the stored hash', async () => {
            await authStrategyInstance.checkExistingUserByProfile(profile)
            expect(checkValueStub.calledOnceWith(profile.password, mockUser.password)).to.be.true
        })
        it('should return the user when the password matches', async () => {
            const result = await authStrategyInstance.checkExistingUserByProfile(profile)
            expect(result).to.deep.equal(mockUser)
        })
        it('should return undefined when the password does not match', async () => {
            checkValueStub.resolves(false)
            const result = await authStrategyInstance.checkExistingUserByProfile(profile)
            expect(result).to.be.undefined
        })
        it('should return undefined when no user is found, without calling crypt.checkValue', async () => {
            userRepository.findOne.resolves(null)
            const result = await authStrategyInstance.checkExistingUserByProfile(profile)
            expect(result).to.be.undefined
            expect(checkValueStub.called).to.be.false
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
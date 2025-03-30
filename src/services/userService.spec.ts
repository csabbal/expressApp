import { expect } from 'chai'
import sinon, { SinonSandbox, SinonSpy, SinonStub } from 'sinon'
import { loggerInstance } from "../utils/logger/logger"
import { UserService } from './userService'
import { UserRepository } from '../repositories/User.repository'

let sandbox: SinonSandbox

describe('UserService', () => {
    let loggerSpy: SinonSpy
    let userServiceInstance: UserService
    let userRepository: {find:SinonStub}
    beforeEach(() => {
        sandbox = sinon.createSandbox()
        loggerSpy = sandbox.spy(loggerInstance.logger, 'info')
        userRepository = { find: sandbox.stub().resolves() } as any
    })
    afterEach(() => {
        sandbox.restore()
    })

    describe('getInstance', () => {
        it('should return with instance', () => {
            const instance = UserService.getInstance()
            expect(instance).deep.equal((UserService as any)._instance)
        })
    })

    describe('getAllUsers', () => {
        beforeEach(() => {
            userServiceInstance = new UserService(userRepository as unknown as UserRepository)
        })
        it('should call the logger method', async () => {
            await userServiceInstance.getAllUsers()
            expect(loggerSpy.calledOnce).to.be.true
        })

        describe('userRepository find', () => {
            it('should be called in order to list all users', async () => {
                await userServiceInstance.getAllUsers()
                expect(userRepository.find.calledOnce).to.be.true
            })
        })
       
    })
})
import { expect } from 'chai'
import sinon, { SinonSandbox, SinonSpy, SinonStub } from 'sinon'
import { loggerInstance } from "../utils/logger/logger"
import { AuthService } from './authService'
import { UserPermissionsRepository } from '../repositories/UserPermissions.repository'

let sandbox: SinonSandbox

describe('AuthService', () => {
    const mockUser = {
        id: '1',
        name: 'John Doe',
        fullName: 'John Doe',
        email: 'trestemail',
        password: 'testpassword',
        jwtSecureCode: 'test'
    }
    const userPermissions = { userId: 1, permissions: ['read'] }
    let generateJWT: SinonStub
    let loggerSpy: SinonSpy
    let authServiceInstance: AuthService
    let userPermissionRepository: { findOne: SinonStub }
    beforeEach(() => {
        sandbox = sinon.createSandbox()
        loggerSpy = sandbox.spy(loggerInstance.logger, 'info')
        generateJWT = sandbox.stub().resolves('token')
        userPermissionRepository = { findOne: sandbox.stub().resolves(userPermissions) } as any
    })
    afterEach(() => {
        sandbox.restore()
    })

    describe('getInstance', () => {
        it('should return with instance', () => {
            const instance = AuthService.getInstance()
            expect(instance).deep.equal((AuthService as any)._instance)
        })
    })

    describe('callback', () => {
        beforeEach(() => {
            authServiceInstance = new AuthService(
                userPermissionRepository as unknown as UserPermissionsRepository,
                generateJWT)
        })
        it('should call the logger method', async () => {
            await authServiceInstance.callback(mockUser)
            expect(loggerSpy.calledOnce).to.be.true
        })

        it('should call generateJwt with empty array if the searching doesnt return with results', async () => {
            userPermissionRepository = { findOne: sandbox.stub().resolves(null) } as any
            authServiceInstance = new AuthService(
                userPermissionRepository as unknown as UserPermissionsRepository,
                generateJWT)
            await authServiceInstance.callback(mockUser)
            expect(generateJWT.args[0][1]).deep.equals([])
        })

        describe('userPermsissionRepository find', () => {
            it('should be called in order to find the proper user, based on its id', async () => {
                await authServiceInstance.callback(mockUser)
                const expectedArgument = { userId: mockUser.id }
                expect(userPermissionRepository.findOne.args[0][0]).deep.equals(expectedArgument)
            })
        })

        describe('generateJWT', () => {
            beforeEach(async () => {
                await authServiceInstance.callback(mockUser)
            })
            it('should be called by authserviceInstance', async () => {
                expect(generateJWT.calledOnce).to.be.true
            })
            it('should be called with the given user as a parameter', async () => {
                expect(generateJWT.args[0][0]).deep.equals(mockUser)
            })
            it('should be called with permission of the return value of the searching if its exsisting', async () => {
                expect(generateJWT.args[0][1]).deep.equals(userPermissions.permissions)
            })
        })
    })
})
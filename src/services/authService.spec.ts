import chai from 'chai'
import sinon, { SinonSandbox, SinonSpy, SinonStub } from 'sinon'
import { loggerInstance } from "../utils/logger/logger";
import { AuthService } from './authService'
import { UserPermissionsRepository } from '../repositories/UserPermissions.repository';

const expect = chai.expect
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
    let userPermissions = { userId: 1, permissions: ['read'] }
    let generateJWT: SinonStub
    let loggerSpy: SinonSpy
    let authServiceInstance: AuthService
    let userPermissionRepository: UserPermissionsRepository
    beforeEach(() => {
        sandbox = sinon.createSandbox()
        loggerSpy = sandbox.spy(loggerInstance.logger, 'info')
        generateJWT = sandbox.stub().resolves('token')
        userPermissionRepository = { findOne: sandbox.stub().resolves(userPermissions) } as any
    })
    afterEach(() => {
        sandbox.restore()
    })

    describe('callback', () => {
        beforeEach(() => {
            authServiceInstance = new AuthService(userPermissionRepository, generateJWT, 'jwtSecret')
        })
        it('should call the logger method', async () => {
            await authServiceInstance.callback(mockUser)
            expect(loggerSpy.calledOnce).to.be.true
        })
        it('should call the generateJWT method', async () => {
            await authServiceInstance.callback(mockUser)
            expect(generateJWT.calledOnce).to.be.true
        })
    })
})
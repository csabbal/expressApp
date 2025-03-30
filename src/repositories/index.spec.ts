import { expect } from 'chai'
import sinon, { SinonSandbox, SinonSpy, SinonStub} from 'sinon'
import {RepositoryFactory} from './index'
import { UserRepository } from './User.repository'
import { PermissionRepository } from './Permission.repository'
import { UserPermissionsRepository } from './UserPermissions.repository'


describe('RepositoryFactory', () => {
    let sandbox: SinonSandbox
    let factory: RepositoryFactory

    beforeEach(() => {
        sandbox = sinon.createSandbox()
        factory = new RepositoryFactory('mongo')
    })
    afterEach(() => {
        sandbox.restore()
    })

    describe('create', () => {
        it('should instantiate the Repositories based on the given type', () => {
            factory.create()
            expect(factory.repositories.User).to.be.instanceOf(UserRepository)
            expect(factory.repositories.Permission).to.be.instanceOf(PermissionRepository)
            expect(factory.repositories.UserPermissions).to.be.instanceOf(UserPermissionsRepository)
        })
    })

})

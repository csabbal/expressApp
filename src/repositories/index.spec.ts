import { expect } from 'chai'
import sinon, { SinonSandbox } from 'sinon'
import { RepositoryFactory } from './index'
import { PermissionRepository } from './Permission.repository'
import { UserRepository } from './User.repository'
import { UserPermissionsRepository } from './UserPermissions.repository'


describe('RepositoryFactory', () => {
    let sandbox: SinonSandbox
    let factory: RepositoryFactory

    beforeEach(() => {
        sandbox = sinon.createSandbox()
        factory = new RepositoryFactory()
    })
    afterEach(() => {
        sandbox.restore()
    })

    describe('create', () => {
        it('should instantiate the Repositories', () => {
            factory.create()
            expect(factory.repositories.User).to.be.instanceOf(UserRepository)
            expect(factory.repositories.Permission).to.be.instanceOf(PermissionRepository)
            expect(factory.repositories.UserPermissions).to.be.instanceOf(UserPermissionsRepository)
        })

        it('should throw if AUTH_DB_TYPE is not mongo, before touching any repository', () => {
            const original = process.env.AUTH_DB_TYPE
            process.env.AUTH_DB_TYPE = 'other'
            try {
                expect(() => factory.create()).to.throw('auth database type is unknown')
                expect(factory.repositories.User).to.be.undefined
            } finally {
                process.env.AUTH_DB_TYPE = original
            }
        })

        it('should throw if MOVIE_DB_TYPE is not mongo, without affecting already-built repositories', () => {
            const original = process.env.MOVIE_DB_TYPE
            process.env.MOVIE_DB_TYPE = 'other'
            try {
                expect(() => factory.create()).to.throw('movie database type is unknown')
                expect(factory.repositories.User).to.be.instanceOf(UserRepository)
                expect(factory.repositories.Movie).to.be.undefined
            } finally {
                process.env.MOVIE_DB_TYPE = original
            }
        })
    })

})

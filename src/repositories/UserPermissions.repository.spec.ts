import { expect } from 'chai'
import sinon, { SinonSandbox } from 'sinon'
import { UserPermissionsRepository } from './UserPermissions.repository'

describe('UserPermissionRepository', () => {
    let sandbox: SinonSandbox
    let repository: UserPermissionsRepository
    let model: {
        find: sinon.SinonStub,
        findOne: sinon.SinonStub
        create: sinon.SinonStub
    }
    beforeEach(() => {
        sandbox = sinon.createSandbox()
        model = {
            find: sandbox.stub(),
            findOne: sandbox.stub(),
            create: sandbox.stub()
        }
        repository = new UserPermissionsRepository(model as any)
    })
    afterEach(() => {
        sandbox.restore()
    })

    describe('find', () => {
        it('should call find method on given model', async () => {
            await repository.find()
            expect(model.find.calledOnce).to.be.true
        })
    })

    describe('findOne', () => {
        it('should call findOne method on given model', async () => {
            await repository.findOne({id: '1'})
            expect(model.findOne.calledOnce).to.be.true
        })
        it('should call findOne method on given model with given parameters', async () => {
            const params = {id: '1'}
            await repository.findOne(params)
            expect(model.findOne.args[0][0]).deep.equal(params)
        })
    })

    describe('create', () => {
        const mockUserPermissions = {id: '1', userId: '2', permissions:[]}
        it('should call create method on given model', async() => {
            await repository.create(mockUserPermissions)
            expect(model.create.calledOnce).to.be.true
        })
        it('should call create method on given model with given parameters', async () => {
            await repository.create(mockUserPermissions)
            expect(model.create.args[0][0]).deep.equal(mockUserPermissions)
        })
    })


})

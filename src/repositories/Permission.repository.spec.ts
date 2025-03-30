import { expect } from 'chai'
import sinon, { SinonSandbox } from 'sinon'
import { PermissionRepository } from './Permission.repository'

describe('PermissionRepository', () => {
    let sandbox: SinonSandbox
    let repository: PermissionRepository
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
        repository = new PermissionRepository(model as any)
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
        it('should call create method on given model', async() => {
            await repository.create({id: '1', component: 'test', privilege:'read'})
            expect(model.create.calledOnce).to.be.true
        })
        it('should call create method on given model with given parameters', async () => {
            const params = {id: '1', component: 'test', privilege:'read'}
            await repository.create(params)
            expect(model.create.args[0][0]).deep.equal(params)
        })
    })


})

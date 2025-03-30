import { expect } from 'chai'
import sinon, { SinonSandbox } from 'sinon'
import { UserRepository } from './User.repository'

describe('UserRepository', () => {
    let sandbox: SinonSandbox
    let repository: UserRepository
    let model: {
        find: sinon.SinonStub<any,{select: sinon.SinonStub}>,
        findOne: sinon.SinonStub
        create: sinon.SinonStub
    }
    beforeEach(() => {
        sandbox = sinon.createSandbox()
        model = {
            find: sandbox.stub().returns({ select: sandbox.stub()}),
            findOne: sandbox.stub(),
            create: sandbox.stub()
        }
        repository = new UserRepository(model as any)
    })
    afterEach(() => {
        sandbox.restore()
    })

    describe('find', () => {
        it('should call find method on given model', async () => {
            await repository.find()
            expect(model.find.calledOnce).to.be.true
        })

        it('should call select method on return value of the find method', async () => {
            await repository.find()
            expect(model.find().select.calledOnce).to.be.true
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
        const mockUser = {
            id: '1',
            name: 'test',
            fullName: 'given family',
            email: 'test@gmail.com',
            password: 'testpassword',
            jwtSecureCode: 'test'
        }
        it('should call create method on given model', async() => {
            await repository.create(mockUser)
            expect(model.create.calledOnce).to.be.true
        })
        it('should call create method on given model with given parameters', async () => {
            await repository.create(mockUser)
            expect(model.create.args[0][0]).deep.equal(mockUser)
        })
    })


})

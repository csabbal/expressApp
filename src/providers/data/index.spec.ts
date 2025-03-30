import { expect } from 'chai'
import sinon, { SinonSandbox, SinonSpy, SinonStub} from 'sinon'
import { DataSourceFactory, initDataSource } from './index'
import MongoDataSource from './MongoDataSource'
import mongoose from 'mongoose'
import { DatabaseProperties } from '../../types/Database'

describe('DataSourceFactory', () => {
    let sandbox: SinonSandbox
    let factory: DataSourceFactory

    let databaseProperties: DatabaseProperties
    beforeEach(() => {
        databaseProperties = {
            type: 'mongo',
            host: 'host',
            port: 'port',
            user: 'user',
            password: 'password',
            database: 'database'
        }
        sandbox = sinon.createSandbox()
        factory = new DataSourceFactory(databaseProperties, mongoose)
    })
    afterEach(() => {
        sandbox.restore()
    })

    describe('create', () => {
        it('should instantiate a MongoDataSource instance with usage of attributes if the data.type is mongo', () => {
            const instance = factory.create()
            expect(instance).to.be.instanceOf(MongoDataSource)
            expect((instance as any).data).to.deep.equal(databaseProperties)
            expect((instance as any).ODM).to.equal(mongoose)
        })
        it('should throw error if the data.type is not known', () => {
            databaseProperties.type = 'other'
            factory = new DataSourceFactory(databaseProperties, mongoose)
            expect(() => factory.create()).to.throw('database type is unknown')
        })
    })
    describe('initDataSource', () => {
        let factoryCreateStub: SinonStub
        let buildDataSourceStub: SinonStub
        beforeEach(() => {
            buildDataSourceStub = sandbox.stub()
            factoryCreateStub = sandbox.stub(DataSourceFactory.prototype, 'create').callsFake(() => {
                const mockInstance = sandbox.createStubInstance(MongoDataSource)
                mockInstance.buildDataSource = buildDataSourceStub as any
                return mockInstance
            })
        })
        it('should instantiate a DataSourceFactory instance and call the create on that', async () => {
            await initDataSource(databaseProperties)
            expect(factoryCreateStub.calledOnce).to.be.true
        })
        it('should call buildDataSource on the given dataSource ', async () => {
            await initDataSource(databaseProperties)
            expect(buildDataSourceStub.calledOnce).to.be.true
        })
    })
})

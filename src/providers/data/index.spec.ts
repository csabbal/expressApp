import { expect } from 'chai'
import mongoose from 'mongoose'
import sinon, { SinonSandbox } from 'sinon'
import { DatabaseProperties } from '../../types/Database'
import { DataSourceFactory, dataSources, getConnection, initDataSource } from './index'
import MongoDataSource from './MongoDataSource'

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
})

describe('data source registry', () => {
    let sandbox: SinonSandbox
    beforeEach(() => {
        sandbox = sinon.createSandbox()
    })
    afterEach(() => {
        sandbox.restore()
    })

    describe('initDataSource', () => {
        it('should call buildDataSource on the registered DataSource for the given name', async () => {
            const buildDataSourceStub = sandbox.stub(dataSources.primary, 'buildDataSource').resolves()
            await initDataSource('primary')
            expect(buildDataSourceStub.calledOnce).to.be.true
        })
        it('should treat every registered data source the same way', async () => {
            const buildDataSourceStub = sandbox.stub(dataSources.learning, 'buildDataSource').resolves()
            await initDataSource('learning')
            expect(buildDataSourceStub.calledOnce).to.be.true
        })
        it('should throw for an unregistered data source name', async () => {
            try {
                await initDataSource('unknown')
                expect.fail('should have thrown')
            } catch (e) {
                expect(e.message).to.equal('unknown data source: unknown')
            }
        })
    })

    describe('getConnection', () => {
        it('should return the connection from the registered DataSource for the given name', () => {
            const fakeConnection = {} as any
            sandbox.stub(dataSources.learning, 'getOrCreateConnection').returns(fakeConnection)
            expect(getConnection('learning')).to.equal(fakeConnection)
        })
    })
})

import { expect } from 'chai'
import sinon, { SinonSandbox } from 'sinon'
import { DataSource } from './DataSource'
import mongoose from 'mongoose'

class TestDataSource extends DataSource {
    constructor(data: any, ODM: any) {
        super(data, ODM)
    }
}

describe('DataSource', () => {
    let sandbox: SinonSandbox
    let datasource: TestDataSource
    const databaseProperties = {
        type: 'mongo',
        host: 'host',
        port: 'port',
        user: 'user',
        password: 'password',
        database: 'database'
    }
    beforeEach(() => {
        sandbox = sinon.createSandbox()
        datasource = new TestDataSource(databaseProperties, mongoose)
    })
    afterEach(() => {
        sandbox.restore()
    })

    describe('setConnectionString', () => {
        it('should assemble the connectionstring from data field', () => {
            datasource.setConnectionString()
            const { host, port, user, password } = databaseProperties
            expect((datasource as any).connectionString).to.contain(host)
            expect((datasource as any).connectionString).to.contain(port)
            expect((datasource as any).connectionString).to.contain(user)
            expect((datasource as any).connectionString).to.contain(password)
        })
    })

    describe('buildDataSource', () => {
        it('should call setConnectionString,setLogging and connect to database', async () => {
            const setConnectionStringStub = sandbox.stub(datasource, 'setConnectionString')
            const setLoggingStub = sandbox.stub(datasource, 'setLogging')
            const connectToDatabaseStub = sandbox.stub(datasource, 'connectoToDatabase').resolves()
            await datasource.buildDataSource()

            expect(setConnectionStringStub.calledOnce).to.be.true
            expect(setLoggingStub.calledOnce).to.be.true
            expect(connectToDatabaseStub.calledOnce).to.be.true
        })
    })

})

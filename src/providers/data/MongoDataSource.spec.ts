import { expect } from 'chai'
import mongoose from 'mongoose'
import sinon, { SinonSandbox, SinonSpy } from 'sinon'
import { logger } from '../../utils/logger/logger'
import MongoDataSource from './MongoDataSource'

describe('MongoDataSource', () => {
    let sandbox: SinonSandbox
    let datasource: MongoDataSource

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
        datasource = new MongoDataSource(databaseProperties, mongoose)
    })
    afterEach(() => {
        sandbox.restore()
    })

    describe('setConnectionString', () => {
        it('should assemble the connectionstring from data field', () => {
            datasource.setConnectionString()
            const { host, port, user, password, database } = databaseProperties
            expect((datasource as any).connectionString).to.equal(
                `mongodb://${user}:${password}@${host}:${port}/${database}?authSource=admin`
            )
        })
    })

    describe('getOrCreateConnection', () => {
        it('should create a connection without opening it, and memoize it', () => {
            const createConnectionStub = sandbox.stub((datasource as any).ODM, 'createConnection')
                .returns({} as any)
            const connection = datasource.getOrCreateConnection()
            expect(createConnectionStub.calledOnce).to.be.true
            expect(createConnectionStub.calledWith()).to.be.true
            expect(datasource.getOrCreateConnection()).to.equal(connection)
            expect(createConnectionStub.calledOnce).to.be.true
        })
    })

    describe('connectToDatabase', () => {
        it('should open the connection with the connectionstring taken as parameter', async () => {
            const openUriStub = sandbox.stub().resolves()
            sandbox.stub((datasource as any).ODM, 'createConnection').returns({ openUri: openUriStub } as any)
            datasource.setConnectionString()
            await datasource.connectoToDatabase()
            expect(openUriStub.calledWith(
                (datasource as any).connectionString,
                { monitorCommands: true, serverMonitoringMode: 'auto' })
            ).to.be.true
        })
    })

    describe('setLogging', () => {
        it('should subscribe to commandStarted commandFailed and commandSucceeded', async () => {
            const connection = datasource.getOrCreateConnection()
            const commandStartedStub = sandbox.spy(connection, 'on')

            datasource.setLogging()

            expect(commandStartedStub.calledWith('commandStarted')).to.be.true
            expect(commandStartedStub.calledWith('commandSucceeded')).to.be.true
            expect(commandStartedStub.calledWith('commandFailed')).to.be.true
        })
        describe('logging', () => {
            const expectedCommand = JSON.stringify('test')
            let connection: any
            let logInfoStub: SinonSpy
            beforeEach(()=>{
                connection = datasource.getOrCreateConnection()
                logInfoStub = sandbox.spy(logger, 'info')
                datasource.setLogging()
            })
            it('should be called in order to make log notes via logger if commandStarted happens', async () => {
                connection.emit('commandStarted', { command: expectedCommand })
                connection.on('commandStarted', (_data: any) => {
                    expect(logInfoStub.args[0][0]).deep.equal(`[db][commandStarted]${expectedCommand}`)
                })
            })
            it('should be called in order to make log notes via logger if commandFailed happens', async () => {
                connection.emit('commandFailed', { command: expectedCommand })
                connection.on('commandFailed', (_data: any) => {
                    expect(logInfoStub.args[0][0]).deep.equal(`[db][commandFailed]${expectedCommand}`)
                })
            })
            it('should be called in order to make log notes via logger if commandSucceeded happens', async () => {
                connection.emit('commandSucceeded', { command: expectedCommand })
                connection.on('commandSucceeded', (_data: any) => {
                    expect(logInfoStub.args[0][0]).deep.equal(`[db][commandSucceeded]${expectedCommand}`)
                })
            })
        })

    })

})

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
            const { host, port, user, password } = databaseProperties
            expect((datasource as any).connectionString).to.equal(`mongodb://${user}:${password}@${host}:${port}`)
        })
    })

    describe('connectToDatabase', () => {
        it('should call connect on the odm with connectionstring taken as parameter', async () => {
            const connectStub = sandbox.stub((datasource as any).ODM, 'connect').resolves()
            datasource.setConnectionString()
            await datasource.connectoToDatabase()
            expect(connectStub.calledWith(
                (datasource as any).connectionString,
                { monitorCommands: true, serverMonitoringMode: 'auto' })
            ).to.be.true
        })
    })

    describe('setLogging', () => {
        it('should subscribe to commandStarted commandFailed and commandSucceeded', async () => {
            const ODM = (datasource as any).ODM
            const commandStartedStub = sandbox.spy(ODM.connection, 'on')

            datasource.setLogging()

            expect(commandStartedStub.calledWith('commandStarted')).to.be.true
            expect(commandStartedStub.calledWith('commandSucceeded')).to.be.true
            expect(commandStartedStub.calledWith('commandFailed')).to.be.true
        })
        describe('logging', () => {
            const expectedCommand = JSON.stringify('test')
            let ODM: any
            let logInfoStub: SinonSpy
            beforeEach(()=>{
                ODM = (datasource as any).ODM
                logInfoStub = sandbox.spy(logger, 'info')
                datasource.setLogging()
            })
            it('should be called in order to make log notes via logger if commandStarted happens', async () => {
                ODM.connection.emit('commandStarted', { command: expectedCommand })
                ODM.connection.on('commandStarted', (_data: any) => {
                    expect(logInfoStub.args[0][0]).deep.equal(`[db][commandStarted]${expectedCommand}`)
                })
            })
            it('should be called in order to make log notes via logger if commandFailed happens', async () => {
                ODM.connection.emit('commandFailed', { command: expectedCommand })
                ODM.connection.on('commandFailed', (_data: any) => {
                    expect(logInfoStub.args[0][0]).deep.equal(`[db][commandFailed]${expectedCommand}`)
                })
            })
            it('should be called in order to make log notes via logger if commandSucceeded happens', async () => {
                ODM.connection.emit('commandSucceeded', { command: expectedCommand })
                ODM.connection.on('commandSucceeded', (_data: any) => {
                    expect(logInfoStub.args[0][0]).deep.equal(`[db][commandSucceeded]${expectedCommand}`)
                })
            })
        })

    })

})

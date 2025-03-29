import { expect } from 'chai'
import sinon, { SinonSandbox, SinonSpy, SinonStub } from 'sinon'
import { loggerInstance } from '../../utils/logger/logger'
import { CustomGoogleStrategy } from './googleStrategy'
import { UserRepository } from '../../repositories/User.repository'

let sandbox: SinonSandbox

describe('GoogleStrategy', () => {
    let loggerSpy: SinonSpy
    let authStrategyInstance: CustomGoogleStrategy
    const options = {
        clientID: 'clientId',
        clientSecret: 'secretId',
        callbackURL: `callback`,
        proxy: true
    }

    let oauth2: {
        Strategy: SinonStub
    }
    beforeEach(() => {
        sandbox = sinon.createSandbox()
        oauth2 = { Strategy: sandbox.stub() }
        loggerSpy = sandbox.spy(loggerInstance.logger, 'info')
        authStrategyInstance = new CustomGoogleStrategy(options, {} as unknown as UserRepository, oauth2)
    })
    afterEach(() => {
        sandbox.restore()
    })

    describe('getStrategy', () => {
        let strategyInstance: any
        beforeEach(() => {
            strategyInstance = authStrategyInstance.getStrategy()
        })

        it('should return with a strategy instance ', async () => {
            expect(strategyInstance instanceof oauth2.Strategy).to.be.true
        })
        it('should instantiate a new Strategy instance ', async () => {
            expect(oauth2.Strategy.calledOnce).to.be.true
        })

        it('should instantiate a new Strategy instance with given options', async () => {
            expect(oauth2.Strategy.args[0][0]).deep.equal(options)
        })

        it('should instantiate a new Strategy instance with getAuthCallBack method as second attribute', async () => {
            const callback = oauth2.Strategy.args[0][1]
            expect(typeof callback).to.equal('function')
            expect(authStrategyInstance.getAuthCallBack().toString()).equal(callback.toString())
        })
    })
})
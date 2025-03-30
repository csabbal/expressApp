import { expect } from 'chai'
import sinon, { SinonSandbox, SinonStub } from 'sinon'
import { addPassportToAppFunction, initPassport } from './passport'

let sandbox: SinonSandbox

describe('passport', () => {
    let app: { use: SinonStub } | any
    let passport: {
        use: SinonStub,
        serializeUser: SinonStub,
        deserializeUser: SinonStub,
        authenticate: SinonStub
    } | any

    beforeEach(() => {
        sandbox = sinon.createSandbox()
        app = {
            use: sandbox.stub(),
        } as any
        passport = {
            use: sandbox.stub(),
            serializeUser: sandbox.stub(),
            deserializeUser: sandbox.stub(),
            authenticate: sandbox.stub()
        } as any

    })
    afterEach(() => {
        sandbox.restore()
    })

    describe('return function of the addPassport', () => {
        it('should call the use method of app taken as parameter twice', () => {
            addPassportToAppFunction(app)
            expect(app.use.calledTwice).to.be.true
        })
    })
    describe('initPassport', () => {
        it('should call the use method of app taken as parameter three times', () => {
            initPassport(passport)
            expect(passport.use.callCount).equal(3)
        })
        it('should set a function for serializeUser', () => {
            initPassport(passport)
            expect(passport.serializeUser.callCount).equal(1)
        })
        it('should set a function for deserializeUser', () => {
            initPassport(passport)
            expect(passport.deserializeUser.callCount).equal(1)
        })
        it('should set google authentication', () => {
            initPassport(passport)
            expect(passport.authenticate.args[0][0]).equal('google')
        })
        it('should set local authentication', () => {
            initPassport(passport)
            expect(passport.authenticate.args[1][0]).equal('local')
        })
        it('should set jwt authentication', () => {
            initPassport(passport)
            expect(passport.authenticate.args[2][0]).equal('jwt')
        })
    })
})
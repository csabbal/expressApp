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
    let originalOidcIssuer: string | undefined
    let originalOidcAudience: string | undefined

    beforeEach(() => {
        sandbox = sinon.createSandbox()
        originalOidcIssuer = process.env.OIDC_ISSUER
        originalOidcAudience = process.env.OIDC_AUDIENCE
        delete process.env.OIDC_ISSUER
        delete process.env.OIDC_AUDIENCE
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
        if (originalOidcIssuer === undefined) delete process.env.OIDC_ISSUER
        else process.env.OIDC_ISSUER = originalOidcIssuer
        if (originalOidcAudience === undefined) delete process.env.OIDC_AUDIENCE
        else process.env.OIDC_AUDIENCE = originalOidcAudience
    })

    describe('return function of the addPassport', () => {
        it('should call the use method of app taken as parameter twice', () => {
            addPassportToAppFunction(app)
            expect(app.use.calledTwice).to.be.true
        })
    })
    describe('initPassport', () => {
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
        describe('when OIDC_ISSUER is not set', () => {
            it('should call the use method of app taken as parameter three times', () => {
                initPassport(passport)
                expect(passport.use.callCount).equal(3)
            })
            it('should set jwt authentication only', () => {
                initPassport(passport)
                expect(passport.authenticate.args[2][0]).equal('jwt')
            })
        })
        describe('when OIDC_ISSUER is set', () => {
            beforeEach(() => {
                process.env.OIDC_ISSUER = 'http://localhost:3200/oidc'
                process.env.OIDC_AUDIENCE = 'urn:oauth-provider:services'
            })
            it('should call the use method of app taken as parameter four times', () => {
                initPassport(passport)
                expect(passport.use.callCount).equal(4)
            })
            it('should register the jwt-oidc strategy', () => {
                initPassport(passport)
                expect(passport.use.args[3][0]).equal('jwt-oidc')
            })
            it('should set jwt authentication to accept both strategies', () => {
                initPassport(passport)
                expect(passport.authenticate.args[2][0]).deep.equal(['jwt', 'jwt-oidc'])
            })
        })
        describe('when OIDC_ISSUER is set without OIDC_AUDIENCE', () => {
            beforeEach(() => {
                process.env.OIDC_ISSUER = 'http://localhost:3200/oidc'
            })
            it('should throw an error requiring OIDC_AUDIENCE', () => {
                expect(() => initPassport(passport))
                    .to.throw('OIDC_AUDIENCE must be set when OIDC_ISSUER is configured')
            })
        })
    })
})

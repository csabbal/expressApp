import { expect } from 'chai'
import { UserModel } from './User.schema'

describe('UserSchema', () => {
    const baseUser = {
        id: '1',
        name: 'jdoe',
        email: 'jdoe@example.com',
        jwtSecureCode: 'secure-code'
    }

    it('should validate a user without a googleId', () => {
        const user = new UserModel(baseUser)
        const validationError = user.validateSync()
        expect(validationError).to.be.undefined
    })

    it('should still require id, name, email and jwtSecureCode', () => {
        const user = new UserModel({})
        const validationError = user.validateSync()
        expect(validationError.errors.id).to.exist
        expect(validationError.errors.name).to.exist
        expect(validationError.errors.email).to.exist
        expect(validationError.errors.jwtSecureCode).to.exist
        expect(validationError.errors.googleId).to.not.exist
    })
})

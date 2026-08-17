import { v4 as uuidv4 } from 'uuid'
import crypt from '../utils/Crypt'
import { UserEntity } from '../types/User'
import { SignupRequestBody } from '../types/Signup'
import { loggedMethod } from '../utils/logger/logger'
import { userRepository } from '../repositories'
import { IUserRepository } from '../types/repositories'
import { BadRequestError, ConflictError } from '../utils/error/Error'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD_LENGTH = 8

export type CreatedUser = Pick<UserEntity, 'id' | 'name' | 'email'>

/**
 * This class take care about registering new local users: validating input,
 * enforcing uniqueness and persisting the new user via userRepository
 */
export class SignupService {
    protected static _instance: SignupService
    constructor(protected userRepository: IUserRepository) { }

    /**
     * getInstance function provides that this class work as a singleton
     * @returns
     */
    static getInstance() {
        if (!this._instance) {
            this._instance = new SignupService(userRepository)
        }
        return this._instance
    }

    /**
     * signup method validates the given data, ensures the username/email are not
     * already taken, then delegates to createUser with the hashed password
     * @param {SignupRequestBody} data
     * @returns {Promise<CreatedUser>}
     */
    public async signup(data: SignupRequestBody): Promise<CreatedUser> {
        this.validate(data)
        await this.assertNotTaken(data.username, data.email)
        const hashedPassword = await crypt.hashValue(data.password)
        return this.createUser(data.username, data.email, hashedPassword)
    }

    /**
     * createUser method persists the new user with an already-hashed password
     * and returns the created user without secrets
     * @param {string} username
     * @param {string} email
     * @param {string} hashedPassword
     * @returns {Promise<CreatedUser>}
     */
    @loggedMethod('[SignupService]')
    private async createUser(username: string, email: string, hashedPassword: string): Promise<CreatedUser> {
        const newUser = {
            id: uuidv4(),
            name: username,
            email: email,
            password: hashedPassword,
            fullName: username,
            jwtSecureCode: uuidv4()
        } as UserEntity

        const createdUser = await this.userRepository.create(newUser)
        return { id: createdUser.id, name: createdUser.name, email: createdUser.email }
    }

    private validate(data: SignupRequestBody) {
        if (typeof data.username !== 'string' || typeof data.email !== 'string' || typeof data.password !== 'string') {
            throw new BadRequestError('username, email and password must be strings')
        }
        if (!data.username) throw new BadRequestError('username is required')
        if (!data.email) throw new BadRequestError('email is required')
        if (!data.password) throw new BadRequestError('password is required')
        if (!EMAIL_REGEX.test(data.email)) throw new BadRequestError('email is not a valid email address')
        if (data.password.length < MIN_PASSWORD_LENGTH) {
            throw new BadRequestError(`password must be at least ${MIN_PASSWORD_LENGTH} characters`)
        }
    }

    private async assertNotTaken(username: string, email: string) {
        const existingByName = await this.userRepository.findOne({ name: username })
        if (existingByName) throw new ConflictError('username already taken')

        const existingByEmail = await this.userRepository.findOne({ email })
        if (existingByEmail) throw new ConflictError('email already registered')
    }
}

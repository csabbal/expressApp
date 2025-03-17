import {Request, NextFunction} from 'express'
import { UserEntity } from './User'

export interface AppRequest extends Request{
    user: UserEntity
}

export interface AppNextFunction extends NextFunction{
    user: UserEntity
}

export { Request }

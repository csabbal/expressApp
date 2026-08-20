import express, { Request, Response, NextFunction } from 'express'
import { logger } from '../logger/logger'

/**
 * BadRequestError class will be instantiated if the error which occured is caused by the fault of the client
 */
export class BadRequestError extends Error {
    readonly publicMessage: string

    constructor(message: string, publicInformation?: string, stack?: string) {
        super(message)
        this.name = 'BadRequestError'
        this.publicMessage = publicInformation ?? message
        this.stack = stack
    }

    sendJSONResponse(res: express.Response) {
        res.status(400).json({
            success: false,
            status: 400,
            message: this.publicMessage,
            stack: process.env.NODE_ENV === 'development' ? this.stack : {}
        })
    }
}

/**
 * ConflictError class will be instantiated when the request conflicts with existing state (e.g. duplicate unique field)
 */
export class ConflictError extends Error {
    readonly publicMessage: string

    constructor(message: string, publicInformation?: string, stack?: string) {
        super(message)
        this.name = 'ConflictError'
        this.publicMessage = publicInformation ?? message
        this.stack = stack
    }

    sendJSONResponse(res: express.Response) {
        res.status(409).json({
            success: false,
            status: 409,
            message: this.publicMessage,
            stack: process.env.NODE_ENV === 'development' ? this.stack : {}
        })
    }
}

/**
 * NotFoundError class will be instantiated when the requested resource does not exist
 */
export class NotFoundError extends Error {
    readonly publicMessage: string

    constructor(message: string, publicInformation?: string, stack?: string) {
        super(message)
        this.name = 'NotFoundError'
        this.publicMessage = publicInformation ?? message
        this.stack = stack
    }

    sendJSONResponse(res: express.Response) {
        res.status(404).json({
            success: false,
            status: 404,
            message: this.publicMessage,
            stack: process.env.NODE_ENV === 'development' ? this.stack : {}
        })
    }
}

/**
 *  This class will be instantiated if the problem is regardless from the client
 */
export class ServerError extends Error {

    constructor(message: string, stack?: string) {
        super(message)
        this.name = 'ServerError'
        this.stack = stack
    }

    sendJSONResponse(res: express.Response | undefined, errStatus?: number) {
        const status = errStatus ?? 500
        res.status(status).json({
            success: false,
            status: status,
            message: this.message,
            stack: process.env.NODE_ENV === 'development' ? this.stack : {}
        })
    }
}

/**
 * This middleare take care about any error which occured in the system will be handled based on its type 
 * @param {Error} err an error which occured in the system 
 * @param {Request} req 
 * @param {Response} res 
 * @param {NextFunction} next 
 */
export async function errorHandlerMiddleware(err: any, req: Request, res: Response, _next: NextFunction) {
    const errStatus = err.statusCode || 500
    const errMsg = err.message || 'Something went wrong'
    const errStack = err.stack
    logger.error('[erorrHandlerMiddleware] ' + errMsg)
    if (err instanceof BadRequestError) {
        err.sendJSONResponse(res)
    } else if (err instanceof ConflictError) {
        err.sendJSONResponse(res)
    } else if (err instanceof NotFoundError) {
        err.sendJSONResponse(res)
    } else {
        const error = new ServerError(errMsg, errStack)
        error.sendJSONResponse(res, errStatus)
    }
}



import express, { } from 'express'
export class BadRequestError extends Error {
    readonly publicMessage: string

    constructor(message: string, publicInformation: string, stack?: string) {
        super(message)
        this.name = 'BadRequestError'
        this.publicMessage = publicInformation
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

export class ServerError extends Error {

    constructor(message: string, stack?: string) {
        super(message)
        this.name = 'BadRequestError'
        this.stack = stack
    }

    sendJSONResponse(res: express.Response, errStatus?:number) {
        const status = errStatus ?? 500
        res.status(status).json({
            success: false,
            status: status,
            message: this.message,
            stack: process.env.NODE_ENV === 'development' ? this.stack : {}
        })
    }
}

export async function errorHandlerMiddleware(err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
    const errStatus = err.statusCode || 500;
    const errMsg = err.message || 'Something went wrong';
    const errStack = err.stack

    if (err instanceof BadRequestError) {
        err.sendJSONResponse(res)
    }else{
        const error = new ServerError(errMsg, errStack)
        error.sendJSONResponse(res, errStatus)
    }
}



import { AsyncLocalStorage } from 'async_hooks'
import { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'

/**
 *  LocalStorageClass is neeeded to take adventage of the AsyncLocalStorage benefits.
 *  With this class the application are able to follow the request from the arrival to sent back to the client
 */
export default class LocalStorageClass {
    private static asyncLocalStorage = new AsyncLocalStorage()

    /**
     * The setRequestId function is about to set the current asynclocal to work with given requestId 
     * 
     * @param {String} requestId 
     * @param {NextFunction} next 
     */
    static async setRequestId(requestId: string, next: NextFunction) {
        if (LocalStorageClass.asyncLocalStorage) {
            await LocalStorageClass.asyncLocalStorage.run(requestId, async () => {
                next()
            })
            LocalStorageClass.asyncLocalStorage.exit(() => next)
        } else {
            next()
        }
    }

    /**
     * This static function can work as a middleware via it the class is able to store
     * the current requestId included by request 
     * or generate a new one
     * 
     * @param {Request} req 
     * @param {Response} res 
     * @param {NextFunction} next 
     */
    static async requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
        const givenRequestId = req.cookies?.['requestId']
        const requestId = givenRequestId ?? uuidv4().substring(0, 8)
        await LocalStorageClass.setRequestId(requestId, next)
    }

    /**
     * this getter is to return with current stored requestId
     * @returns requestId
     */
    static getRequestId() {
        return LocalStorageClass.asyncLocalStorage.getStore()
    }
}



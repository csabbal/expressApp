import { AsyncLocalStorage } from 'async_hooks'
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid'

export default class LocalStorageClass {
    private static asyncLocalStorage = new AsyncLocalStorage()
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

    static async requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
        const givenRequestId = req.cookies?.['requestId']
        const requestId =  givenRequestId ?? uuidv4().substring(0, 8)
        await LocalStorageClass.setRequestId(requestId, next)
    }

    static getRequestId(){
        return LocalStorageClass.asyncLocalStorage.getStore()
    }
}



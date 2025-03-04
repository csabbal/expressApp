import { createLogger, format, transports } from 'winston'
import { Request, Response, NextFunction } from 'express';
import DailyLogRotate from 'winston-daily-rotate-file'
import LocalStorageClass from '../asyncLocalStorage/asyncLocalStorage'



export class LoggerClass {
    static _instance: LoggerClass
    level = 'info'
    logger: any
    constructor() {
        this.init()
    }

    format = format.combine(
        format.colorize(),
        format.timestamp(),
        format.printf(({ timestamp, level, message }) => {
            const requestId = LocalStorageClass.getRequestId()
            return `${timestamp} ${level} (${requestId}): ${message}`
        })
    )

    static getInstance(): LoggerClass {
        if (!this._instance) {
            this._instance = new LoggerClass()
        }
        return this._instance
    }

    init() {
        this.logger = createLogger({
            level: this.level,
            format: this.format,
            transports: [
                new transports.Console(),
                new transports.File({ filename: './logs/info.log' }),
                this.getLogRotateTransport('info'),
            ]
        })
    }

    getLogRotateTransport(level: string) {
        return new DailyLogRotate({
            dirname: './logs',
            filename: `${level}%DATE%.log`,
            format: this.format,
            datePattern: 'YYYYMMDD',
            zippedArchive: true,
            maxFiles: '30d',
            maxSize: '200m',
            auditFile: `./logs/.audit.json`,
            createSymlink: true,
            symlinkName: `./logs/info.log`
        })
    }

    logMiddleware(req: Request, res: Response, next: NextFunction) {
        const start = Date.now();
        const { method, url } = req;
        this.logger.info(`--> ${method} ${url}`);
        res.on('finish', () => {
            const duration = Date.now() - start; 
            const { statusCode } = res; 
            this.logger.info(`<-- ${method} ${url} ${statusCode} - ${duration}ms`);
        });
        next()
    }

}
export const logger = LoggerClass.getInstance().logger
export const logMiddleware = LoggerClass.getInstance().logMiddleware



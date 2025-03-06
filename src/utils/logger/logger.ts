import { createLogger, format, transports, Logger } from 'winston'
import { stringify } from 'flatted'
import { Request, Response, NextFunction } from 'express';
import DailyLogRotate from 'winston-daily-rotate-file'
import LocalStorageClass from '../asyncLocalStorage/asyncLocalStorage'
import _ from 'lodash'
import { safeStringify } from '../helper';

export type LoggerType = Logger

export class LoggerClass {
    static _instance: LoggerClass
    level = 'info'
    logger: any
    constructor() {
        this.init()
    }

    printFunction = ({ timestamp, level, message }) => {
        const requestId = LocalStorageClass.getRequestId()
        return `${timestamp} ${level} (${requestId}): ${message}`
    }

    format = format.combine(
        format.colorize(),
        format.timestamp(),
        format.printf(this.printFunction.bind(this))
    )

    static getInstance(): LoggerClass {
        if (!this._instance) {
            this._instance = new LoggerClass()
        }
        return this._instance
    }

    public objectToString(obj: any): string {
        if (typeof obj === 'undefined') return 'undefined'
        let str = ''
        try {
            str = stringify(obj)
        } catch (e) {
            str = obj
        }

        return str
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

    loggedMethod(context: string, info?: string) {
        return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
            const targetMethod = descriptor.value
            descriptor.value = function (...args: any[]) {
                const withArgs = args?.length > 0 ? `is called with arguments ${safeStringify(args)}` : 'is called'
                logger.info(`${context} [${propertyKey}] ${withArgs}`)
                _.isUndefined(info) ?? logger.info(`${context} [${propertyKey}] ${info}`)
                return targetMethod.apply(this, args)
            }
            return descriptor
        };
    }
}


export const loggedMethod = LoggerClass.getInstance().loggedMethod
export const logger = LoggerClass.getInstance().logger
export const logMiddleware = LoggerClass.getInstance().logMiddleware
export const objectToString = LoggerClass.getInstance().objectToString



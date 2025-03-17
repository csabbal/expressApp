import { createLogger, format, transports, Logger } from 'winston'
import { stringify } from 'flatted'
import { Request, Response, NextFunction } from 'express';
import DailyLogRotate from 'winston-daily-rotate-file'
import LocalStorageClass from '../asyncLocalStorage/asyncLocalStorage'
import _ from 'lodash'
import { safeStringify } from '../StringManupilation';

export type LoggerType = Logger

export class LoggerClass {
    static _instance: LoggerClass
    level = 'debug'
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

    public static objectToString(obj: any): string {
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
                this.getDailyLogrotate('debug'),
                this.getDailyLogrotate('info'),
                this.getDailyLogrotate('error')
            ]
        })
    }

    getDailyLogrotate(level:string){
        return  new DailyLogRotate({
            filename: './logs/'+level+'-%DATE%.log',
            format: this.format,
            datePattern: 'YYYYMMDD',
            zippedArchive: true,
            maxFiles: '30d',
            maxSize: '200m',
            auditFile: `./logs/.audit.json`,
            level: level, 
        })
    }

    logMiddleware(req: Request, res: Response, next: NextFunction) {
        const start = Date.now();
        const { method, url, body } = req;
        this.logger.info(`--> ${method} url: ${url} `);
        if (method === 'POST') this.logger.info(`--> ${method} body:${LoggerClass.objectToString(body)}`);
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
                logger.debug(`${context} [${propertyKey}] ${withArgs}`)
                logger.info(`${context} [${propertyKey}]`)
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



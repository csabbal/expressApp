import { NextFunction, Request, Response } from 'express'
import { stringify } from 'flatted'
import _ from 'lodash'
import { createLogger, format, transports } from 'winston'
import DailyLogRotate from 'winston-daily-rotate-file'
import LocalStorageClass from '../asyncLocalStorage/asyncLocalStorage'
import { safeStringify } from '../StringManupilation'

export class LoggerClass {
    static _instance: LoggerClass
    logger: any
    constructor(protected level: string) {
        this.init()
    }

    /**
     * this function will be called when the logger a log note is about to be written to anywhere
     * @param {timeStamp:string,level:string,message:string} param0 
     * @returns {string} // the log notes
     */
    printFunction({ timestamp, level, message }) {
        const requestId = LocalStorageClass.getRequestId()
        return `${timestamp} ${level} (${requestId}): ${message}`
    }

    // here the class define the format what it will use during writing the log either to console or a file
    format = format.combine(
        format.colorize(),
        format.timestamp(),
        format.printf(this.printFunction.bind(this))
    )

    /**
     * this function is needed to the class can work as a singleton
     * @returns {LoggerClass}
     */
    static getInstance(level: string): LoggerClass {
        if (!this._instance) {
            this._instance = new LoggerClass(level)
        }
        return this._instance
    }

    /**
     * This function is to make a readable expression from object
     * (it is useful if you want to write something to the log)
     * @param obj 
     * @returns 
     */
    public static objectToString(obj: any): string {
        if (typeof obj === 'undefined') return 'undefined'
        let str = ''
        try {
            const text = stringify(obj)
            const length = text.length
            str = length > 200 ? text.substring(0, 300) + '...' : text
        } catch (e) {
            logger.error('Error in stringify the object: '+ e.message)
            str = obj
        }

        return str
    }

    /**
     * This function initializes the logger object what is about to use for logging based on the given level and format
     */
    init() {
        this.logger = createLogger({
            level: this.level,
            format: this.format,
            transports: [
                new transports.Console(),
                this.getDailyLogrotate(this.level),
                this.getDailyLogrotate('error')
            ]
        })
    }

    /**
     * It is a helper function to create dayly log rotate.
     * This function uses the format, th log level and determine some global logging parameters
     * @param level 
     * @returns 
     */
    getDailyLogrotate(level: string) {
        return new DailyLogRotate({
            filename: './logs/' + level + '-%DATE%.log',
            format: this.format,
            datePattern: 'YYYYMMDD',
            zippedArchive: true,
            maxFiles: '30d',
            maxSize: '200m',
            auditFile: `./logs/.audit.json`,
            level: level,
        })
    }

    /**
     * this middleware is about to create a kind of access log
     * @param {Request} req 
     * @param {Response} res 
     * @param {NextFunction} next 
     */
    logMiddleware(req: Request, res: Response, next: NextFunction) {
        const start = Date.now()
        const { method, url, body } = req
        this.logger.info(`--> ${method} url: ${url} `)
        if (method === 'POST') this.logger.info(`--> ${method} body:${LoggerClass.objectToString(body)}`)
        res.on('finish', () => {
            const duration = Date.now() - start
            const { statusCode } = res
            this.logger.info(`<-- ${method} ${url} ${statusCode} - ${duration}ms`)
        })
        next()
    }

    /**
     * This function returns with a decorator function in order for logging the circumstances of the decorated method
     * @param {String} context generally it contains the class (and functions name) 
     * @param {String} info is optional 
     * @returns {Function} the decorator function
     */
    loggedMethod(context: string, info?: string) {
        return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
            const targetMethod = descriptor.value
            descriptor.value = function (...args: any[]) {
                const withArgs = args?.length > 0 ? `is called with arguments ${safeStringify(args)}` : 'is called'
                logger.debug(`${context} [${propertyKey}] ${withArgs}`)
                logger.info(`${context} [${propertyKey}]`)
                if(_.isUndefined(info)) logger.info(`${context} [${propertyKey}] ${info}`)
                return targetMethod.apply(this, args)
            }
            return descriptor
        }
    }
}

// create the logger instance what the app use to log everything
const { LOG_LEVEL: level } = process.env
export const loggerInstance = LoggerClass.getInstance(level)
export const loggedMethod = loggerInstance.loggedMethod
export const logger = loggerInstance.logger
export const logMiddleware = loggerInstance.logMiddleware



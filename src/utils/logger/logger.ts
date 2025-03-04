import { createLogger, format, transports } from 'winston'
import DailyLogRotate from 'winston-daily-rotate-file'
import LocalStorageClass from '../asyncLocalStorage/asyncLocalStorage'



class LoggerClass {
    level = 'info'
    logger: any
    constructor() {
        this.init()
    }

    format = format.combine(
        format.colorize(),
        format.timestamp(),
        format.printf(({ timestamp, level, message })=>{
            const requestId = LocalStorageClass.getRequestId()
            return `${timestamp} ${level} (${requestId}): ${message}`
        })
    )

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
}


export const logger = new LoggerClass().logger



import { Logger } from 'typeorm'
import _ from 'lodash'
import { LoggerClass } from './logger'

export default class TypeORMLoggerClass implements Logger {
  constructor (private loggerComponent:LoggerClass) {}

  private spreadArguments (parameters:any[]) {
    const paramStr = ' params:'
    try {
      if (_.isUndefined(parameters)) return paramStr + '-'
      if (_.isArray(parameters)) {
        return paramStr + parameters.map(it => LoggerClass.objectToString(it))
      } else {
        return paramStr + parameters
      }
    } catch (error) {
      this.loggerComponent.logger.error('[query] [spreadArguments] ' + error)
    }
    return paramStr + '-'
  }

  logQuery (query: string, parameters:any[]): void {
    console.log('logQuery')
    this.loggerComponent.logger.info('[query] ' + query + this.spreadArguments(parameters))
  }

  logQueryError (error:string, query: string, parameters:any[]): void {
    console.log('logError')
    this.loggerComponent.logger.error('[query] [error] ' + error + ' query: ' + query + this.spreadArguments(parameters))
  }

  logQuerySlow (time: number, query: string, parameters?: any[]) {
    this.loggerComponent.logger.info('[slow query] ' + query + ', params:' + parameters + ', time:' + time)
  }

  logSchemaBuild (message: string) {
    this.loggerComponent.logger.info('[schema build] ' + message)
  }

  logMigration (message: string) {
    this.loggerComponent.logger.info('[migration]' + message)
  }

  log (level: 'log' | 'info' | 'warn' | any, message: any) {
    console.log('log-', level)
    if (level === 'log' || level === 'info') {
      this.loggerComponent.logger.info(message)
    }
    if (level === 'warn') {
      this.loggerComponent.logger.info(message)
    }
  }
}

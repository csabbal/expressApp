import "reflect-metadata";
import { CommandFailedEvent, CommandStartedEvent, CommandSucceededEvent } from 'mongodb'

import { logger, LoggerClass } from "../../utils/logger/logger";
import { DataSource } from "./DataSource";

/**
 * This class is to take care about:
 * the initialize of the MongoDataSource,  
 * creating the connectionString
 * make the connection to the database
 * the proper logging
 */
export default class MongoDataSource extends DataSource {

    setLogging() {
        this.ODM.connection.on('commandStarted', (data: CommandStartedEvent) => {
            logger.info("[db][commandStarted]" + JSON.stringify(data.command))
        })

        this.ODM.connection.on('commandFailed', (data: CommandFailedEvent) => {
            logger.info("[db][commandFailed]" + LoggerClass.objectToString(data.failure))
        })

        this.ODM.connection.on('commandSucceeded', (data: CommandSucceededEvent) => {
            logger.info("[db][commandSucceeded]" + LoggerClass.objectToString(data.reply))
        })
    }

    setConnectionString() {
        this.connectionString = `mongodb://${this.data.user}:${this.data.password}@${this.data.host}:${this.data.port}`
    }

    async connectoToDatabase() {
        await this.ODM.connect(this.connectionString, { monitorCommands: true, serverMonitoringMode: 'auto' })
    }
}







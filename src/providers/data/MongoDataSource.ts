import "reflect-metadata"
import { CommandFailedEvent, CommandStartedEvent, CommandSucceededEvent } from 'mongodb'
import { Connection } from 'mongoose'

import { logger, LoggerClass } from "../../utils/logger/logger"
import { DataSource } from "./DataSource"

/**
 * This class is to take care about:
 * the initialize of the MongoDataSource,
 * creating the connectionString
 * make the connection to the database
 * the proper logging
 *
 * Every Mongo DataSource - the app's primary DB, the learning DB, any future
 * one - is handled identically here: its own named connection via
 * mongoose.createConnection(), never the ambient mongoose default connection.
 * There is no "the primary one is special" branch.
 */
export default class MongoDataSource extends DataSource {

    setLogging() {
        this.connection.on('commandStarted', (data: CommandStartedEvent) => {
            logger.info("[db][commandStarted]" + JSON.stringify(data.command))
        })

        this.connection.on('commandFailed', (data: CommandFailedEvent) => {
            logger.info("[db][commandFailed]" + LoggerClass.objectToString(data.failure))
        })

        this.connection.on('commandSucceeded', (data: CommandSucceededEvent) => {
            logger.info("[db][commandSucceeded]" + LoggerClass.objectToString(data.reply))
        })
    }

    setConnectionString() {
        this.connectionString =
            `mongodb://${this.data.user}:${this.data.password}@${this.data.host}:${this.data.port}` +
            `/${this.data.database}?authSource=admin`
    }

    /**
     * Synchronously gets (creating if needed) the underlying Connection, without
     * opening it - mongoose.createConnection() with no URI creates a Connection
     * that isn't connected yet (models can still be registered on it, buffered
     * until it opens). This is what lets entity schema files register models at
     * import time - the same way mongoose.model() on the default connection
     * never itself does any I/O - without triggering a real network connection
     * as a side effect of merely importing a module.
     */
    getOrCreateConnection(): Connection {
        if (!this.connection) {
            this.connection = this.ODM.createConnection()
        }
        return this.connection
    }

    async connectoToDatabase() {
        this.getOrCreateConnection()
        await this.connection.openUri(
            this.connectionString,
            { monitorCommands: true, serverMonitoringMode: 'auto' }
        )
    }
}

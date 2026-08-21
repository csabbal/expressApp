import "reflect-metadata"
import { CommandFailedEvent, CommandStartedEvent, CommandSucceededEvent } from 'mongodb'
import { Connection, Mongoose } from 'mongoose'

import { logger, LoggerClass } from "../../utils/logger/logger"
import { DataSource } from "./DataSource"
import { DatabaseProperties } from "../../types/Database"

/**
 * This class is to take care about:
 * the initialize of the MongoDataSource,
 * creating the connectionString
 * make the connection to the database
 * the proper logging
 *
 * useDefaultConnection controls whether this DataSource drives the app's one
 * ambient default Mongoose connection (used implicitly by every mongoose.model()
 * call - the primary DB) or opens its own separate, named connection via
 * mongoose.createConnection() (used by entities that live in a different
 * database, e.g. the learning DB) - Mongoose only ever has one default
 * connection, so a second database can never reuse that path.
 */
export default class MongoDataSource extends DataSource {

    constructor(data: DatabaseProperties, ODM: Mongoose, protected useDefaultConnection: boolean = true) {
        super(data, ODM)
    }

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
        const base = `mongodb://${this.data.user}:${this.data.password}@${this.data.host}:${this.data.port}`
        this.connectionString = this.useDefaultConnection ? base : `${base}/${this.data.database}?authSource=admin`
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
            this.connection = this.useDefaultConnection ? this.ODM.connection : this.ODM.createConnection()
        }
        return this.connection
    }

    async connectoToDatabase() {
        this.getOrCreateConnection()
        const options = { monitorCommands: true, serverMonitoringMode: 'auto' } as const
        if (this.useDefaultConnection) {
            await this.ODM.connect(this.connectionString, options)
        } else {
            await this.connection.openUri(this.connectionString, options)
        }
    }
}

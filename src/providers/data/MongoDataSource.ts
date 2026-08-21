import "reflect-metadata"
import { CommandFailedEvent, CommandStartedEvent, CommandSucceededEvent } from 'mongodb'
import { Mongoose } from 'mongoose'

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
 * Every Mongo DataSource - the app's primary DB, the learning DB, any future
 * one - is handled identically here: its own named connection via
 * mongoose.createConnection(), never the ambient mongoose default connection.
 * There is no "the primary one is special" branch.
 */
export default class MongoDataSource extends DataSource {

    constructor(data: DatabaseProperties, ODM: Mongoose) {
        super(data, ODM)
        // Created up front, not lazily: mongoose.createConnection() with no URI
        // is synchronous and does no I/O - it just allocates a Connection that
        // isn't open yet (models can still be registered on it, buffered until
        // it opens later via connectoToDatabase). Entity schema files need this
        // Connection to exist the moment they import getConnection(name), which
        // can happen before connectoToDatabase ever runs.
        this.connection = this.ODM.createConnection()
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
        this.connectionString =
            `mongodb://${this.data.user}:${this.data.password}@${this.data.host}:${this.data.port}` +
            `/${this.data.database}?authSource=admin`
    }

    async connectoToDatabase() {
        await this.connection.openUri(
            this.connectionString,
            { monitorCommands: true, serverMonitoringMode: 'auto' }
        )
    }
}

import "reflect-metadata";
import { CommandFailedEvent, CommandStartedEvent, CommandSucceededEvent } from 'mongodb'
import mongoose from "mongoose";
import { logger, LoggerClass } from "../../utils/logger/logger";
import { DataSource } from "./DataSource";

export default class MongoDataSource extends DataSource {

    setLogging() {
        mongoose.connection.on('commandStarted', (data: CommandStartedEvent) => {
            logger.info("[db][commandStarted]" + JSON.stringify(data.command))
        })

        mongoose.connection.on('commandFailed', (data: CommandFailedEvent) => {
            logger.info("[db][commandFailed]" + LoggerClass.objectToString(data.failure))
        })

        mongoose.connection.on('commandSucceeded', (data: CommandSucceededEvent) => {
            logger.info("[db][commandSucceeded]" + LoggerClass.objectToString(data.reply))
        })
    }

    setConnectionString() {
        this.connectionString = `mongodb://${this.data.user}:${this.data.password}@${this.data.host}:${this.data.port}`
    }

    async connectoToDatabase() {
        await mongoose.connect(this.connectionString, { monitorCommands: true, serverMonitoringMode: 'auto' })
    }
}







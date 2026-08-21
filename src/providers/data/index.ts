import "reflect-metadata"
import dotenv from 'dotenv'
import MongoDataSource from './MongoDataSource'
import { DatabaseProperties } from "../../types/Database"
import mongoose, {Mongoose, Connection} from "mongoose"

dotenv.config()
/**
 * This factory class is to take care about the creation of DataSources 
 */
export class DataSourceFactory {

    constructor(protected data: DatabaseProperties, protected ODM: Mongoose) {}

    create() {
        switch (this.data.type) {
            case 'mongo':
                return new MongoDataSource(this.data, this.ODM)
            default:
                throw new Error('database type is unknown')
        }
    }
}
export async function initDataSource(data: DatabaseProperties) {
    const dataSourceFactory = new DataSourceFactory(data,mongoose)
    const dataSoruce = dataSourceFactory.create()
    await dataSoruce.buildDataSource()
}

let learningConnection: Connection

/**
 * The learning database is a separate database from the app's primary one,
 * configured independently via LEARNING_DB_* env vars (own host/credentials/
 * database name). It gets its own dedicated Mongoose connection
 * (mongoose.createConnection), not the app's default connection, so it is
 * never coupled to the primary DataSource's config.
 */
export function getLearningConnection(): Connection {
    if (!learningConnection) {
        const {
            LEARNING_DB_HOST: host,
            LEARNING_DB_PORT: port,
            LEARNING_DB_USERNAME: user,
            LEARNING_DB_PASSWORD: password,
            LEARNING_DB_DATABASE: database
        } = process.env
        learningConnection = mongoose.createConnection(
            `mongodb://${user}:${password}@${host}:${port}/${database}?authSource=admin`
        )
    }
    return learningConnection
}














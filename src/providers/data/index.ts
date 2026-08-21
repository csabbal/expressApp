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

    constructor(
        protected data: DatabaseProperties,
        protected ODM: Mongoose,
        protected useDefaultConnection: boolean = true
    ) {}

    create() {
        switch (this.data.type) {
            case 'mongo':
                return new MongoDataSource(this.data, this.ODM, this.useDefaultConnection)
            default:
                throw new Error('database type is unknown')
        }
    }
}

const learningDbProperties: DatabaseProperties = {
    type: process.env.LEARNING_DB_TYPE,
    host: process.env.LEARNING_DB_HOST,
    port: process.env.LEARNING_DB_PORT,
    user: process.env.LEARNING_DB_USERNAME,
    password: process.env.LEARNING_DB_PASSWORD,
    database: process.env.LEARNING_DB_DATABASE
}

/**
 * Built once at module load, not lazily inside a function: entity schema files
 * for the learning resources (TaskType/AdditionInMoreSteps/SubtractionInMoreSteps)
 * import getLearningConnection() and register models on it eagerly at import
 * time. ES module imports fully resolve before src/index.ts's own body (its two
 * initDataSource calls included) ever runs, so the Connection object has to
 * exist by then regardless - the same constraint the primary/default connection
 * already lives under via mongoose.model().
 */
const learningDataSource = new DataSourceFactory(learningDbProperties, mongoose, false).create() as MongoDataSource
learningDataSource.setConnectionString()

export function getLearningConnection(): Connection {
    return learningDataSource.getOrCreateConnection()
}

/**
 * Connects a DataSource. Called twice from src/index.ts at boot: once for the
 * primary DB (the default Mongoose connection, useDefaultConnection left true)
 * and once for the learning DB (useDefaultConnection: false). Both go through
 * the same DataSourceFactory/DataSource abstraction and both are awaited before
 * the server starts listening, so bad config on either fails startup fast
 * instead of silently surfacing on the first request.
 *
 * For the learning DB, the Connection itself was already created by
 * getLearningConnection() (see above) - this call awaits it actually being open
 * and attaches command logging, reusing the one learningDataSource singleton
 * rather than opening a second connection.
 */
export async function initDataSource(
    data: DatabaseProperties,
    useDefaultConnection: boolean = true
): Promise<Connection> {
    if (!useDefaultConnection) {
        return await learningDataSource.buildDataSource()
    }
    const dataSourceFactory = new DataSourceFactory(data, mongoose, true)
    const dataSoruce = dataSourceFactory.create()
    return await dataSoruce.buildDataSource()
}

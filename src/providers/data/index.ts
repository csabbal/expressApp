import "reflect-metadata"
import dotenv from 'dotenv'
import MongoDataSource from './MongoDataSource'
import { DataSource } from './DataSource'
import { DatabaseProperties } from "../../types/Database"
import mongoose, {Mongoose, Connection} from "mongoose"

dotenv.config()

/**
 * This factory class is to take care about the creation of DataSources
 */
export class DataSourceFactory {

    constructor(protected data: DatabaseProperties, protected ODM: Mongoose) {}

    create(): DataSource {
        switch (this.data.type) {
            case 'mongo':
                return new MongoDataSource(this.data, this.ODM)
            default:
                throw new Error('database type is unknown')
        }
    }
}

/**
 * Every database the app talks to is registered here, uniformly, by name -
 * there is no "the primary one" special case, just entries in this map. Add a
 * new database by adding a new entry, nothing else in this file changes.
 *
 * Built at module load, not lazily: entity schema files (Movie/User/...,
 * TaskType/AdditionInMoreSteps/SubtractionInMoreSteps/...) call
 * getConnection(name) and register models on it eagerly at import time. ES
 * module imports fully resolve before src/index.ts's own body - its
 * initDataSource calls included - ever runs, so every DataSource's Connection
 * object has to exist by then regardless.
 */
const dataSourceProperties: Record<string, DatabaseProperties> = {
    learning: {
        type: process.env.LEARNING_DB_TYPE,
        host: process.env.LEARNING_DB_HOST,
        port: process.env.LEARNING_DB_PORT,
        user: process.env.LEARNING_DB_USERNAME,
        password: process.env.LEARNING_DB_PASSWORD,
        database: process.env.LEARNING_DB_DATABASE
    },
    auth: {
        type: process.env.AUTH_DB_TYPE,
        host: process.env.AUTH_DB_HOST,
        port: process.env.AUTH_DB_PORT,
        user: process.env.AUTH_DB_USERNAME,
        password: process.env.AUTH_DB_PASSWORD,
        database: process.env.AUTH_DB_DATABASE
    },
    movie: {
        type: process.env.MOVIE_DB_TYPE,
        host: process.env.MOVIE_DB_HOST,
        port: process.env.MOVIE_DB_PORT,
        user: process.env.MOVIE_DB_USERNAME,
        password: process.env.MOVIE_DB_PASSWORD,
        database: process.env.MOVIE_DB_DATABASE
    },
    general: {
        type: process.env.GENERAL_DB_TYPE,
        host: process.env.GENERAL_DB_HOST,
        port: process.env.GENERAL_DB_PORT,
        user: process.env.GENERAL_DB_USERNAME,
        password: process.env.GENERAL_DB_PASSWORD,
        database: process.env.GENERAL_DB_DATABASE
    }
}

// create() constructs the DataSource, which creates its Connection immediately
// (see MongoDataSource's constructor) - so every registered database has a
// usable Connection object by the time this loop finishes, at module load.
export const dataSources: Record<string, DataSource> = {}
for (const name in dataSourceProperties) {
    const dataSource = new DataSourceFactory(dataSourceProperties[name], mongoose).create()
    dataSource.setConnectionString()
    dataSources[name] = dataSource
}

export function getConnection(name: string): Connection {
    return dataSources[name].getConnection()
}

/**
 * Connects a registered DataSource by name. Called once per database from
 * src/index.ts at boot - all of them treated the same way - so bad config on
 * any one fails startup fast instead of silently surfacing on the first
 * request, and each gets its command logging attached.
 */
export async function initDataSource(name: string): Promise<Connection> {
    const dataSource = dataSources[name]
    if (!dataSource) throw new Error(`unknown data source: ${name}`)
    return await dataSource.buildDataSource()
}

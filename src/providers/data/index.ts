import "reflect-metadata";
import * as dotenv from "dotenv";
import MongoDataSource from './MongoDataSource'
import { DatabaseProperties } from "../../types/Database";
dotenv.config();
const { DB_TYPE: type, DB_HOST: host, DB_PORT: port, DB_USERNAME: user, DB_PASSWORD: password, DB_DATABASE: database, NODE_ENV: env } = process.env;

/**
 * This factory class is to take care about the creation of DataSources 
 */
class DataSourceFactory {

    constructor(protected data: DatabaseProperties) {}

    create() {
        switch (this.data.type) {
            case 'mongo':
                return new MongoDataSource(this.data)
            default:
                throw new Error('database type is needed')
        }
    }
}

export async function initDataSource() {
    const dataSourceFactory = new DataSourceFactory({ type, host, port, user, password, database })
    const dataSoruce = dataSourceFactory.create()
    await dataSoruce.buildDataSource()
}














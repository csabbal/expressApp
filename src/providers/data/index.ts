import "reflect-metadata"
import MongoDataSource from './MongoDataSource'
import { DatabaseProperties } from "../../types/Database"
import mongoose, {Mongoose} from "mongoose"
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














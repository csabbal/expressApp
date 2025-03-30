import { DatabaseProperties } from "../../types/Database"
import { logger, LoggerClass } from "../../utils/logger/logger"
import {Mongoose} from "mongoose"

/**
 *  This class is the base of the any DataSource in the database
 *  in an ideal case it must be initialized only one time
 */
export abstract class DataSource {
    protected connectionString:string
    constructor(protected data:DatabaseProperties, protected ODM: Mongoose) {
        logger.info(this.data.type+' connection string: ' + LoggerClass.objectToString(data))
    }

    // a method to set the custom logging 
    setLogging():void { }

    // a method to assemble a connectionString from the field data 
    setConnectionString():void {
        this.connectionString =  LoggerClass.objectToString(this.data)
     }

    // a method to crate a connection to the dabatase 
    async connectoToDatabase() {}

    // a builder method to setup the Data Source to use
    async buildDataSource() {
        this.setConnectionString()
        this.setLogging()
        this.connectoToDatabase()
    }
}





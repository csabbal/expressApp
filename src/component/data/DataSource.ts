import { DatabaseProperties } from "../../types/Database"
import { logger, LoggerClass } from "../../utils/logger/logger"

export abstract class DataSource {
    protected connectionString:string
    constructor(protected data:DatabaseProperties) {
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





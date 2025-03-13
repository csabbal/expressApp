import "reflect-metadata";
import {CommandFailedEvent, CommandStartedEvent, CommandSucceededEvent} from 'mongodb'
import  mongoose from "mongoose";

import * as dotenv from "dotenv";
import { logger, LoggerClass } from "../../utils/logger/logger";

dotenv.config();
const { DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE, NODE_ENV } = process.env;
const connectionString = `mongodb://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}`


export async function init() {
    logger.info('mongo connection string: ' + connectionString)

    mongoose.connection.on('commandStarted',(data: CommandStartedEvent)=>{
        logger.info("[db][commandStarted]"+JSON.stringify(data.command))
    })

    mongoose.connection.on('commandFailed',(data: CommandFailedEvent)=>{
        logger.info("[db][commandFailed]"+LoggerClass.objectToString(data.failure))
    })

    mongoose.connection.on('commandSucceeded',(data: CommandSucceededEvent)=>{
        logger.info("[db][commandSucceeded]"+LoggerClass.objectToString(data.reply))
    })

    await mongoose.connect(connectionString,{monitorCommands:true,serverMonitoringMode:'auto'})

 

   

  
}





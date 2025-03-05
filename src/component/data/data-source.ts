import "reflect-metadata";
import { DataSource } from "typeorm";

import * as dotenv from "dotenv";
import { User } from "../../entities/User.entity";
import TypeORMLoggerClass from "../../utils/logger/typeOrmLogger";
import { LoggerClass } from "../../utils/logger/logger";
import { MongoDriver } from "typeorm/driver/mongodb/MongoDriver";
import { initial } from "lodash";

dotenv.config();

const { DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE, NODE_ENV } =
    process.env;

console.log('ba1DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE, NODE_ENV', DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE, NODE_ENV)


export const AppDataSource = new DataSource({
    type: "mongodb",
    url: `mongodb://root:password@127.0.0.1:27017`,

    synchronize: true,
    logging:'all',
    logger: new TypeORMLoggerClass(LoggerClass.getInstance()),
    entities: [User],
    monitorCommands: true, 
    migrations: [__dirname + "/migration/*.ts"],
    //subscribers: [],
});

export async function init(){
    await AppDataSource.initialize()
    subscribeToSCommand()

}

export function subscribeToSCommand(){
    const conn = (AppDataSource.driver as MongoDriver).queryRunner!.databaseConnection;
    conn.on("commandStarted", (evt) => {
        LoggerClass.getInstance().logger.info( LoggerClass.getInstance().objectToString(evt));
    });
    conn.on("commandSucceeded", (evt) => {
        LoggerClass.getInstance().logger.info(LoggerClass.getInstance().objectToString(evt));
    });
    conn.on("commandFailed", (evt) => {
        LoggerClass.getInstance().logger.error(LoggerClass.getInstance().objectToString(evt));
    });
}




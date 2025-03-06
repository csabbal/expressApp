import "reflect-metadata";
import { DataSource } from "typeorm";

import * as dotenv from "dotenv";
import { User } from "../../entities/User.entity";
import TypeORMLoggerClass from "../../utils/logger/typeOrmLogger";
import { logger, LoggerClass } from "../../utils/logger/logger";
import { MongoDriver } from "typeorm/driver/mongodb/MongoDriver";

dotenv.config();
const { DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE, NODE_ENV } = process.env;
const url = `mongodb://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}`
export let AppDataSource = new DataSource({
    type: "mongodb",
    url: url,
    synchronize: true,
    logging: 'all',
    logger: new TypeORMLoggerClass(LoggerClass.getInstance()),
    entities: [User],
    monitorCommands: true,
    // migrations: [__dirname + "/migration/*.ts"],
    //subscribers: [],
});

export async function init() {

    logger.info('mongo connection string: ' + url)
    await AppDataSource.initialize()
    subscribeToSCommand()

}

export function subscribeToSCommand() {
    const conn = (AppDataSource.driver as MongoDriver).queryRunner!.databaseConnection;

    conn.addListener('commandSucceeded', (evt) => {
        LoggerClass.getInstance().logger.info(LoggerClass.getInstance().objectToString(evt));
    })

    conn.addListener('commandStarted', (evt) => {
        LoggerClass.getInstance().logger.info(LoggerClass.getInstance().objectToString(evt));
    })

    conn.addListener('commandFailed', (evt) => {
        LoggerClass.getInstance().logger.info(LoggerClass.getInstance().objectToString(evt));
    })

    conn.prependListener


}




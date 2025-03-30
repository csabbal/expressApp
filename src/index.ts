import { initDataSource } from './providers/data/index';
import fs from 'fs'
import express, { Application } from 'express';
import https from 'https'
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './routes/index'
import AsyncLocalStorageClass from './utils/asyncLocalStorage/asyncLocalStorage';
import { loggerInstance, logger } from './utils/logger/logger';
import { errorHandlerMiddleware } from './utils/error/Error';
import { addPassportToAppFunction } from './providers/auth/passport'

dotenv.config();
const { PORT: appPort } = process.env
const { DB_TYPE: type, DB_HOST: host, DB_PORT: port, DB_USERNAME: user, DB_PASSWORD: password, DB_DATABASE: database } = process.env;

const options = {
  key: fs.readFileSync('keys/server.key'), 
  cert: fs.readFileSync('keys/server.cert')
};

// init express application
const app: Application = express()
app.use(bodyParser.json())
app.use(cors())

// init Passport to authentication
addPassportToAppFunction(app)

// add the middlewares
app.use(AsyncLocalStorageClass.requestIdMiddleware)
app.use(loggerInstance.logMiddleware.bind(loggerInstance))

// add the routes
app.use('/api', router)

// add the global error handling
app.use(errorHandlerMiddleware)

// init the data source
await initDataSource({type, host, port, user, password, database})

// start the application
https.createServer(options,app).listen(appPort,() => {
  logger.info(`Server is running  at https://localhost:${appPort}`);
});

export default app
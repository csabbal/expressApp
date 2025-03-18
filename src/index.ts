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
import {initPassport} from './providers/auth/passport'

dotenv.config();
const { PORT: port } = process.env

const options = {
  key: fs.readFileSync('keys/server.key'), 
  cert: fs.readFileSync('keys/server.cert')
};

// init express application
const app: Application = express()
app.use(bodyParser.json())
app.use(cors())

// init Passport to authentication
initPassport(app)

// add the middlewares
app.use(AsyncLocalStorageClass.requestIdMiddleware)
app.use(loggerInstance.logMiddleware.bind(loggerInstance))

// add the routes
app.use('/api', router)

// add the global error handling
app.use(errorHandlerMiddleware)

// init the data source
await initDataSource()

// start the application
https.createServer(options,app).listen(port,() => {
  logger.info(`Server is running  at https://localhost:${port}`);
});

export default app
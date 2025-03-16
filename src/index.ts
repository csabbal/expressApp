import { initDataSource } from './providers/data/index';
import express, { Application } from 'express';
import dotenv from 'dotenv';
import router from './routes/index'
import AsyncLocalStorageClass from './utils/asyncLocalStorage/asyncLocalStorage';
import { LoggerClass, logger } from './utils/logger/logger';
import { errorHandlerMiddleware } from './utils/error/Error';
import {initPassport} from './providers/auth/passport'

dotenv.config();
const { PORT: port } = process.env

// init express application
const app: Application = express()

// init Passport to authentication
initPassport(app)

// add the middlewares
app.use(AsyncLocalStorageClass.requestIdMiddleware)
app.use((req, res, next) => LoggerClass.getInstance().logMiddleware(req, res, next))

// add the routes
app.use('/api', router)

// add the global error handling
app.use(errorHandlerMiddleware)

// init the data source
await initDataSource()

// start the application
app.listen(port, () => {
  logger.info(`Server is running at https://localhost:${port}`);
});

export default app
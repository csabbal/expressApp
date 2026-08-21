import { dataSources, initDataSource } from './providers/data/index'
import fs from 'fs'
import express, { Application } from 'express'
import http from 'http'
import https from 'https'
import bodyParser from 'body-parser'
import cors from 'cors'
import dotenv from 'dotenv'
import router from './routes/index'
import AsyncLocalStorageClass from './utils/asyncLocalStorage/asyncLocalStorage'
import { loggerInstance, logger } from './utils/logger/logger'
import { errorHandlerMiddleware } from './utils/error/Error'
import { addPassportToAppFunction } from './providers/auth/passport'

dotenv.config()
const { PORT: appPort, PROTOCOL: appProtocol } = process.env

const options = {
  key: fs.readFileSync('keys/server.key'),
  cert: fs.readFileSync('keys/server.cert')
}

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

// init the data source(s) - every database the app talks to is registered
// in providers/data/index.ts and connected here the same way, by name
for (const name of Object.keys(dataSources)) {
  await initDataSource(name)
}

// start the application
if (appProtocol == "http") {
  http.createServer(app).listen(appPort, () => {
    logger.info(`Server is running  at ${appProtocol}://localhost:${appPort}`)
  })
} else {
  https.createServer(options, app).listen(appPort, () => {
    logger.info(`Server is running  at ${appProtocol}://localhost:${appPort}`)
  })
}

export default app
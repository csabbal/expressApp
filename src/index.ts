import "reflect-metadata";
import { AppDataSource, init } from './component/data/data-source';
import express, { Application } from 'express';
import dotenv from 'dotenv';
import router from './routes/index'
import AsyncLocalStorageClass from './utils/asyncLocalStorage/asyncLocalStorage';
import { LoggerClass } from './utils/logger/logger';
import { errorHandlerMiddleware } from './utils/error/Error';



//For env File 
dotenv.config();

const app: Application = express();
const port = process.env.PORT || 8000;

app.use(AsyncLocalStorageClass.requestIdMiddleware)
app.use((req, res, next) => LoggerClass.getInstance().logMiddleware(req, res, next))
app.use('/api', router)
app.use(errorHandlerMiddleware)

await init()


app.listen(port, () => {
  console.log(`Server is running at https://localhost:${port}`);
});

export default app
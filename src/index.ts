import express, { Application } from 'express';
import dotenv from 'dotenv';
import router from './routes/index'


//For env File 
dotenv.config();

const app: Application = express();
const port = process.env.PORT || 8000;

app.use('/api',router)

app.listen(port, () => {
  console.log(`Server is running at https://localhost:${port}`);
});

export default app
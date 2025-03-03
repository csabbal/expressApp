import express from 'express';
import testRouter from './test'
import swaggerUi from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';
const router = express.Router()
// Swagger setup
const swaggerOptions = {
    swaggerDefinition: {
        myapi: '3.0.0',
        info: {
            title: 'Express Node Fundamentals',
            version: '0.0.1',
            description: 'API documentation',
        },
        servers: [
            {
                url: 'http://localhost:8000',
            },
        ],
    },
    apis: ['./src/routes/*'], // files containing annotations as above
};

//test endpoints
router.use('/', testRouter)
//swagger
router.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerJsDoc(swaggerOptions)));
export default router
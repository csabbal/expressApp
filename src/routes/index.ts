import express from 'express'
import dotenv from 'dotenv'
import userRouter from './user'
import authRouter from './auth'
import swaggerUi from 'swagger-ui-express'
import swaggerJsDoc from 'swagger-jsdoc'
import * as packageJson from '../../package.json'

dotenv.config()
const{ BASE_PROTOCOL:protocol, BASE_URL: url, PORT: port} = process.env
const {name, version, description} = packageJson

//initiate the router
export const router = express.Router()

/** 
* @swagger
* components:
*   securitySchemes:
*     BearerAuth:
*       type: http
*       scheme: bearer
*       bearerFormat: JWT
*/
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: name,
            version: version,
            description: description,
        },
        servers: [
            {
                url: `${protocol}://${url}:${port}`,
            },
        ],
    },
    apis: ['./src/routes/*'],
};

// add endpoint in order for swagger's working
router.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerJsDoc(swaggerOptions)));

// added user endpoints
router.use('/user', userRouter)
// added auth endpoints
router.use('/auth', authRouter)

// exports the router which was setup
export default router
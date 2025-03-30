import express from 'express'
import dotenv from 'dotenv'
import userRouter from './user'
import authRouter from './auth'
import swaggerUi from 'swagger-ui-express'
import swaggerJsDoc from 'swagger-jsdoc'
import * as packageJson from '../../package.json'

dotenv.config()
const {
    PROTOCOL: protocol,
    URL: url,
    PORT: port,
    GOOGLE_CLIENT_ID: clientId,
    GOOGLE_CLIENT_SECRET: clientSecret,
} = process.env
const { name, version, description } = packageJson

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
        components: {
            securitySchemes: {
                googleAuth: {
                    type: 'oauth2',
                    flows: {
                        authorizationCode: {
                            clientId: clientId,
                            clientSecret: clientSecret,
                            authorizationUrl: 'https://localhost:8000/api/auth/google',
                            scopes: {
                                'profile': 'Access your profile information',
                                'email': 'Access your email address',
                            },
                        },
                    },
                },
            },
        },
    },
    apis: ['./src/routes/*'],
}

// add endpoint in order for swagger's working
router.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerJsDoc(swaggerOptions)))

// added user endpoints
router.use('/user', userRouter)
// added auth endpoints
router.use('/auth', authRouter)

// exports the router which was setup
export default router
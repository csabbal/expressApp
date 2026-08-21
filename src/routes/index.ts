import express from 'express'
import dotenv from 'dotenv'
import userRouter from './user'
import authRouter from './auth'
import signupRouter from './signup'
import movieRouter from './movie'
import fileRouter from './file' // [INFRASTRUCTURE]
import taskTypeRouter from './taskType'
import additionInMoreStepsRouter from './additionInMoreSteps'
import subtractionInMoreStepsRouter from './subtractionInMoreSteps'
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

// [INFRASTRUCTURE] Keep these — required for auth to work
router.use('/user', userRouter)
router.use('/auth', authRouter)
router.use('/signup', signupRouter)
router.use('/file', fileRouter) // [INFRASTRUCTURE]

// ================================================================
// [BUSINESS] Register your domain routes here.
// When bootstrapping a new app: remove the movie/taskType/additionInMoreSteps/
// subtractionInMoreSteps imports at the top and the lines below, then add
// your own routes following the same pattern.
// ================================================================
router.use('/movie', movieRouter) // [EXAMPLE]
router.use('/taskType', taskTypeRouter) // [EXAMPLE]
router.use('/additionInMoreSteps', additionInMoreStepsRouter) // [EXAMPLE]
router.use('/subtractionInMoreSteps', subtractionInMoreStepsRouter) // [EXAMPLE]

export default router
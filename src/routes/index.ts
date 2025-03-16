import express from 'express';
import userRouter from './user'
import authRouter from './auth'
import swaggerUi from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';

//initiate the router
export const router = express.Router()
// Swagger setup

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


  /**
 * @swagger
 * /api/main:
 *   get:
 *     summary: logoumaint
 *     responses:
 *       200:
 *         description: welcome page
 *          
 */
router.use('/main', (req: express.Request, res: express.Response, next:express.NextFunction) => {
    res.send("welcome on the page" + req.user)
})
router.use('/user', userRouter)
//auth
router.use('/auth', authRouter)
//swagger
router.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerJsDoc(swaggerOptions)));
export default router
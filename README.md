## Overview

This is a basic Express application written in TypeScript and bundled using Webpack.

## How to Run

1. Ensure you have Docker and Docker Compose installed on your system.
2. Copy the `.env.sample` file and rename it to `.env` in the root directory. Update the environment variables as needed for your setup.
3. Start the required services, including MongoDB, using Docker Compose:
    ```bash
    docker-compose up
    ```
4. For development mode, use the provided npm scripts:
    - To start the application in development mode:
        ```bash
        npm run start:dev
        ```
    - To run the application with hot-reloading:
        ```bash
        npm run run:dev
        ```
5. Access the application at `https://localhost:8000`. ( port it dpeends on the env file)
6. Explore the Swagger API documentation at `https://localhost:8000/api/doc` to try out the available endpoints.

## Authentication and Authorization

The application provides two methods for authentication:

1. **Google Authentication**:  
    Navigate to the Swagger API documentation at `https://localhost:8000/api/doc`. Use the "Authorize" button to authenticate with Google. Once authenticated, the provided token can be used as an access token for API requests.

2. **Local Authentication**:  
    Use the `/auth/login` endpoint to authenticate with your credentials. This endpoint returns an access token. Copy the token and use the "Authorize" button in the Swagger documentation to input the token. Once authorized, you will have full access to all endpoints without encountering any `403 Forbidden` errors.

## Technologies Used

- **Node.js**: Backend runtime environment.
- **Express**: Web framework for building APIs.
- **TypeScript**: Strongly typed programming language.
- **Webpack**: Module bundler for building the application.
- **Docker**: Containerization platform.
- **MongoDB**: NoSQL database for data storage.
- **ESLint**: Linter for maintaining code quality.
- **Jest**: Testing framework for unit tests.

its just a basic express app written in Typescript, run by webpack.



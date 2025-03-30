## Overview
 
The main goal of the project is to create a solid fundamental of any type of application. It has to have well-separated units (routers,controllers, services, repositories, authorization) for possible improvement, during the development we have to keep the SOLID principles, it should be clean code.
For detailed documentation of the project, please check the generated documentation under the docs folder.

## Technologies Used

- **Express**: Web framework for building APIs.
- **TypeScript**: Strongly typed programming language.
- **Webpack**: Module bundler for building the application.
- **ESLint**: Linter for maintaining code quality.
- **Mongoose**: Object Document Model for MongoDB NoSQL database for data storage.

### Routing

The application uses Swagger for routing documentation and testing. A Swagger page is automatically generated and can be accessed at `https://localhost:8000/api/doc`. This page provides a user-friendly interface to explore and test all available API endpoints, including their request and response structures. It serves as a comprehensive guide for understanding the application's routing and functionality.

### Authorization

- **Passport**: Middleware for authentication in Node.js.
- **Google OAuth 2.0**: Used for Google-based authentication via the `passport-google-oauth20` strategy.
- **JWT (JSON Web Token)**: Used for securing API endpoints and managing user sessions. Tokens are generated upon successful authentication and are required for accessing protected routes.
- **passport-jwt**: Strategy for authenticating with JWT tokens in Passport.
- **Local Strategy**: Enables authentication using a username and password. This strategy is implemented via Passport's `passport-local` module, allowing users to log in with their credentials.

The application integrates these tools to provide a robust and secure authentication and authorization system.

### Testing

- **Mocha**: Feature-rich JavaScript test framework for asynchronous testing.
- **Sinon**: Library for creating spies, mocks, and stubs for testing.
- **Chai**: Assertion library for behavior-driven development (BDD) and test-driven development (TDD).

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
5. Access the application at `https://localhost:8000`. ( port depends on the env file)
6. Explore the Swagger API documentation at `https://localhost:8000/api/doc` to try out the available endpoints.

## Authentication and Authorization

The application provides two methods for authentication:

1. **Google Authentication**:  
    Navigate to the Swagger API documentation at `https://localhost:8000/api/doc`. Use the "Authorize" button to authenticate with Google. Once authenticated, the provided token can be used as an access token for API requests.

2. **Local Authentication**:  
    Use the `/auth/login` endpoint to authenticate with your credentials. This endpoint returns an access token. Copy the token and use the "Authorize" button in the Swagger documentation to input the token. Once authorized, you will have full access to all endpoints without encountering any `403 Forbidden` errors.

its just a basic express app written in Typescript, run by webpack for fun



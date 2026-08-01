## Overview

The main goal of this project is to be a reusable starting point for any business application. It provides a solid, pre-wired infrastructure layer — authentication, authorization, database access, logging, error handling, API documentation — so you can focus on building domain-specific features immediately without wiring up the plumbing each time.

The architecture follows SOLID principles with well-separated units: routes → controllers → services → repositories. For detailed API documentation see the auto-generated Swagger at `/api/doc` or the `docs/` folder.

### Using this as a template

Three files act as the extension points for your own domain. Each one has clearly marked `[INFRASTRUCTURE]` sections (keep them) and `[BUSINESS]` / `[EXAMPLE]` sections (replace with your own entities):

| File | What to do |
|---|---|
| `src/routes/index.ts` | Remove the movie route, register your own |
| `src/repositories/index.ts` | Remove the movie repository, register your own |
| `src/types/repositories.ts` | Remove the movie interface, add your own |

The `Movie*` files (`src/entities/Movie.schema.ts`, `src/repositories/Movie.repository.ts`, `src/services/movieService.ts`, `src/controllers/movieController.ts`, `src/routes/movie.ts`, `src/types/Movie.ts`) are the example domain — delete them and follow the same pattern for your own entities.

### AI agent skills

Two Claude Code skills are available to automate this:

- **`/add-resource`** — given an entity name and fields, generates all files (schema, repository, service, controller, route) and wires them up automatically
- **`/bootstrap-express-app`** — creates a new project from this template, strips the movie example, and scaffolds your entities using `add-resource`

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

### Logging

- **Winston**: The application uses Winston for logging, providing a flexible and extensible logging system.  
- **Request Identification**: Each log entry includes a unique generated ID to trace and identify individual requests. This is achieved using **Async Local Storage**, which is part of the **async_hooks** module. This ensures that logs are tied to the specific request context.  
This logging setup helps in debugging and monitoring the application's behavior effectively.

## How to Run

### 1. Prerequisites

- Docker and Docker Compose installed on your system.
- A Google Cloud project with OAuth 2.0 credentials (Client ID and Client Secret). You can create them at [console.cloud.google.com](https://console.cloud.google.com) under **APIs & Services → Credentials**.

### 2. Environment Setup

Copy the sample env file and fill in your values:

```bash
cp .env.sample .env
```

Open `.env` and set your Google OAuth credentials:

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

All other values in `.env.sample` are pre-configured with sensible defaults for local development.

### 3. Running with Docker Compose (recommended for local development)

```bash
docker compose up
```

For development mode with hot reload:

```bash
docker compose -f docker-compose-development.yml up
```

### 4. Running with Docker Swarm (for production / multi-node deployments)

Docker Swarm requires images to be pre-built and a Swarm to be initialized.

```bash
# Initialize Swarm (only needed once)
docker swarm init

# Build the images
docker compose build

# Deploy the stack
docker stack deploy -c docker-compose.yml express-app
```

To tear down the stack:

```bash
docker stack rm express-app
```

> **Note:** Docker Swarm requires the network driver to be set to `overlay`. Switch it back to `bridge` when using `docker compose up`.

### 5. Access the application

- App: `https://localhost:8000`
- Swagger API docs: `https://localhost:8000/api/doc`

> The app uses a self-signed certificate, so your browser will show a security warning. Click **Advanced → Proceed** to continue.

## Foundation Assessment

This app is designed as a starting point for any business application. Below is an honest assessment of what general-purpose infrastructure is already built in, and what still needs to be added before it can be considered production-ready — independent of any business requirements.

### ✅ Already implemented

| Area | Details |
|---|---|
| **HTTPS** | TLS server with self-signed cert out of the box |
| **Database** | MongoDB via Mongoose, abstracted behind a DataSource + Repository pattern |
| **Repository base** | Generic `find`, `findOne`, `create`, `findWithParams` (limit, offset, sort) |
| **Authentication** | Google OAuth 2.0, local (username + password), JWT — all via Passport |
| **Authorization** | JWT-protected routes via `requireJwt` middleware |
| **Permission system** | `Permission` and `UserPermissions` schemas for RBAC |
| **Password hashing** | bcrypt via `Crypt` utility |
| **Global error handling** | `BadRequestError` / `ServerError` classes + global middleware; stack hidden in production |
| **Logging** | Winston with daily log rotation, request/response access log, per-request ID tracing via AsyncLocalStorage |
| **Log decorator** | `@loggedMethod` decorator for method-level logging |
| **API documentation** | Swagger / OpenAPI auto-generated at `/api/doc` |
| **CORS** | Enabled globally |
| **Layered architecture** | routes → controllers → services → repositories, SOLID-friendly |
| **TypeScript** | Throughout, compiled via Webpack |
| **Unit tests** | Mocha + Sinon + Chai, coverage reporting |
| **Docker** | Compose for dev/prod, Dockerfile with multi-stage build, PM2 in production |
| **Session handling** | `express-session` wired up |
| **Environment config** | `dotenv` + `.env.sample` template |

---

### ❌ Not yet implemented (general, non-business-specific)

These are infrastructure concerns that apply to virtually any production app and are not tied to business logic.

| Area | What's missing | Suggested package |
|---|---|---|
| **Security headers** | No Helmet — app is exposed to XSS, clickjacking, MIME sniffing etc. | `helmet` |
| **Rate limiting** | No protection against brute-force or DDoS on any endpoint | `express-rate-limit` |
| **Input validation** | No schema validation on request bodies or query params | `zod` / `joi` |
| **Request size limit** | `bodyParser` is set up but no max body size configured | `bodyParser({ limit: '10kb' })` |
| **Graceful shutdown** | No `SIGTERM`/`SIGINT` handler — DB connections not closed on shutdown | Node `process.on(...)` |
| **Health check endpoint** | No `/health` or `/api/health` endpoint for load balancers / monitoring | custom route |
| **API versioning** | Routes live at `/api/...` with no version prefix (`/api/v1/`) | Express router prefix |
| **Repository update/delete** | Base `Repository` only has `find`, `findOne`, `create` — no `update` or `delete` | extend `Repository.ts` |
| **Pagination response envelope** | `findWithParams` supports limit/offset/sort but responses have no standard envelope (`{ data, total, page }`) | standardize in controller/service |
| **Environment validation** | App starts silently even if required env vars are missing | `zod` / custom check at startup |
| **Compression** | Responses are not gzip-compressed | `compression` |
| **Request timeout** | No timeout on slow requests | `connect-timeout` |
| **Integration / E2E tests** | Only unit tests exist — no tests that hit a real DB or HTTP layer | Mocha + Supertest |
| **CI/CD pipeline** | No GitHub Actions or similar pipeline defined | GitHub Actions |

---

## Authentication and Authorization

The application provides two methods for authentication:

1. **Google Authentication**:  
    Navigate to the Swagger API documentation at `https://localhost:8000/api/doc`. Use the "Authorize" button to authenticate with Google. Once authenticated, the provided token can be used as an access token for API requests.

2. **Local Authentication**:  
    Use the `/auth/login` endpoint to authenticate with your credentials. This endpoint returns an access token. Copy the token and use the "Authorize" button in the Swagger documentation to input the token. Once authorized, you will have full access to all endpoints without encountering any `403 Forbidden` errors.

its just a basic express app written in Typescript, run by webpack for fun



# Express App

TypeScript/Express REST API with MongoDB, Webpack build, Passport auth (Google OAuth + JWT + local), Winston logging, Swagger docs.

## Stack

- **Runtime**: Node.js, Express, TypeScript compiled via Webpack
- **DB**: MongoDB via Mongoose
- **Auth**: Passport — Google OAuth 2.0, JWT, local strategy
- **Tests**: Mocha + Sinon + Chai
- **Process manager**: PM2 (production)

## Project structure

Layered architecture: routes → controllers → services → repositories. Follow SOLID principles.

## Commands

```bash
npm run build        # Webpack production build → build/index.js
npm run start:dev    # Dev server
npm run lint         # ESLint
npm run test:coverage
```

## Running

```bash
cp .env.sample .env  # fill in GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
docker compose up    # starts mongo + express
```

Dev mode: `docker compose -f docker-compose-development.yml up`

## Key env vars

| Var | Notes |
|-----|-------|
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Required — get from Google Cloud Console |
| `DB_HOST` | Must match compose service name (`mongo` for compose, `express-app_mongo` for Swarm) |
| `PORT` | Default 8000 |

## Endpoints

- App: `https://localhost:8000` (self-signed cert — accept browser warning)
- Swagger: `https://localhost:8000/api/doc`
- Auth: `/auth/login` (local), Google OAuth via Swagger Authorize button

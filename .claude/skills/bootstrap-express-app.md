---
name: bootstrap-express-app
description: Use when the user wants to start a new Express project from the expressApp boilerplate, or generate a new app with specific domain entities from scratch.
---

# Bootstrap Express App

## Overview

Creates a new project from this template by copying the infrastructure, removing the example `Movie` domain code, and scaffolding the user's own entities from scratch using the `add-resource` skill.

**Announce at start:** "I'm using the bootstrap-express-app skill to create the new project."

## When to Use

When the user wants to:
- Start a new backend project based on this boilerplate
- Generate a fresh app with specific domain entities (e.g. "create a shop API with Products and Orders")

## What to Ask First

If not already provided, ask:
- **Project name** (e.g. `my-shop-api`) — used for the directory name and `package.json`
- **Entities** — comma-separated list of domain entities to scaffold (e.g. `Product, Order, Customer`)
- **Target directory** — where to create the project (default: sibling folder next to expressApp)

## Steps

### 1. Copy the template

This skill lives inside the expressApp repository. Find its root path first:

```bash
git -C "$(dirname "$0")" rev-parse --show-toplevel 2>/dev/null || pwd
```

Then copy it:

```bash
cp -r {expressApp-root} {target-directory}/{project-name}
```

### 2. Update `package.json`

In the new project, update:
- `name` → project name (kebab-case)
- `description` → short description of the new app
- `version` → `0.0.1`

### 3. Reset git history

```bash
cd {target-directory}/{project-name}
rm -rf .git && git init
```

### 4. Remove the movie example files

Delete these files — they are example domain code and must not be kept:

```
src/types/Movie.ts
src/entities/Movie.schema.ts
src/repositories/Movie.repository.ts
src/services/movieService.ts
src/controllers/movieController.ts
src/routes/movie.ts
```

### 5. Clean up `[EXAMPLE]` registrations

Remove all `[EXAMPLE]`-marked lines from the three extension-point files.

**`src/routes/index.ts`** — remove:
```typescript
import movieRouter from './movie'
router.use('/movie', movieRouter) // [EXAMPLE]
```

**`src/repositories/index.ts`** — remove:
```typescript
import { MovieModel } from "../entities/Movie.schema"
import { MovieRepository } from "./Movie.repository"
this.repositories.Movie = new MovieRepository(MovieModel) // [EXAMPLE]
export const movieRepository = repositories.Movie
```

**`src/types/repositories.ts`** — remove:
```typescript
import { MovieEntity } from "./Movie"
export interface IMovieRepository<T extends MovieEntity=MovieEntity> extends IRepository<T> {}
Movie?: IMovieRepository<MovieEntity> // [EXAMPLE]
```

Keep every line marked `[INFRASTRUCTURE]` — those are required for auth to work.

### 6. Scaffold each entity

**REQUIRED SUB-SKILL:** Use `add-resource` for each entity in the list.

### 7. Set up the environment

```bash
cp .env.sample .env
```

Remind the user to fill in `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env` before starting.

### 8. Verify the build

```bash
npm install
npm run build
```

Fix any TypeScript errors before continuing. Do not skip this step.

### 9. Start the app

```bash
docker compose up
```

## Important Rules

- Only remove lines and files explicitly marked `[EXAMPLE]`
- Never remove sections marked `[INFRASTRUCTURE]` — `User`, `Permission`, and `UserPermissions` are required for authentication
- Always run `npm run build` to verify TypeScript before declaring the project ready

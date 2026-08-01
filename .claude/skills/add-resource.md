---
name: add-resource
description: Use when the user wants to add a new domain entity, resource, or CRUD endpoint to an Express app built on the expressApp template.
---

# Add Resource

## Overview

Scaffolds a complete domain resource — type, schema, repository, service, controller, and route — following the established pattern in this codebase. Use the `Movie` files as the reference for every file you create.

**Announce at start:** "I'm using the add-resource skill to scaffold the new resource."

## When to Use

When the user asks to:
- Add a new entity (e.g. "add a Product resource")
- Create CRUD endpoints for a new domain object
- Scaffold a new feature following the existing layered pattern

## What to Ask First

If not already provided, ask:
- **Entity name** (e.g. `Product`) — must be PascalCase
- **Fields** — name and TypeScript type for each (e.g. `name: string`, `price: number`, `inStock: boolean`)

## Files to Create

Replace `{Name}` with PascalCase entity name, `{name}` with camelCase throughout.

### 1. `src/types/{Name}.ts`
```typescript
import { IEntity } from "./repositories"

export interface {Name}Entity extends IEntity {
    // fields here
}
```

### 2. `src/entities/{Name}.schema.ts`
Follow `src/entities/Movie.schema.ts` exactly.
- Import the entity type from `src/types/{Name}.ts`
- Define a Mongoose schema with all fields marked `required: true` unless optional
- Export `{Name}Model`

### 3. `src/repositories/{Name}.repository.ts`
```typescript
import { {Name}Entity } from '../types/{Name}'
import { Repository } from './Repository'

export class {Name}Repository<T extends {Name}Entity = {Name}Entity> extends Repository<T> {}
```

### 4. `src/services/{Name}Service.ts`
Follow `src/services/movieService.ts` exactly.
- Singleton with `getInstance()`
- Inject repository via constructor
- Implement at minimum: `getAll()`, `getList(queryParams)`, `create(data)`
- Use `@loggedMethod` decorator on each method

### 5. `src/controllers/{Name}Controller.ts`
Follow `src/controllers/movieController.ts` exactly.
- Singleton with `getInstance()`
- One method per route handler
- Always wrap in `try/catch`, call `next(e)` on error
- Use `@loggedMethod` decorator on each method

### 6. `src/routes/{name}.ts`
Follow `src/routes/movie.ts` exactly.
- Use `requireJwt` and `verifyPrivileges` on all protected routes
- Add full Swagger JSDoc `@swagger` comment blocks for each route

## Files to Update

### `src/types/repositories.ts`
1. Add import at top: `import { {Name}Entity } from './{Name}'`
2. Add interface below the `[EXAMPLE]` block:
   ```typescript
   export interface I{Name}Repository<T extends {Name}Entity = {Name}Entity> extends IRepository<T> {}
   ```
3. Add to `IRepositories` under `[BUSINESS]`:
   ```typescript
   {Name}?: I{Name}Repository<{Name}Entity>
   ```

### `src/repositories/index.ts`
1. Add imports at top: `{Name}Model` from entities, `{Name}Repository` from repositories
2. In the `mongo` switch case under `[BUSINESS]`:
   ```typescript
   this.repositories.{Name} = new {Name}Repository({Name}Model)
   ```
3. Add export at bottom under `[BUSINESS]`:
   ```typescript
   export const {name}Repository = repositories.{Name}
   ```

### `src/routes/index.ts`
1. Add import at top: `import {name}Router from './{name}'`
2. Under the `[BUSINESS]` section:
   ```typescript
   router.use('/{name}', {name}Router)
   ```

## Verification

```bash
npm run build
```

Fix all TypeScript errors before declaring success. Do not skip this step.

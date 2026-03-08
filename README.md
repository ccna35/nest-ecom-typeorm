# nest-ecom-typeorm

A simple e-commerce API scaffold using **NestJS + Prisma + PostgreSQL**.

## What's included
- Resources: **users**, **categories**, **products**, **seller profiles**, **seller applications**
- Authentication with JWT and refresh tokens
- Role-based authorization (admin, customer, seller)
- PostgreSQL via `docker-compose.yml`
- Prisma ORM setup with migrations
- DTO validation with `class-validator`

## Run locally

1) Start Postgres
\`\`\`bash
docker compose up -d
\`\`\`

2) Install deps
\`\`\`bash
npm i
\`\`\`

3) Create `.env`
\`\`\`bash
cp .env.example .env
\`\`\`

4) Run Prisma migrations
\`\`\`bash
npx prisma migrate deploy
# or for development with reset:
npx prisma migrate dev
\`\`\`

5) Run API
\`\`\`bash
npm run start:dev
\`\`\`

API will be on `http://localhost:3000`.

## Prisma Commands

\`\`\`bash
# Generate Prisma Client after schema changes
npx prisma generate

# Create a new migration
npx prisma migrate dev --name <migration_name>

# Apply migrations to production
npx prisma migrate deploy

# Reset database (drops all data!)
npx prisma migrate reset

# Open Prisma Studio (database GUI)
npx prisma studio

# Format schema file
npx prisma format
\`\`\`

## Endpoints (basic)
- **Auth**: \`POST /auth/signup\`, \`POST /auth/login\`, \`POST /auth/refresh\`, \`POST /auth/logout\`
- **Users**: \`GET /users\`, \`GET /users/:id\`, \`POST /users\`, \`PATCH /users/:id\`, \`DELETE /users/:id\`
- **Categories**: \`GET /categories\`, \`GET /categories/:id\`, \`POST /categories\`, \`PATCH /categories/:id\`, \`DELETE /categories/:id\`
- **Products**: \`GET /products\`, \`GET /products/:id\`, \`POST /products\`, \`PATCH /products/:id\`, \`DELETE /products/:id\`
- **Seller Profiles**: \`GET /seller-profiles\`, \`GET /seller-profiles/me\`, \`PATCH /seller-profiles/me\`, \`GET /seller-profiles/:userId\`
- **Seller Applications**: \`POST /seller-applications\`, \`GET /seller-applications/me\`, \`GET /seller-applications\`, \`GET /seller-applications/:id\`, \`POST /seller-applications/:id/approve\`, \`POST /seller-applications/:id/reject\`

## Notes
- Passwords are hashed using bcrypt before storage
- JWT-based authentication with access tokens and refresh tokens
- Role-based access control (RBAC) using guards and decorators

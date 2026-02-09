# nest-ecom-typeorm

A simple e-commerce API scaffold using **NestJS + TypeORM + PostgreSQL**.

## What’s included
- Resources: **users**, **categories**, **products**
- PostgreSQL via `docker-compose.yml`
- TypeORM setup with env-based config
- DTO validation with `class-validator`

## Run locally

1) Start Postgres
```bash
docker compose up -d
```

2) Install deps
```bash
npm i
```

3) Create `.env`
```bash
cp .env.example .env
```

4) Run API
```bash
npm run start:dev
```

API will be on `http://localhost:3000`.

## Endpoints (basic)
- `GET /users` / `GET /users/:id` / `POST /users` / `PATCH /users/:id` / `DELETE /users/:id`
- `GET /categories` / `GET /categories/:id` / `POST /categories` / `PATCH /categories/:id` / `DELETE /categories/:id`
- `GET /products` / `GET /products/:id` / `POST /products` / `PATCH /products/:id` / `DELETE /products/:id`

## Notes
- Passwords are stored as `passwordHash` in the database (hashing is intentionally left as a TODO).
- `TYPEORM_SYNC=true` is convenient for dev. For production, turn it off and use migrations.

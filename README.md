# NestJS Microservices Platform

Production-style NestJS monorepo with an HTTP API Gateway, Auth and User microservices, PostgreSQL + TypeORM migrations, RabbitMQ for inter-service communication, Redis for gateway cache and token blacklist, Swagger, and consistent API responses.

## Architecture

```
Client
  │
  ▼
API Gateway :3000
  • REST + Swagger (`/api/docs`)
  • JWT auth, RBAC, DTO validation
  • Redis cache, rate limit, token blacklist
  │
  ├─ RabbitMQ `auth_queue` ──► Auth Service  ── PostgreSQL (`AUTH_POSTGRES_DATABASE`)
  └─ RabbitMQ `user_queue` ──► User Service  ── PostgreSQL (`USER_POSTGRES_DATABASE`)
```

Each service owns its database. The gateway never talks to PostgreSQL directly.

## Stack

| Area | Choice |
| --- | --- |
| Framework | NestJS 11 monorepo |
| Transport | RabbitMQ (`amqplib`) |
| Gateway extras | Redis cache, JWT blacklist, throttling |
| Database | PostgreSQL 17 + TypeORM (`synchronize: false`) |
| Docs | Swagger / OpenAPI |
| Validation | `class-validator` global pipe |
| Logging | Pino |
| Security | Helmet, CORS, bcryptjs (12 rounds), JWT access + refresh |

## Project layout

```
apps/
  api-gateway/src/
    app.module.ts                 root: config, redis, global guards/filters
    main.ts
    auth/                         HTTP auth feature
      auth.module.ts
      auth.controller.ts
      dto/  swagger/  guards/  strategies/
    users/                        HTTP users feature
    health/                       liveness + RabbitMQ/Redis readiness
    infrastructure/proxy/         RabbitMQ ClientProxy wrapper
  auth-service/src/
    app.module.ts                 root: config + TypeORM
    auth/                         message handlers + domain service
    database/                     entities, migrations, data-source
  user-service/src/
    app.module.ts
    users/
    database/
libs/
  common/                         envelopes, pipes, Redis, RMQ, env
  contracts/                      message patterns + payloads (auth/, users/)
  database/                       shared TypeORM factory
```

## What you need on the machine

| Tool | Why | Default port |
| --- | --- | --- |
| Node.js 20+ and npm | Run the three Nest apps | Gateway `3000`, Auth `3001`, Users `3002` |
| Docker Engine + Compose | Recommended way to run Postgres, RabbitMQ, Redis | — |
| PostgreSQL | Auth DB + Users DB | `5432` |
| RabbitMQ | Gateway ↔ microservice messages | AMQP `5672`, UI `15672` |
| Redis | Gateway cache + access-token blacklist | `6379` |

You can run Postgres, RabbitMQ, and Redis **all in Docker**, or mix Docker with services already installed locally. `.env` must match whichever host and credentials you actually use.

## 1. Install Node.js

**Ubuntu / Debian**

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v   # v20 or newer
npm -v
```

**macOS** (Homebrew)

```bash
brew install node@22
```

**Windows** — install the LTS build from [https://nodejs.org](https://nodejs.org).

## 2. Install Docker

Docker is the easiest way to start PostgreSQL, RabbitMQ, and Redis together.

**Ubuntu / Debian**

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker "$USER"
```

Log out and back in (or reboot) so the `docker` group applies. Until then, prefix Docker commands with `sudo`.

Check:

```bash
docker --version
docker compose version
```

**macOS / Windows** — install [Docker Desktop](https://docs.docker.com/get-docker/). It includes Compose.

Official docs: [Install Docker Engine](https://docs.docker.com/engine/install/).

## 3. Install RabbitMQ (optional, if you skip Docker)

Prefer Docker (`npm run docker:up`) unless you already run RabbitMQ on the host.

**Ubuntu / Debian**

```bash
sudo apt-get update
sudo apt-get install -y rabbitmq-server
sudo systemctl enable --now rabbitmq-server
sudo rabbitmq-plugins enable rabbitmq_management
```

Create a user that matches `.env` (`RABBITMQ_USER` / `RABBITMQ_PASSWORD`):

```bash
sudo rabbitmqctl add_user nest nest
sudo rabbitmqctl set_user_tags nest administrator
sudo rabbitmqctl set_permissions -p / nest ".*" ".*" ".*"
```

Management UI: http://localhost:15672

**macOS**

```bash
brew install rabbitmq
brew services start rabbitmq
```

If you use a local RabbitMQ instead of the container, do **not** start the `rabbitmq` service in Compose, or change `RABBITMQ_PORT` so the two do not collide on `5672`.

## 4. Clone, env, and install packages

There is one `.env` at the **project root**. Nest apps and `docker compose` both read it. Do not commit `.env`.

```bash
cd ~/Documents/Nodejs/Nestjs-Micro-Services
cp .env.example .env
npm install
```

Then edit `.env`. Put your own values. Compose and the Nest apps read the same keys.

If you already have local Postgres, Redis, or RabbitMQ, use those credentials. If you use Compose, keep the same keys in `.env`; Compose creates the two databases only on a fresh Postgres volume.

### Environment keys

**App / runtime**

- `NODE_ENV`
- `GATEWAY_PORT`
- `GATEWAY_GLOBAL_PREFIX`
- `SWAGGER_ENABLED`
- `CORS_ORIGIN`
- `AUTH_HTTP_PORT`
- `USER_HTTP_PORT`

**JWT** (gateway + auth)

- `JWT_ACCESS_SECRET`
- `JWT_ACCESS_EXPIRES_IN`
- `JWT_REFRESH_SECRET`
- `JWT_REFRESH_EXPIRES_IN`

**Admin** (auth)

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

**PostgreSQL** (auth + users + Compose)

- `POSTGRES_HOST`
- `POSTGRES_PORT`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `AUTH_POSTGRES_DATABASE`
- `USER_POSTGRES_DATABASE`

**RabbitMQ** (all apps + Compose)

- `RABBITMQ_HOST`
- `RABBITMQ_PORT`
- `RABBITMQ_USER`
- `RABBITMQ_PASSWORD`
- `RABBITMQ_VHOST`

**Redis + gateway limits** (gateway)

- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_PASSWORD`
- `REDIS_DB`
- `CACHE_TTL_SECONDS`
- `THROTTLE_TTL_SECONDS`
- `THROTTLE_LIMIT`

Who reads which keys:

- **API Gateway:** app/runtime gateway keys, JWT, Redis, throttle, CORS, Swagger, RabbitMQ
- **Auth Service:** JWT, admin keys, Postgres, `AUTH_POSTGRES_DATABASE`, RabbitMQ
- **User Service:** Postgres, `USER_POSTGRES_DATABASE`, RabbitMQ

## 5. Start infrastructure

From the project root (the folder that contains `docker-compose.yml`):

```bash
npm run docker:up
# equivalent: docker compose up -d
```

Use `sudo npm run docker:up` if your user is not in the `docker` group yet.

This starts:

- `nest-postgres` — PostgreSQL 17
- `nest-rabbitmq` — RabbitMQ 4 + management UI
- `nest-redis` — Redis 7

Stop the stack (volumes are kept):

```bash
npm run docker:down
```

### Port already in use

If Docker prints `failed to bind host port ... address already in use`, a local service already owns that port.

| Port | Typical owner |
| --- | --- |
| `5432` | Local PostgreSQL |
| `5672` / `15672` | Local RabbitMQ |
| `6379` | Local Redis |

Either stop the local service:

```bash
sudo systemctl stop postgresql
sudo systemctl stop rabbitmq-server
sudo systemctl stop redis
# then
npm run docker:up
```

Or keep the local service and start only what you still need, for example RabbitMQ only:

```bash
docker compose up -d rabbitmq
```

In that case `.env` must point at the local Postgres/Redis (`localhost` and those credentials).

Changing `POSTGRES_USER` or database names after the first `docker:up` does **not** update an existing volume. Recreate Postgres data once if credentials changed:

```bash
docker compose down
docker volume rm nestjs-micro-services_postgres_data
npm run docker:up
```

## 6. Databases and migrations

Create both schemas (run from the project root, with Postgres reachable):

```bash
npm run migration:run
```

Other commands:

```bash
npm run migration:auth:run
npm run migration:users:run
npm run migration:auth:generate -- apps/auth-service/src/database/migrations/AddSomething
npm run migration:auth:revert
```

Never enable TypeORM `synchronize`. Schema changes go through migrations. After pulling new migration files, run `npm run migration:run` again so pending indexes apply.

## 7. Run the apps

```bash
npm run start:dev
```

That watches the API Gateway, Auth Service, and User Service together. Stop with `Ctrl+C`.

| URL | What |
| --- | --- |
| http://localhost:3000/api | API |
| http://localhost:3000/api/docs | Swagger |
| http://localhost:3000/api/health | Gateway + RabbitMQ + Redis health |
| http://localhost:15672 | RabbitMQ UI (user/password from `.env`) |

Log in at `/api/docs`, then use **Authorize** and paste the access token.

## Auth on local

Register always creates role `user`. Set `ADMIN_EMAIL` (and `ADMIN_PASSWORD` if the user does not exist yet) in `.env` and restart `start:dev`. Auth Service promotes that email or creates the account. Log in again so the new access token has role `admin`.

## Useful scripts

| Script | Purpose |
| --- | --- |
| `npm run start:dev` | Watch all three apps |
| `npm run start:gateway` | Gateway only |
| `npm run start:auth` | Auth service only |
| `npm run start:users` | User service only |
| `npm run migration:run` | Apply both service migrations |
| `npm run docker:up` | Start PostgreSQL, RabbitMQ, and Redis |
| `npm run docker:down` | Stop Compose containers (keep volumes) |

## Industry practices included

- Database-per-service and explicit TypeORM migrations
- Shared contracts library instead of leaking entities across services
- Dedicated RabbitMQ queues per service
- Global validation pipe with whitelist / forbidNonWhitelisted
- Exception filters that never leak stack traces in production
- Request IDs on every response
- Soft deletes on user profiles
- Refresh-token rotation and hashed token storage
- Redis-backed gateway cache and access-token blacklist
- Structured logging and health checks

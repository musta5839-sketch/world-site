# World Site

World Site is an Express application with a PostgreSQL-backed authentication API and a static web interface.

## Features

- User registration and login
- JWT-based authentication
- Authenticated user profile endpoint
- PostgreSQL database integration
- Health and readiness endpoints
- Static frontend assets
- Automated tests and coverage checks
- Dependency security audits

## Requirements

- Node.js 24
- npm
- PostgreSQL

## Installation

```bash
git clone git@github.com:musta5839-sketch/world-site.git
cd world-site
npm ci
```

## Environment configuration

Create a local environment file:

```bash
cp .env.example .env
```

Configure the values in `.env` for your environment.

| Variable | Description |
|---|---|
| `NODE_ENV` | Application environment |
| `PORT` | HTTP server port |
| `DATABASE_URL` | PostgreSQL connection string |
| `TEST_DATABASE_URL` | PostgreSQL test database connection string |
| `JWT_SECRET` | Secret used to sign JWTs |
| `JWT_EXPIRES_IN` | JWT expiration duration |

Use a strong, unique `JWT_SECRET` in production. Do not commit `.env` or other files containing secrets.

## Database

Create a PostgreSQL database and configure `DATABASE_URL` before applying migrations.

Apply pending migrations:

```bash
npm run db:migrate
```

To roll back the latest migration:

```bash
npm run db:rollback
```

To create a new migration file:

```bash
npm run db:create -- <migration-name>
```

## Running the application

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

The default configured port is `3000`.

## API

### Authentication

| Method | Endpoint | Description | Success |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a user | `201` |
| `POST` | `/api/auth/login` | Authenticate a user | `200` |
| `GET` | `/api/auth/me` | Get the authenticated user | `200` |

Registration request:

```json
{
  "email": "user@example.com",
  "password": "StrongPassword123!",
  "name": "Example User"
}
```

Login request:

```json
{
  "email": "user@example.com",
  "password": "StrongPassword123!"
}
```

Successful login returns a user object and a bearer token:

```json
{
  "status": "success",
  "success": true,
  "data": {
    "user": {},
    "token": "<jwt>",
    "tokenType": "Bearer",
    "expiresIn": "15m"
  }
}
```

The token expiration is controlled by `JWT_EXPIRES_IN`, defaulting to `15m`.

To access the current-user endpoint, provide:

```http
Authorization: Bearer <jwt>
```

Authentication endpoints are rate-limited. The current-user endpoint requires a valid token.

### Health and readiness

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Reports application health |
| `GET` | `/api/ready` | Checks application readiness and database connectivity |

`/api/health` reports whether the application is responding.

`/api/ready` checks database connectivity and can return `503` when the application is shutting down.

## Testing

Run the test suite:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

## Security audits

Audit all dependencies:

```bash
npm run audit:full
```

Audit production dependencies:

```bash
npm run audit:prod
```

## Continuous integration

GitHub Actions runs the quality and security workflow for pushes and pull requests targeting `master`.

The workflow installs dependencies, runs dependency audits, applies database migrations, executes tests, and verifies coverage thresholds.

## License

No license has been specified yet.

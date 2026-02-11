# Vulnerable Node - Rehabilitated

A Node.js e-commerce application that was intentionally vulnerable, now rehabilitated to production-ready secure state.

## Tech Stack

- **Runtime**: Node.js 22 LTS
- **Framework**: Express 4.21
- **Database**: PostgreSQL 16
- **Template Engine**: EJS 3.x with ejs-mate
- **Security**: Helmet, Argon2, CSRF protection, Zod validation
- **Logging**: Winston structured logging
- **Testing**: Jest + Supertest

## Security Features

- Parameterized SQL queries (SQL injection prevention)
- Argon2id password hashing
- HTTP security headers (Helmet)
- CSRF token protection on all forms
- Input validation with Zod schemas
- Secure session management (httpOnly, sameSite, 24h expiry)
- Rate limiting (login: 5/15min, API: 100/15min)
- XSS prevention (escaped EJS output)
- Open redirect prevention

## Quick Start

### With Docker (Recommended)
```bash
docker-compose up --build
```
App available at http://localhost:3000

### Manual Setup
```bash
# Install dependencies
npm install

# Copy environment config
cp .env.example .env

# Start PostgreSQL (must be running)
# Edit .env with your DATABASE_URL

# Start app
npm start
```

## Default Credentials

- Username: `admin` / Password: `admin`
- Username: `roberto` / Password: `asdfpiuw981`

## Testing

```bash
npm test              # Run all tests
npm run test:unit     # Unit tests only
npm run test:integration  # Integration tests
npm run test:e2e      # End-to-end tests
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/login` | No | Login page |
| POST | `/login/auth` | No | Authenticate |
| GET | `/logout` | No | Logout |
| GET | `/` | Yes | Product list |
| GET | `/products/detail?id=N` | Yes | Product detail |
| GET | `/products/search?q=term` | Yes | Search products |
| POST | `/products/buy` | Yes | Purchase product |
| GET | `/products/purchased` | Yes | Purchase history |
| GET | `/health` | No | Health check |

## Project Structure

```
├── app.js                    # Express application
├── bin/www                   # HTTP server entry point
├── config.js                 # Environment configuration
├── model/                    # Database models
│   ├── db.js                # Shared DB connection
│   ├── auth.js              # Authentication (argon2)
│   ├── init_db.js           # DB initialization
│   └── products.js          # Product queries
├── routes/                   # Express routes
│   ├── login.js             # Auth routes
│   ├── login_check.js       # Auth middleware
│   └── products.js          # Product routes
├── src/
│   ├── infrastructure/
│   │   ├── security/        # PasswordHasher (argon2)
│   │   └── logging/         # Winston logger
│   └── interface/http/
│       ├── middleware/       # requestId, rateLimiter
│       ├── validators/      # Zod schemas
│       └── routes/          # Health check
├── views/                    # EJS templates
├── public/                   # Static assets
├── tests/                    # Jest tests
├── design/                   # Architecture docs
└── docs/                     # Fix documentation
```

## Rehabilitation History

This project was originally [vulnerable-node](https://github.com/cr0hn/vulnerable-node), an intentionally vulnerable application. It has been rehabilitated as part of a Software Engineering course project.

### Vulnerabilities Fixed
- 6 SQL injection points (parameterized queries)
- Plaintext passwords (Argon2id hashing)
- XSS in all templates (escaped output)
- CSRF on all forms (token protection)
- Insecure session (hardened configuration)
- Open redirect (URL sanitization)
- Missing security headers (Helmet)
- Outdated dependencies (all updated)
- Missing input validation (Zod schemas)
- Missing rate limiting (express-rate-limit)

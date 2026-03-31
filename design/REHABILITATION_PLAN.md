# Plan de Rehabilitación: Vulnerable-Node
## Staff Software Engineer - Modernización Incremental

**Proyecto**: Course Project - Staff Software Engineer Simulation
**Equipo**: Engineering Squad (Parejas)
**Contexto**: Sistema legado intencionalmente vulnerable → Sistema seguro y productivo
**Fecha**: 2026-02-10
**Versión**: 1.0

---

## 📋 RESUMEN EJECUTIVO

### Estado Actual del Proyecto

Este es un proyecto educativo **intencionalmente vulnerable** que contiene vulnerabilidades OWASP Top 10 para enseñar:
- Análisis de código inseguro
- Testing de herramientas de seguridad
- Pentesting training

**Delivery 1 (Completado)**: Discovery & Reverse Engineering
- ✅ Context Map (estructura del codebase)
- ✅ User Stories (trazabilidad)
- ✅ DevEx Audit (onboarding friction points)

**Próximos Deliverables**: Rehabilitación incremental del sistema

### Vulnerabilidades Críticas Identificadas (OWASP Top 10)

| ID | Categoría | Instancias | Ubicación Principal | Severidad |
|---|---|---|---|---|
| A1 | **SQL Injection** | 6 | `model/auth.js`, `model/products.js` | 🔴 CRÍTICA |
| A2 | **Broken Authentication** | 3 | `model/auth.js`, `app.js` | 🔴 CRÍTICA |
| A6 | **Sensitive Data Exposure** | 2 | `model/init_db.js` (plaintext passwords) | 🔴 CRÍTICA |
| A5 | **Security Misconfiguration** | 4 | `app.js` (session config) | 🟠 ALTA |
| A8 | **CSRF** | Multiple | Routes sin protección | 🟠 ALTA |
| A3 | **XSS** | Potential | Views sin sanitización | 🟡 MEDIA |
| A10 | **Unvalidated Redirects** | 2 | `routes/login.js` | 🟡 MEDIA |

### Dependencias Obsoletas

```
EXPRESS        4.13.1  →  5.0.0     (10 años desactualizado)
log4js         0.6.36  →  6.9.1     (RCE vulnerability CVE-2022-21704)
ejs            2.4.2   →  3.1.10    (XSS vulnerabilities)
pg-promise     4.4.6   →  11.10.4   (Sin protecciones SQL injection)
express-session 1.13.0 →  1.18.1   (Session fixation)
Node.js        19.4.0  →  22.x LTS  (EOL sin soporte)
```

---

## 🎯 ESTRATEGIA DE IMPLEMENTACIÓN

### Principios Guía

1. **Incremental Refactoring**: Implementación por fases sin reescribir todo de una vez
2. **Backwards Compatibility**: Mantener funcionalidad existente durante la transición
3. **Test-Driven Security**: Validar cada fix con tests específicos
4. **Clean Architecture**: Separación gradual de responsabilidades
5. **Documentation First**: Documentar antes de implementar

### Arquitectura Objetivo: Clean Architecture (Hexagonal)

```
src/
├── domain/              # Business Logic (sin dependencias externas)
│   ├── entities/        # User, Product, Purchase
│   ├── repositories/    # Interfaces (contratos)
│   └── use-cases/       # LoginUseCase, PurchaseProductUseCase, etc.
│
├── infrastructure/      # Frameworks & Drivers
│   ├── database/        # PostgreSQL repositories
│   ├── security/        # PasswordHasher, SessionManager
│   └── config/          # Database, session, environment config
│
└── interface/           # Controllers & Routes
    ├── http/
    │   ├── routes/      # Express routes
    │   ├── controllers/ # HTTP controllers
    │   ├── middleware/  # Auth, validation, error handling
    │   └── validators/  # Zod schemas
    └── views/           # EJS templates (sin cambios)
```

---

## 📅 PLAN DE IMPLEMENTACIÓN POR FASES

### **FASE 1: Setup & Foundation** (Prioridad P0)
**Objetivo**: Preparar el entorno para modernización sin romper funcionalidad actual
**Duración Estimada**: 2-3 días

#### 1.1 Actualizar Dependencias Críticas
**Archivos**:
- `package.json`
- `package-lock.json`

**Tareas**:
- [ ] Actualizar Node.js a 22.x LTS (Dockerfile + local environment)
- [ ] Actualizar Express 4.13.1 → 5.0.0
- [ ] Actualizar pg-promise 4.4.6 → 11.10.4
- [ ] Actualizar log4js 0.6.36 → 6.9.1 (Fix CVE-2022-21704)
- [ ] Actualizar EJS 2.4.2 → 3.1.10
- [ ] Actualizar express-session 1.13.0 → 1.18.1
- [ ] Agregar nuevas dependencias:
  - `argon2` (password hashing)
  - `zod` (validation)
  - `helmet` (security headers)
  - `express-rate-limit` (brute-force protection)
  - `winston` (structured logging)
- [ ] Ejecutar `npm audit fix` y resolver vulnerabilidades restantes
- [ ] Verificar que la app sigue funcionando con `npm start`

**Testing**:
```bash
# Smoke test: verificar que el servidor inicia
npm start
curl http://localhost:3000/login  # Debe retornar 200 OK

# Verificar login funcional (credenciales: admin/admin)
curl -X POST http://localhost:3000/login/auth \
  -d "username=admin&password=admin" -L
```

**Salida**: Servidor funcional con dependencias actualizadas

---

#### 1.2 Migración a ES Modules (ESM)
**Archivos**:
- `package.json` (agregar `"type": "module"`)
- Todos los `.js` files

**Tareas**:
- [ ] Agregar `"type": "module"` a `package.json`
- [ ] Cambiar todos los `require()` → `import`
- [ ] Cambiar todos los `module.exports` → `export`
- [ ] Agregar `.js` extensions en imports relativos
- [ ] Reemplazar `__dirname` con:
  ```javascript
  import { fileURLToPath } from 'url';
  import { dirname } from 'path';
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  ```
- [ ] Verificar que todo funciona con `npm start`

**Justificación**: ES Modules es el estándar moderno, permite tree-shaking, mejor performance, y compatibilidad con herramientas modernas.

**Testing**:
```bash
npm start  # Debe iniciar sin errores
# Verificar login/productos funcionan
```

**Salida**: Codebase modernizado con ES Modules

---

#### 1.3 Configuración de Variables de Entorno
**Archivos**:
- `.env.example` (nuevo)
- `.env` (nuevo, gitignored)
- `config.js` (refactorizar)
- `.gitignore` (agregar `.env`)

**Tareas**:
- [ ] Crear `.env.example`:
  ```bash
  NODE_ENV=development
  PORT=3000
  DB_HOST=localhost
  DB_PORT=5432
  DB_NAME=vulnerablenode
  DB_USER=postgres
  DB_PASSWORD=postgres
  SESSION_SECRET=generate_with_openssl_rand_base64_32
  SESSION_MAX_AGE=86400000
  LOG_LEVEL=info
  ```
- [ ] Crear `.env` real (copiar de `.env.example`)
- [ ] Generar `SESSION_SECRET` seguro:
  ```bash
  openssl rand -base64 32
  ```
- [ ] Agregar `.env` a `.gitignore`
- [ ] Instalar `dotenv`: `npm install dotenv`
- [ ] Refactorizar `config.js` para leer de `.env`:
  ```javascript
  import dotenv from 'dotenv';
  dotenv.config();

  export const config = {
    database: {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    },
    session: {
      secret: process.env.SESSION_SECRET,
      maxAge: parseInt(process.env.SESSION_MAX_AGE)
    },
    server: {
      port: process.env.PORT || 3000,
      nodeEnv: process.env.NODE_ENV || 'development'
    }
  };
  ```

**Testing**:
```bash
# Verificar que lee variables correctamente
node -e "import('./config.js').then(c => console.log(c.config))"
```

**Salida**: Configuración externalizada y segura

---

#### 1.4 Crear Estructura de Carpetas (Clean Architecture)
**Tareas**:
- [ ] Crear carpetas:
  ```bash
  mkdir -p src/domain/entities
  mkdir -p src/domain/repositories
  mkdir -p src/domain/use-cases/authentication
  mkdir -p src/domain/use-cases/products
  mkdir -p src/infrastructure/database/postgres
  mkdir -p src/infrastructure/security
  mkdir -p src/infrastructure/logging
  mkdir -p src/infrastructure/config
  mkdir -p src/interface/http/routes
  mkdir -p src/interface/http/controllers
  mkdir -p src/interface/http/middleware
  mkdir -p src/interface/http/validators
  mkdir -p src/interface/views
  mkdir -p tests/unit/domain
  mkdir -p tests/integration
  mkdir -p tests/e2e
  ```
- [ ] Copiar archivos existentes a `src/interface/views/` (EJS templates)
- [ ] Copiar `public/` a `src/interface/public/`

**Testing**: Verificar carpetas creadas con `ls -R src/`

**Salida**: Estructura preparada para Clean Architecture

---

### **FASE 2: Security Foundations** (Prioridad P0)
**Objetivo**: Eliminar vulnerabilidades críticas sin cambiar la arquitectura completa
**Duración Estimada**: 3-4 días

#### 2.1 Fix: SQL Injection en Authentication (A1)
**Archivos**:
- `model/auth.js` (refactorizar completamente)

**Problema Actual**:
```javascript
// ❌ VULNERABLE
var q = "SELECT * FROM users WHERE name = '" + username + "' AND password ='" + password + "';";
// Attack: username = "admin' OR '1'='1' --"
```

**Solución**:
- [ ] Reescribir `model/auth.js` con queries parametrizadas:
  ```javascript
  import pgp from 'pg-promise';

  export class AuthModel {
    constructor(db) {
      this.db = db;
    }

    async authenticateUser(username, plainPassword) {
      // ✅ SEGURO: Parameterized query
      const query = 'SELECT id, name, password FROM users WHERE name = $1';
      const user = await this.db.oneOrNone(query, [username]);

      if (!user) {
        return null; // User not found
      }

      // Verificar password (aún en plaintext por ahora, se arreglará en 2.2)
      if (user.password === plainPassword) {
        return { id: user.id, username: user.name };
      }

      return null;
    }
  }
  ```
- [ ] Actualizar `routes/login.js` para usar el nuevo modelo

**Testing**:
```bash
# Test 1: Login válido debe funcionar
curl -X POST http://localhost:3000/login/auth \
  -d "username=admin&password=admin" -c cookies.txt

# Test 2: SQL Injection debe fallar
curl -X POST http://localhost:3000/login/auth \
  -d "username=admin' OR '1'='1' --&password=anything" -v
# Debe retornar 401 Unauthorized
```

**Salida**: SQL Injection en login bloqueado

---

#### 2.2 Fix: Plaintext Passwords (A6)
**Archivos**:
- `model/init_db.js` (migración de datos)
- `model/auth.js` (integrar password hashing)

**Problema Actual**:
- Passwords almacenados en texto plano en base de datos
- No hay hashing de ningún tipo

**Solución**:
- [ ] Instalar Argon2: `npm install argon2`
- [ ] Crear `src/infrastructure/security/PasswordHasher.js`:
  ```javascript
  import argon2 from 'argon2';

  export class PasswordHasher {
    static async hash(plainPassword) {
      return await argon2.hash(plainPassword, {
        type: argon2.argon2id,
        memoryCost: 65536, // 64 MiB
        timeCost: 3,
        parallelism: 4
      });
    }

    static async verify(plainPassword, hash) {
      try {
        return await argon2.verify(hash, plainPassword);
      } catch (error) {
        return false; // Timing-safe: siempre retornar false en error
      }
    }
  }
  ```

- [ ] Migrar base de datos:
  - Agregar columna `password_hash` a tabla `users`
  - Generar hashes para passwords existentes
  - Eliminar columna `password` antigua

  ```sql
  -- Migration script
  ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);

  -- Hashear passwords existentes (ejecutar desde Node.js)
  -- UPDATE users SET password_hash = argon2_hash(password) WHERE password_hash IS NULL;

  -- Después de verificar que todo funciona:
  -- ALTER TABLE users DROP COLUMN password;
  ```

- [ ] Actualizar `model/auth.js`:
  ```javascript
  import { PasswordHasher } from '../infrastructure/security/PasswordHasher.js';

  async authenticateUser(username, plainPassword) {
    const query = 'SELECT id, name, password_hash FROM users WHERE name = $1';
    const user = await this.db.oneOrNone(query, [username]);

    if (!user) {
      return null;
    }

    // ✅ Verificar password con Argon2
    const isValid = await PasswordHasher.verify(plainPassword, user.password_hash);

    if (isValid) {
      return { id: user.id, username: user.name };
    }

    return null;
  }
  ```

**Testing**:
```bash
# Crear usuario de prueba con password hasheado
node -e "
import { PasswordHasher } from './src/infrastructure/security/PasswordHasher.js';
const hash = await PasswordHasher.hash('TestPassword123!');
console.log(hash);
"

# Verificar login con nuevo sistema
curl -X POST http://localhost:3000/login/auth \
  -d "username=testuser&password=TestPassword123!" -c cookies.txt
```

**Salida**: Passwords hasheados con Argon2, no más texto plano

---

#### 2.3 Fix: SQL Injection en Products (A1)
**Archivos**:
- `model/products.js`

**Problema Actual**:
```javascript
// ❌ 4 SQL Injections en este archivo
getProduct(product_id) {
  var q = "SELECT * FROM products WHERE id='" + product_id + "'";
}

search(query) {
  var q = "SELECT * FROM products WHERE name LIKE '%" + query + "%'";
}

purchase(cart) {
  var q = "INSERT INTO purchases VALUES ('" + cart.name + "', '" + cart.address + "', '" + cart.username + "', ...)";
}
```

**Solución**:
- [ ] Reescribir todas las funciones con parameterized queries:
  ```javascript
  export class ProductsModel {
    constructor(db) {
      this.db = db;
    }

    async getProduct(productId) {
      // ✅ SEGURO
      const query = 'SELECT * FROM products WHERE id = $1';
      return await this.db.oneOrNone(query, [productId]);
    }

    async search(searchQuery) {
      // ✅ SEGURO
      const query = 'SELECT * FROM products WHERE name ILIKE $1';
      const likePattern = `%${searchQuery}%`;
      return await this.db.any(query, [likePattern]);
    }

    async purchase(cart) {
      // ✅ SEGURO - usar transaction para garantizar atomicidad
      return await this.db.tx(async t => {
        const purchaseQuery = `
          INSERT INTO purchases (name, address, username, products, credit_card, credit_card_name, cvv, shipping_zip, shipping_state)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING id
        `;
        return await t.one(purchaseQuery, [
          cart.name,
          cart.address,
          cart.username,
          JSON.stringify(cart.products),
          cart.credit_card,
          cart.credit_card_name,
          cart.cvv,
          cart.shipping_zip,
          cart.shipping_state
        ]);
      });
    }

    async getUserPurchases(username) {
      // ✅ SEGURO
      const query = 'SELECT * FROM purchases WHERE username = $1 ORDER BY id DESC';
      return await this.db.any(query, [username]);
    }
  }
  ```

**Testing**:
```bash
# Test: Search con caracteres especiales no debe causar SQL injection
curl "http://localhost:3000/products/search?q=laptop' OR '1'='1" \
  -b cookies.txt
# Debe retornar solo productos que coincidan, no todos

# Test: Product detail con ID malicioso
curl "http://localhost:3000/products/detail?id=1' OR '1'='1" \
  -b cookies.txt
# Debe retornar error o producto válido, no bypass
```

**Salida**: Todas las SQL injections bloqueadas

---

#### 2.4 Fix: Broken Session Management (A2)
**Archivos**:
- `app.js` (session configuration)

**Problema Actual**:
```javascript
app.use(session({
  secret: 'ñasddfilhpaf78h78032h780g780fg780asg780dsbovncubuyvqy', // ❌ Hardcoded
  cookie: {
    secure: false,      // ❌ Not HTTPS
    maxAge: 99999999999 // ❌ ~3 años de expiración
  }
}));
```

**Solución**:
- [ ] Instalar `connect-pg-simple` para session storage en PostgreSQL:
  ```bash
  npm install connect-pg-simple
  ```

- [ ] Actualizar `app.js`:
  ```javascript
  import session from 'express-session';
  import connectPgSimple from 'connect-pg-simple';
  import { config } from './config.js';

  const PgSession = connectPgSimple(session);

  app.use(session({
    store: new PgSession({
      pool: dbPool,              // PostgreSQL connection pool
      tableName: 'session',
      createTableIfMissing: true
    }),
    secret: config.session.secret, // ✅ From environment
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.server.nodeEnv === 'production', // ✅ HTTPS en producción
      httpOnly: true,              // ✅ Previene XSS
      maxAge: 24 * 60 * 60 * 1000, // ✅ 24 horas
      sameSite: 'strict'           // ✅ CSRF protection
    },
    name: 'sessionId' // ✅ No usar default "connect.sid"
  }));
  ```

**Testing**:
```bash
# Verificar que sessions se almacenan en PostgreSQL
psql -U postgres -d vulnerablenode -c "SELECT * FROM session;"

# Verificar cookie settings
curl -X POST http://localhost:3000/login/auth \
  -d "username=admin&password=admin" -v | grep -i "set-cookie"
# Debe incluir HttpOnly, SameSite=Strict
```

**Salida**: Session management seguro

---

#### 2.5 Implementar Security Headers (A5)
**Archivos**:
- `app.js`

**Tareas**:
- [ ] Instalar Helmet: `npm install helmet`
- [ ] Agregar security headers en `app.js`:
  ```javascript
  import helmet from 'helmet';

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"], // EJS inline styles
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: 'same-origin' }
  }));
  ```

**Testing**:
```bash
curl -I http://localhost:3000/login | grep -E "(X-Frame-Options|X-Content-Type-Options|Strict-Transport-Security)"
# Debe retornar security headers
```

**Salida**: Security headers configurados

---

### **FASE 3: Input Validation & Sanitization** (Prioridad P1)
**Objetivo**: Prevenir XSS, CSRF, y validar todo input del usuario
**Duración Estimada**: 2-3 días

#### 3.1 Implementar Validación con Zod
**Archivos**:
- `src/interface/http/validators/authValidators.js` (nuevo)
- `src/interface/http/validators/productValidators.js` (nuevo)
- `routes/login.js` (actualizar)
- `routes/products.js` (actualizar)

**Tareas**:
- [ ] Instalar Zod: `npm install zod`
- [ ] Crear validators:

**`src/interface/http/validators/authValidators.js`**:
```javascript
import { z } from 'zod';

export const LoginSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be at most 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain alphanumeric characters and underscores'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters')
});

export function validateLogin(req, res, next) {
  try {
    const validated = LoginSchema.parse(req.body);
    req.validatedBody = validated;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).render('login', {
        error: error.errors[0].message,
        returnurl: req.query.returnurl || '/products'
      });
    }
    next(error);
  }
}
```

**`src/interface/http/validators/productValidators.js`**:
```javascript
import { z } from 'zod';

export const ProductSearchSchema = z.object({
  q: z.string()
    .min(1, 'Search query cannot be empty')
    .max(100, 'Search query too long')
});

export const ProductIdSchema = z.object({
  id: z.coerce.number().int().positive()
});

export const PurchaseSchema = z.object({
  name: z.string().min(2).max(100),
  address: z.string().min(5).max(200),
  credit_card: z.string().regex(/^\d{16}$/, 'Invalid credit card format'),
  credit_card_name: z.string().min(2).max(100),
  cvv: z.string().regex(/^\d{3,4}$/, 'Invalid CVV'),
  shipping_zip: z.string().regex(/^\d{5}$/, 'Invalid ZIP code'),
  shipping_state: z.string().length(2, 'State must be 2 characters')
});
```

- [ ] Aplicar validators en routes:

**`routes/login.js`**:
```javascript
import { validateLogin } from '../src/interface/http/validators/authValidators.js';

router.post('/auth', validateLogin, async (req, res) => {
  // req.validatedBody contiene datos validados
  const { username, password } = req.validatedBody;
  // ... resto del código
});
```

**Testing**:
```bash
# Test: Username con caracteres inválidos
curl -X POST http://localhost:3000/login/auth \
  -d "username=admin' OR 1=1--&password=test"
# Debe retornar 400 Bad Request con mensaje de validación

# Test: Password muy corto
curl -X POST http://localhost:3000/login/auth \
  -d "username=admin&password=123"
# Debe retornar 400 Bad Request
```

**Salida**: Input validation completa

---

#### 3.2 Implementar CSRF Protection (A8)
**Archivos**:
- `app.js`
- `views/*.ejs` (agregar CSRF tokens)

**Tareas**:
- [ ] Instalar `csurf`: `npm install csurf`
- [ ] Configurar CSRF protection en `app.js`:
  ```javascript
  import csrf from 'csurf';

  const csrfProtection = csrf({ cookie: true });

  // Aplicar a todas las rutas POST/PUT/DELETE
  app.use(csrfProtection);

  // Agregar token a todas las vistas
  app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken();
    next();
  });
  ```

- [ ] Actualizar formularios en views:

**`views/login.ejs`**:
```html
<form method="POST" action="/login/auth">
  <input type="hidden" name="_csrf" value="<%= csrfToken %>">
  <!-- resto del formulario -->
</form>
```

**`views/products.ejs`** (formulario de compra):
```html
<form method="POST" action="/products/buy">
  <input type="hidden" name="_csrf" value="<%= csrfToken %>">
  <!-- resto del formulario -->
</form>
```

**Testing**:
```bash
# Test: Enviar POST sin CSRF token
curl -X POST http://localhost:3000/products/buy \
  -b cookies.txt \
  -d "product_id=1"
# Debe retornar 403 Forbidden

# Test: Enviar POST con CSRF token válido
# (Requiere obtener token primero desde la página)
```

**Salida**: CSRF protection implementado

---

#### 3.3 Sanitizar Output (XSS Prevention - A3)
**Archivos**:
- `views/*.ejs`

**Tareas**:
- [ ] Auditar todos los templates EJS
- [ ] Cambiar `<%- variable %>` (unescaped) a `<%= variable %>` (escaped)
- [ ] Excepciones: Solo usar `<%-` para HTML confiable generado por el servidor

**Archivos a revisar**:
- `views/login.ejs`
- `views/products.ejs`
- `views/product_detail.ejs`
- `views/search.ejs`
- `views/bought_products.ejs`

**Ejemplo de fix**:
```ejs
<!-- ❌ ANTES (XSS vulnerable) -->
<p>Welcome, <%- username %>!</p>
<p>Search results for: <%- searchQuery %></p>

<!-- ✅ DESPUÉS (XSS safe) -->
<p>Welcome, <%= username %>!</p>
<p>Search results for: <%= searchQuery %></p>
```

**Testing**:
```bash
# Test: XSS en search
curl "http://localhost:3000/products/search?q=<script>alert('XSS')</script>" \
  -b cookies.txt
# El script debe aparecer escaped en HTML: &lt;script&gt;...
```

**Salida**: XSS prevention en todas las vistas

---

### **FASE 4: Clean Architecture Refactoring** (Prioridad P2)
**Objetivo**: Separar responsabilidades y mejorar mantenibilidad
**Duración Estimada**: 4-5 días

#### 4.1 Crear Domain Entities
**Archivos**:
- `src/domain/entities/User.js` (nuevo)
- `src/domain/entities/Product.js` (nuevo)
- `src/domain/entities/Purchase.js` (nuevo)

**Tareas**:
- [ ] Crear entidades con validación integrada:

**`src/domain/entities/User.js`**:
```javascript
import { z } from 'zod';

export const UserSchema = z.object({
  id: z.number().int().positive().optional(),
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
  passwordHash: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional()
});

export class User {
  constructor(data) {
    const validated = UserSchema.parse(data);
    Object.assign(this, validated);
  }

  toSafeObject() {
    return {
      id: this.id,
      username: this.username,
      createdAt: this.createdAt
    }; // Never expose passwordHash
  }
}
```

**Testing**:
```javascript
import { User } from './src/domain/entities/User.js';

// Debe crear usuario válido
const user = new User({
  username: 'testuser',
  passwordHash: 'hashed_password'
});

// Debe lanzar error con datos inválidos
try {
  new User({ username: 'ab' }); // Too short
} catch (error) {
  console.log('Validation works:', error.message);
}
```

**Salida**: Entidades de dominio con validación

---

#### 4.2 Crear Repository Interfaces
**Archivos**:
- `src/domain/repositories/IUserRepository.js` (nuevo)
- `src/domain/repositories/IProductRepository.js` (nuevo)
- `src/domain/repositories/IPurchaseRepository.js` (nuevo)

**Tareas**:
- [ ] Definir interfaces (contratos) para repositorios:

**`src/domain/repositories/IUserRepository.js`**:
```javascript
export class IUserRepository {
  async findByUsername(username) {
    throw new Error('Method not implemented');
  }

  async findById(id) {
    throw new Error('Method not implemented');
  }

  async create(username, passwordHash) {
    throw new Error('Method not implemented');
  }

  async updatePassword(userId, newPasswordHash) {
    throw new Error('Method not implemented');
  }
}
```

**Salida**: Interfaces definidas (contratos)

---

#### 4.3 Implementar PostgreSQL Repositories
**Archivos**:
- `src/infrastructure/database/postgres/UserRepositoryPostgres.js` (nuevo)
- `src/infrastructure/database/postgres/ProductRepositoryPostgres.js` (nuevo)
- `src/infrastructure/database/postgres/PurchaseRepositoryPostgres.js` (nuevo)

**Tareas**:
- [ ] Implementar repositories que cumplen las interfaces:

**`src/infrastructure/database/postgres/UserRepositoryPostgres.js`**:
```javascript
import { IUserRepository } from '../../../domain/repositories/IUserRepository.js';
import { User } from '../../../domain/entities/User.js';

export class UserRepositoryPostgres extends IUserRepository {
  constructor(db) {
    super();
    this.db = db;
  }

  async findByUsername(username) {
    const query = `
      SELECT id, username, password_hash as "passwordHash",
             created_at as "createdAt", updated_at as "updatedAt"
      FROM users
      WHERE username = $1
    `;
    const result = await this.db.oneOrNone(query, [username]);

    if (!result) return null;

    return new User(result);
  }

  async findById(id) {
    const query = `
      SELECT id, username, password_hash as "passwordHash",
             created_at as "createdAt", updated_at as "updatedAt"
      FROM users
      WHERE id = $1
    `;
    const result = await this.db.oneOrNone(query, [id]);

    if (!result) return null;

    return new User(result);
  }

  async create(username, passwordHash) {
    const query = `
      INSERT INTO users (username, password_hash, created_at, updated_at)
      VALUES ($1, $2, NOW(), NOW())
      RETURNING id, username, created_at as "createdAt", updated_at as "updatedAt"
    `;
    const result = await this.db.one(query, [username, passwordHash]);

    return new User({
      ...result,
      passwordHash: passwordHash
    });
  }

  async updatePassword(userId, newPasswordHash) {
    const query = `
      UPDATE users
      SET password_hash = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING id
    `;
    return await this.db.one(query, [newPasswordHash, userId]);
  }
}
```

**Testing**:
```javascript
import { UserRepositoryPostgres } from './src/infrastructure/database/postgres/UserRepositoryPostgres.js';
import db from './config.js'; // Database connection

const userRepo = new UserRepositoryPostgres(db);

// Test: Find user
const user = await userRepo.findByUsername('admin');
console.log(user.toSafeObject());

// Test: Create user
const newUser = await userRepo.create('testuser', 'hashed_password');
console.log(newUser.toSafeObject());
```

**Salida**: Repositories implementados con queries seguras

---

#### 4.4 Crear Use Cases
**Archivos**:
- `src/domain/use-cases/authentication/LoginUseCase.js` (nuevo)
- `src/domain/use-cases/authentication/LogoutUseCase.js` (nuevo)
- `src/domain/use-cases/products/ListProductsUseCase.js` (nuevo)
- `src/domain/use-cases/products/SearchProductsUseCase.js` (nuevo)
- `src/domain/use-cases/products/PurchaseProductUseCase.js` (nuevo)

**Tareas**:
- [ ] Implementar use cases con lógica de negocio:

**`src/domain/use-cases/authentication/LoginUseCase.js`**:
```javascript
import { PasswordHasher } from '../../../infrastructure/security/PasswordHasher.js';

export class LoginUseCase {
  constructor(userRepository, logger) {
    this.userRepository = userRepository;
    this.logger = logger;
  }

  async execute(username, plainPassword) {
    try {
      // 1. Validate inputs
      if (!username || !plainPassword) {
        throw new Error('Username and password are required');
      }

      // 2. Find user
      const user = await this.userRepository.findByUsername(username);

      if (!user) {
        this.logger.warn(`Login attempt failed for non-existent user: ${username}`);
        throw new Error('Invalid credentials');
      }

      // 3. Verify password
      const isPasswordValid = await PasswordHasher.verify(plainPassword, user.passwordHash);

      if (!isPasswordValid) {
        this.logger.warn(`Login attempt failed for user: ${username} (wrong password)`);
        throw new Error('Invalid credentials');
      }

      // 4. Success
      this.logger.info(`User logged in successfully: ${username}`);
      return user.toSafeObject();

    } catch (error) {
      if (error.message === 'Invalid credentials') {
        throw error;
      }
      this.logger.error(`Login error for user ${username}:`, error);
      throw new Error('Authentication failed');
    }
  }
}
```

**Testing**:
```javascript
import { LoginUseCase } from './src/domain/use-cases/authentication/LoginUseCase.js';

const loginUseCase = new LoginUseCase(userRepository, logger);

// Test: Valid login
const user = await loginUseCase.execute('admin', 'correct_password');
console.log('Login successful:', user);

// Test: Invalid password
try {
  await loginUseCase.execute('admin', 'wrong_password');
} catch (error) {
  console.log('Login failed:', error.message); // "Invalid credentials"
}
```

**Salida**: Use cases implementados

---

#### 4.5 Refactorizar Controllers
**Archivos**:
- `src/interface/http/controllers/AuthController.js` (nuevo)
- `src/interface/http/controllers/ProductsController.js` (nuevo)
- `routes/login.js` (actualizar para usar AuthController)
- `routes/products.js` (actualizar para usar ProductsController)

**Tareas**:
- [ ] Crear controllers que usan use cases:

**`src/interface/http/controllers/AuthController.js`**:
```javascript
import { LoginUseCase } from '../../../domain/use-cases/authentication/LoginUseCase.js';
import { LogoutUseCase } from '../../../domain/use-cases/authentication/LogoutUseCase.js';

export class AuthController {
  constructor(userRepository, logger, sessionManager) {
    this.loginUseCase = new LoginUseCase(userRepository, logger);
    this.logoutUseCase = new LogoutUseCase(sessionManager, logger);
    this.logger = logger;
  }

  async login(req, res) {
    try {
      const { username, password } = req.validatedBody;

      const user = await this.loginUseCase.execute(username, password);

      // Create secure session
      req.session.regenerate((err) => {
        if (err) {
          this.logger.error('Session regeneration failed:', err);
          return res.status(500).json({ error: 'Authentication failed' });
        }

        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.logged = true;

        const returnUrl = req.query.returnurl || '/products';
        res.redirect(returnUrl);
      });

    } catch (error) {
      this.logger.warn('Login failed:', error.message);
      return res.status(401).render('login', {
        error: error.message,
        returnurl: req.query.returnurl || '/products'
      });
    }
  }

  async logout(req, res) {
    try {
      await this.logoutUseCase.execute(req.session);

      req.session.destroy((err) => {
        if (err) {
          this.logger.error('Session destruction failed:', err);
        }
        res.redirect('/login');
      });

    } catch (error) {
      this.logger.error('Logout failed:', error);
      res.redirect('/login');
    }
  }

  renderLoginPage(req, res) {
    if (req.session?.logged) {
      return res.redirect('/products');
    }
    res.render('login', {
      error: req.query.error || null,
      returnurl: req.query.returnurl || '/products'
    });
  }
}
```

- [ ] Actualizar routes para usar controllers:

**`routes/login.js`**:
```javascript
import express from 'express';
import { AuthController } from '../src/interface/http/controllers/AuthController.js';
import { validateLogin } from '../src/interface/http/validators/authValidators.js';

const router = express.Router();

// Dependency Injection
const authController = new AuthController(userRepository, logger, sessionManager);

router.get('/', (req, res) => authController.renderLoginPage(req, res));
router.post('/auth', validateLogin, (req, res) => authController.login(req, res));
router.get('/logout', (req, res) => authController.logout(req, res));

export default router;
```

**Testing**:
```bash
# Test completo del flujo refactorizado
npm start

# Login
curl -X POST http://localhost:3000/login/auth \
  -d "username=admin&password=admin" -c cookies.txt -L

# Access protected route
curl http://localhost:3000/products -b cookies.txt

# Logout
curl http://localhost:3000/logout -b cookies.txt -L
```

**Salida**: Controllers implementados con Clean Architecture

---

### **FASE 5: Testing & Quality Assurance** (Prioridad P2)
**Objetivo**: Garantizar calidad con tests automatizados
**Duración Estimada**: 3-4 días

#### 5.1 Setup Testing Framework
**Archivos**:
- `package.json` (agregar scripts de testing)
- `jest.config.js` (nuevo)

**Tareas**:
- [ ] Instalar Jest y Supertest:
  ```bash
  npm install --save-dev jest supertest @types/jest
  ```

- [ ] Crear `jest.config.js`:
  ```javascript
  export default {
    testEnvironment: 'node',
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
      'src/**/*.js',
      '!src/**/*.test.js'
    ],
    coverageThresholds: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    }
  };
  ```

- [ ] Agregar scripts a `package.json`:
  ```json
  {
    "scripts": {
      "test": "NODE_ENV=test jest --coverage",
      "test:watch": "jest --watch",
      "test:unit": "jest tests/unit",
      "test:integration": "jest tests/integration",
      "test:e2e": "jest tests/e2e"
    }
  }
  ```

**Salida**: Testing framework configurado

---

#### 5.2 Unit Tests: Domain Layer
**Archivos**:
- `tests/unit/domain/entities/User.test.js` (nuevo)
- `tests/unit/domain/use-cases/LoginUseCase.test.js` (nuevo)

**Tareas**:
- [ ] Crear unit tests para entities:

**`tests/unit/domain/entities/User.test.js`**:
```javascript
import { User } from '../../../../src/domain/entities/User.js';

describe('User Entity', () => {
  test('should create valid user', () => {
    const user = new User({
      id: 1,
      username: 'testuser',
      passwordHash: 'hashed_password'
    });

    expect(user.id).toBe(1);
    expect(user.username).toBe('testuser');
  });

  test('should reject invalid username', () => {
    expect(() => {
      new User({
        username: 'ab', // Too short
        passwordHash: 'hashed_password'
      });
    }).toThrow();
  });

  test('toSafeObject should not expose passwordHash', () => {
    const user = new User({
      username: 'testuser',
      passwordHash: 'secret_hash'
    });

    const safeObj = user.toSafeObject();
    expect(safeObj.passwordHash).toBeUndefined();
    expect(safeObj.username).toBe('testuser');
  });
});
```

- [ ] Crear unit tests para use cases:

**`tests/unit/domain/use-cases/LoginUseCase.test.js`**:
```javascript
import { LoginUseCase } from '../../../../src/domain/use-cases/authentication/LoginUseCase.js';
import { PasswordHasher } from '../../../../src/infrastructure/security/PasswordHasher.js';

describe('LoginUseCase', () => {
  let loginUseCase;
  let mockUserRepository;
  let mockLogger;

  beforeEach(() => {
    mockUserRepository = {
      findByUsername: jest.fn()
    };
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };
    loginUseCase = new LoginUseCase(mockUserRepository, mockLogger);
  });

  test('should authenticate valid user with correct password', async () => {
    const passwordHash = await PasswordHasher.hash('SecurePassword123!');
    const mockUser = {
      id: 1,
      username: 'admin',
      passwordHash: passwordHash,
      toSafeObject: () => ({ id: 1, username: 'admin' })
    };

    mockUserRepository.findByUsername.mockResolvedValue(mockUser);

    const result = await loginUseCase.execute('admin', 'SecurePassword123!');

    expect(result).toEqual({ id: 1, username: 'admin' });
    expect(mockLogger.info).toHaveBeenCalledWith('User logged in successfully: admin');
  });

  test('should reject invalid password', async () => {
    const passwordHash = await PasswordHasher.hash('CorrectPassword');
    const mockUser = {
      id: 1,
      username: 'admin',
      passwordHash: passwordHash
    };

    mockUserRepository.findByUsername.mockResolvedValue(mockUser);

    await expect(
      loginUseCase.execute('admin', 'WrongPassword')
    ).rejects.toThrow('Invalid credentials');

    expect(mockLogger.warn).toHaveBeenCalled();
  });

  test('should reject non-existent user', async () => {
    mockUserRepository.findByUsername.mockResolvedValue(null);

    await expect(
      loginUseCase.execute('nonexistent', 'password')
    ).rejects.toThrow('Invalid credentials');
  });

  test('should prevent SQL injection attempts', async () => {
    mockUserRepository.findByUsername.mockResolvedValue(null);

    await expect(
      loginUseCase.execute("admin' OR '1'='1' --", 'password')
    ).rejects.toThrow('Invalid credentials');
  });
});
```

**Testing**:
```bash
npm run test:unit
```

**Salida**: Unit tests implementados (>80% coverage)

---

#### 5.3 Integration Tests: Repositories
**Archivos**:
- `tests/integration/repositories/UserRepository.test.js` (nuevo)

**Tareas**:
- [ ] Crear integration tests con base de datos de test:

**`tests/integration/repositories/UserRepository.test.js`**:
```javascript
import { UserRepositoryPostgres } from '../../../src/infrastructure/database/postgres/UserRepositoryPostgres.js';
import { PasswordHasher } from '../../../src/infrastructure/security/PasswordHasher.js';
import db from '../../../config.js'; // Test database connection

describe('UserRepositoryPostgres Integration', () => {
  let userRepository;

  beforeAll(() => {
    userRepository = new UserRepositoryPostgres(db);
  });

  beforeEach(async () => {
    // Clean database before each test
    await db.none('DELETE FROM users WHERE username LIKE $1', ['test_%']);
  });

  afterAll(async () => {
    // Cleanup
    await db.none('DELETE FROM users WHERE username LIKE $1', ['test_%']);
  });

  test('should create and retrieve user', async () => {
    const passwordHash = await PasswordHasher.hash('TestPassword123!');

    // Create
    const createdUser = await userRepository.create('test_user', passwordHash);
    expect(createdUser.username).toBe('test_user');

    // Retrieve
    const retrievedUser = await userRepository.findByUsername('test_user');
    expect(retrievedUser.id).toBe(createdUser.id);
    expect(retrievedUser.username).toBe('test_user');
  });

  test('should return null for non-existent user', async () => {
    const user = await userRepository.findByUsername('nonexistent_user');
    expect(user).toBeNull();
  });

  test('should update password', async () => {
    const oldPasswordHash = await PasswordHasher.hash('OldPassword123!');
    const newPasswordHash = await PasswordHasher.hash('NewPassword123!');

    const user = await userRepository.create('test_user_update', oldPasswordHash);

    await userRepository.updatePassword(user.id, newPasswordHash);

    const updatedUser = await userRepository.findById(user.id);
    expect(updatedUser.passwordHash).toBe(newPasswordHash);
  });
});
```

**Testing**:
```bash
npm run test:integration
```

**Salida**: Integration tests implementados

---

#### 5.4 E2E Tests: Authentication Flow
**Archivos**:
- `tests/e2e/authentication.test.js` (nuevo)

**Tareas**:
- [ ] Crear E2E tests con Supertest:

**`tests/e2e/authentication.test.js`**:
```javascript
import request from 'supertest';
import app from '../../app.js'; // Express app

describe('Authentication E2E Tests', () => {
  test('should render login page', async () => {
    const response = await request(app).get('/login');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Login');
  });

  test('should login with valid credentials', async () => {
    const response = await request(app)
      .post('/login/auth')
      .send({ username: 'admin', password: 'admin' });

    expect(response.status).toBe(302); // Redirect
    expect(response.headers.location).toBe('/products');
  });

  test('should reject invalid credentials', async () => {
    const response = await request(app)
      .post('/login/auth')
      .send({ username: 'admin', password: 'wrong_password' });

    expect(response.status).toBe(401);
    expect(response.text).toContain('Invalid credentials');
  });

  test('should prevent SQL injection in login', async () => {
    const response = await request(app)
      .post('/login/auth')
      .send({ username: "admin' OR '1'='1' --", password: 'anything' });

    expect(response.status).toBe(401);
  });

  test('should require authentication for protected routes', async () => {
    const response = await request(app).get('/products');

    expect(response.status).toBe(302); // Redirect to login
    expect(response.headers.location).toContain('/login');
  });

  test('should logout successfully', async () => {
    // First login
    const agent = request.agent(app);
    await agent
      .post('/login/auth')
      .send({ username: 'admin', password: 'admin' });

    // Then logout
    const logoutResponse = await agent.get('/logout');

    expect(logoutResponse.status).toBe(302);
    expect(logoutResponse.headers.location).toBe('/login');

    // Verify session destroyed
    const protectedResponse = await agent.get('/products');
    expect(protectedResponse.status).toBe(302); // Redirected to login
  });
});
```

**Testing**:
```bash
npm run test:e2e
```

**Salida**: E2E tests implementados

---

#### 5.5 Smoke Tests Script
**Archivos**:
- `tests/smoke-test.sh` (nuevo)

**Tareas**:
- [ ] Crear script de smoke tests:

**`tests/smoke-test.sh`**:
```bash
#!/bin/bash

echo "🧪 Starting Smoke Tests..."
echo "=========================="

BASE_URL="http://localhost:3000"

# Test 1: Server Health
echo "\n📊 Test 1: Server Health Check"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/login)
if [ $HTTP_STATUS -eq 200 ]; then
  echo "✅ Server is running"
else
  echo "❌ Server failed (HTTP $HTTP_STATUS)"
  exit 1
fi

# Test 2: Valid Login
echo "\n🔐 Test 2: Valid Login"
COOKIE_JAR=$(mktemp)
LOGIN_RESPONSE=$(curl -s -c $COOKIE_JAR -X POST $BASE_URL/login/auth \
  -d "username=admin&password=admin" -w "%{http_code}" -o /dev/null)

if [ $LOGIN_RESPONSE -eq 302 ]; then
  echo "✅ Login successful"
else
  echo "❌ Login failed (HTTP $LOGIN_RESPONSE)"
  exit 1
fi

# Test 3: SQL Injection Prevention
echo "\n💉 Test 3: SQL Injection Prevention"
SQLI_RESPONSE=$(curl -s -X POST $BASE_URL/login/auth \
  -d "username=admin' OR '1'='1' --&password=anything" \
  -w "%{http_code}" -o /dev/null)

if [ $SQLI_RESPONSE -eq 401 ] || [ $SQLI_RESPONSE -eq 400 ]; then
  echo "✅ SQL Injection blocked"
else
  echo "❌ SQL Injection vulnerability (HTTP $SQLI_RESPONSE)"
  exit 1
fi

# Test 4: Protected Route
echo "\n🛡️ Test 4: Protected Route Access"
PROTECTED_RESPONSE=$(curl -s -b $COOKIE_JAR $BASE_URL/products -w "%{http_code}" -o /dev/null)
if [ $PROTECTED_RESPONSE -eq 200 ]; then
  echo "✅ Authenticated access granted"
else
  echo "❌ Protected route access denied"
  exit 1
fi

# Cleanup
rm -f $COOKIE_JAR

echo "\n✅ All smoke tests passed!"
echo "=========================="
```

- [ ] Hacer script ejecutable:
  ```bash
  chmod +x tests/smoke-test.sh
  ```

**Testing**:
```bash
# Asegurar que el servidor está corriendo
npm start &

# Ejecutar smoke tests
./tests/smoke-test.sh
```

**Salida**: Smoke tests automatizados

---

### **FASE 6: Observability & Production Readiness** (Prioridad P3)
**Objetivo**: Logging, monitoring, y preparación para producción
**Duración Estimada**: 2-3 días

#### 6.1 Implementar Structured Logging
**Archivos**:
- `src/infrastructure/logging/Logger.js` (nuevo)
- `app.js` (integrar logger)

**Tareas**:
- [ ] Instalar Winston: `npm install winston`
- [ ] Crear logger configurado:

**`src/infrastructure/logging/Logger.js`**:
```javascript
import winston from 'winston';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          (info) => `${info.timestamp} ${info.level}: ${info.message}`
        )
      )
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Create logs directory if it doesn't exist
import { mkdirSync } from 'fs';
try {
  mkdirSync('logs', { recursive: true });
} catch (error) {
  // Directory already exists
}
```

- [ ] Integrar logger en toda la aplicación:

**Ejemplos de uso**:
```javascript
import { logger } from './src/infrastructure/logging/Logger.js';

// Info logs
logger.info('User logged in', { userId: 123, username: 'admin' });

// Warning logs
logger.warn('Rate limit exceeded', { ip: '192.168.1.100' });

// Error logs with stack trace
logger.error('Database connection failed', { error: err.message, stack: err.stack });
```

**Testing**:
```bash
# Verificar logs se crean correctamente
npm start
cat logs/combined.log
cat logs/error.log
```

**Salida**: Structured logging implementado

---

#### 6.2 Request ID Tracking & Performance Monitoring
**Archivos**:
- `src/interface/http/middleware/requestId.js` (nuevo)
- `src/interface/http/middleware/performanceMonitoring.js` (nuevo)
- `app.js` (integrar middleware)

**Tareas**:
- [ ] Instalar uuid: `npm install uuid`
- [ ] Crear middleware de request ID:

**`src/interface/http/middleware/requestId.js`**:
```javascript
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../infrastructure/logging/Logger.js';

export function requestIdMiddleware(req, res, next) {
  req.id = uuidv4();
  res.setHeader('X-Request-ID', req.id);

  logger.info('Incoming request', {
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  next();
}
```

- [ ] Crear middleware de performance monitoring:

**`src/interface/http/middleware/performanceMonitoring.js`**:
```javascript
import { logger } from '../../infrastructure/logging/Logger.js';

export function performanceMiddleware(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    logger.http('Request completed', {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('content-length')
    });

    // Alert if response is slow
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        requestId: req.id,
        url: req.originalUrl,
        duration: `${duration}ms`
      });
    }
  });

  next();
}
```

- [ ] Integrar en `app.js`:
  ```javascript
  import { requestIdMiddleware } from './src/interface/http/middleware/requestId.js';
  import { performanceMiddleware } from './src/interface/http/middleware/performanceMonitoring.js';

  app.use(requestIdMiddleware);
  app.use(performanceMiddleware);
  ```

**Testing**:
```bash
# Verificar X-Request-ID header
curl -I http://localhost:3000/login | grep "X-Request-ID"

# Verificar logs con requestId
cat logs/combined.log | grep "requestId"
```

**Salida**: Request tracking y performance monitoring

---

#### 6.3 Rate Limiting (Brute-Force Prevention)
**Archivos**:
- `src/interface/http/middleware/rateLimiter.js` (nuevo)
- `routes/login.js` (aplicar rate limiter)

**Tareas**:
- [ ] Instalar express-rate-limit: `npm install express-rate-limit`
- [ ] Crear rate limiter configurado:

**`src/interface/http/middleware/rateLimiter.js`**:
```javascript
import rateLimit from 'express-rate-limit';
import { logger } from '../../infrastructure/logging/Logger.js';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 attempts per IP
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      endpoint: req.originalUrl,
      requestId: req.id
    });
    res.status(429).render('login', {
      error: 'Too many login attempts. Please try again in 15 minutes.',
      returnurl: req.query.returnurl || '/products'
    });
  }
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // Max 100 requests per IP
  message: 'Too many requests, please try again later'
});
```

- [ ] Aplicar en `routes/login.js`:
  ```javascript
  import { loginLimiter } from '../src/interface/http/middleware/rateLimiter.js';

  // Apply only to login route
  router.post('/auth', loginLimiter, validateLogin, (req, res) => authController.login(req, res));
  ```

**Testing**:
```bash
# Test: Intentar login 6 veces rápidamente
for i in {1..6}; do
  curl -X POST http://localhost:3000/login/auth \
    -d "username=admin&password=wrong" -w "\nAttempt $i: HTTP %{http_code}\n"
done
# El 6to intento debe retornar 429 Too Many Requests
```

**Salida**: Rate limiting implementado

---

#### 6.4 Health Check Endpoint
**Archivos**:
- `src/interface/http/routes/health.js` (nuevo)
- `app.js` (registrar ruta)

**Tareas**:
- [ ] Crear health check endpoint:

**`src/interface/http/routes/health.js`**:
```javascript
import express from 'express';
import db from '../../../config.js';

const router = express.Router();

router.get('/health', async (req, res) => {
  try {
    // Check database connection
    await db.one('SELECT 1 as health');

    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

export default router;
```

- [ ] Registrar en `app.js`:
  ```javascript
  import healthRouter from './src/interface/http/routes/health.js';
  app.use('/', healthRouter);
  ```

**Testing**:
```bash
curl http://localhost:3000/health
# Debe retornar JSON con status: "healthy"
```

**Salida**: Health check endpoint implementado

---

### **FASE 7: Documentation & Deployment** (Prioridad P3)
**Objetivo**: Documentar el sistema y preparar para deployment
**Duración Estimada**: 2 días

#### 7.1 Actualizar README
**Archivos**:
- `README.md` (actualizar completamente)

**Tareas**:
- [ ] Crear nuevo README con:
  - Descripción del proyecto rehabilitado
  - Requisitos (Node 22, PostgreSQL 16)
  - Instrucciones de instalación
  - Variables de entorno
  - Comandos disponibles (start, test, lint)
  - Arquitectura (Clean Architecture diagram)
  - API endpoints
  - Security features
  - Testing guide
  - Contributing guidelines

**Ejemplo de estructura**:
```markdown
# Secure Node App - Rehabilitated E-commerce Platform

## Overview
Este proyecto es una rehabilitación completa de la aplicación "vulnerable-node", transformándola de un sistema intencionalmente vulnerable en una aplicación segura y productiva que sigue las mejores prácticas de la industria.

## Tech Stack
- **Runtime**: Node.js 22.x LTS
- **Framework**: Express 5.0
- **Database**: PostgreSQL 16
- **Authentication**: Argon2 password hashing
- **Validation**: Zod
- **Logging**: Winston
- **Testing**: Jest + Supertest

## Architecture
Este proyecto sigue **Clean Architecture (Hexagonal)** con separación de responsabilidades:

[Agregar diagrama de arquitectura]

## Getting Started

### Prerequisites
- Node.js >= 22.0.0
- PostgreSQL >= 16.0
- npm >= 10.0.0

### Installation
[Instrucciones detalladas]

### Configuration
[Variables de entorno]

### Running
[Comandos de ejecución]

## Security Features
- ✅ SQL Injection prevention (parameterized queries)
- ✅ Password hashing with Argon2
- ✅ CSRF protection
- ✅ XSS prevention
- ✅ Security headers (Helmet)
- ✅ Rate limiting
- ✅ Session management
- ✅ Input validation (Zod)

## Testing
[Guía de testing]

## API Documentation
[Endpoints y ejemplos]

## Contributing
[Guidelines para contribuir]

## License
[Licencia]
```

**Salida**: README completo

---

#### 7.2 Crear API Documentation
**Archivos**:
- `docs/API.md` (nuevo)

**Tareas**:
- [ ] Documentar todos los endpoints:
  - Authentication endpoints
  - Product endpoints
  - Purchase endpoints
  - Request/response examples
  - Error codes

**Ejemplo**:
```markdown
# API Documentation

## Authentication

### POST /login/auth
Authenticate user and create session.

**Request**:
```json
{
  "username": "admin",
  "password": "SecurePassword123!"
}
```

**Response** (Success):
- HTTP 302 Redirect to /products
- Sets session cookie

**Response** (Error):
- HTTP 401 Unauthorized
```json
{
  "error": "Invalid credentials"
}
```

**Rate Limit**: 5 attempts per 15 minutes per IP

[... rest of documentation]
```

**Salida**: API documentation completa

---

#### 7.3 Docker Multi-Stage Build
**Archivos**:
- `Dockerfile` (actualizar)
- `docker-compose.yml` (actualizar)

**Tareas**:
- [ ] Actualizar `Dockerfile` con multi-stage build:

```dockerfile
# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Runtime
FROM node:22-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy dependencies from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY --chown=nodejs:nodejs . .

# Create logs directory
RUN mkdir -p logs && chown nodejs:nodejs logs

# Switch to non-root user
USER nodejs

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "src/server.js"]
```

- [ ] Actualizar `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DB_HOST: postgres_db
      DB_PORT: 5432
      DB_NAME: securenode
      DB_USER: postgres
      DB_PASSWORD: ${DB_PASSWORD}
      SESSION_SECRET: ${SESSION_SECRET}
    depends_on:
      postgres_db:
        condition: service_healthy
    restart: unless-stopped

  postgres_db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: securenode
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  postgres_data:
```

**Testing**:
```bash
# Build and run with Docker Compose
docker-compose up --build

# Verify health
curl http://localhost:3000/health
```

**Salida**: Docker deployment ready

---

## 🎯 MÉTRICAS DE ÉXITO

### Antes vs. Después

| Métrica | Antes | Después | Mejora |
|---|---|---|---|
| **Vulnerabilidades Críticas** | 9 | 0 | ✅ 100% |
| **SQL Injection Points** | 6 | 0 | ✅ 100% |
| **Passwords Hasheadas** | 0% | 100% | ✅ 100% |
| **Dependencias Actualizadas** | 0/13 | 13/13 | ✅ 100% |
| **Test Coverage** | 0% | >80% | ✅ N/A |
| **Security Score (OWASP)** | F | A | ✅ N/A |
| **Node.js Version** | 19 (EOL) | 22 LTS | ✅ N/A |
| **Code Maintainability** | 2/10 | 8/10 | ✅ 300% |

---

## 📊 ROADMAP FUTURO (Post-Entrega)

### Corto Plazo (1-2 meses)
- [ ] Implementar 2FA (Two-Factor Authentication)
- [ ] Agregar OAuth2/OpenID Connect (Google, GitHub login)
- [ ] API REST con JWT authentication
- [ ] Tests E2E con Playwright
- [ ] CI/CD pipeline con GitHub Actions

### Medio Plazo (3-6 meses)
- [ ] Migrar a TypeScript para type safety
- [ ] Implementar GraphQL API
- [ ] Redis cache layer para sessions y queries frecuentes
- [ ] WebSockets para notificaciones real-time
- [ ] Kubernetes deployment

### Largo Plazo (6-12 meses)
- [ ] Microservices architecture
- [ ] Event-driven architecture (Kafka/RabbitMQ)
- [ ] Machine learning para fraud detection
- [ ] Multi-tenancy support
- [ ] Disaster recovery automation

---

## 📝 NOTAS IMPORTANTES

### Decisiones de Arquitectura

**1. ¿Por qué Clean Architecture?**
- Separa lógica de negocio de frameworks
- Testeable sin dependencias externas
- Fácil cambiar de PostgreSQL a otro DB
- Escalable para crecer a microservicios

**2. ¿Por qué Argon2 sobre Bcrypt?**
- Recomendado por OWASP 2025
- Resistente a ataques GPU/ASIC (memory-hard)
- Ganador de Password Hashing Competition
- Mejor protección contra side-channel attacks

**3. ¿Por qué ES Modules?**
- Estándar moderno de JavaScript
- Tree-shaking para bundles más pequeños
- Mejor performance (cached parsing)
- Compatibilidad con herramientas modernas

**4. ¿Por qué Zod para validación?**
- Type-safe validation con inferencia de tipos
- Composable schemas
- Mejor DX que Joi o Yup
- Compatible con TypeScript (migración futura)

### Orden de Implementación Recomendado

1. **Empezar con FASE 1** (Setup) - sin esto, nada más funciona
2. **Continuar con FASE 2** (Security) - eliminar vulnerabilidades críticas
3. **Luego FASE 3** (Input Validation) - prevenir ataques
4. **Después FASE 4** (Refactoring) - mejorar arquitectura gradualmente
5. **Finalmente FASES 5-7** (Testing, Observability, Documentation)

**IMPORTANTE**: No intentar hacer todo a la vez. Implementar fase por fase, validar con tests, y commit después de cada fase completada.

---

## 🤝 RESOURCES & REFERENCES

### Documentation
- [OWASP Top 10 2021](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Clean Architecture (Uncle Bob)](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

### Libraries Used
- [Express 5.0](https://expressjs.com/)
- [Argon2](https://github.com/ranisalt/node-argon2)
- [Zod](https://zod.dev/)
- [Winston](https://github.com/winstonjs/winston)
- [Helmet](https://helmetjs.github.io/)
- [pg-promise](https://vitaly-t.github.io/pg-promise/)

---

**Fin del Plan de Rehabilitación**

Este documento debe servir como guía de referencia durante toda la implementación. Cada fase es independiente y se puede implementar de manera incremental sin romper funcionalidad existente.

¡Éxito en la rehabilitación del sistema! 🚀

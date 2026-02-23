# Fix #014: Columna Password Incompatible con Hash Argon2

**Fecha**: 2026-02-11
**Severidad**: 🔴 CRITICA (Bloqueante)
**Categoria**: Configuration / Database Schema
**Impacto**: Authentication Completely Non-Functional
**Estado**: ✅ RESUELTO

---

## 📋 Descripcion del Problema

### Sintomas Observados

1. **Login rechaza credenciales validas**: `admin`/`admin` retorna "Invalid credentials"
2. **POST /login/auth retorna 302**: Redirect a `/login?error=Invalid%20credentials`
3. **PasswordHasher falla silenciosamente**: El error se captura internamente y retorna `false`

### Error Reportado en Server Log

```
[AUTH] Login attempt from user: admin
[AUTH] Starting authentication for user: admin
[PasswordHasher] Verification error: pchstr must contain a $ as first char
[AUTH] Invalid password
POST /login/auth HTTP/1.1 302
GET /login?returnurl=%2F&error=Invalid%20credentials HTTP/1.1 200
```

### Error Clave

```
pchstr must contain a $ as first char
```

Esto indica que `argon2.verify()` recibe un string que **no es un hash argon2 valido**. Los hashes argon2 comienzan con `$argon2id$...`, pero la DB contiene passwords en texto plano.

---

## 🔍 Analisis de Causa Raiz

### Cadena de Eventos

El problema involucra **dos fallas encadenadas**:

#### Falla 1: Tabla pre-existente con esquema antiguo

**Archivo**: [`model/init_db.js`](../../model/init_db.js)

```javascript
// init_db.js define VARCHAR(255) para el password
await db.none('CREATE TABLE IF NOT EXISTS users(name VARCHAR(100) PRIMARY KEY, password VARCHAR(255))');
```

Pero la tabla ya existia en Docker con el esquema **original** del proyecto:

```sql
-- Esquema ORIGINAL (antes de rehabilitacion)
CREATE TABLE users(name VARCHAR(100) PRIMARY KEY, password VARCHAR(50));
--                                                          ^^^^^^^^^^^
--                                                          Solo 50 chars!
```

`CREATE TABLE IF NOT EXISTS` **no modifica tablas existentes**. La columna se quedo en `VARCHAR(50)`.

#### Falla 2: Hash argon2 excede VARCHAR(50)

Un hash argon2id tipico tiene ~97 caracteres:

```
$argon2id$v=19$m=65536,t=3,p=4$/xwEwNt6RpXpYVxzIjSaLg$IeQjSkYCnHTJ4uheJIqiWkXPqLby3W/kRX+CRo0huGE
└──────────────────────────────────── 97 caracteres ────────────────────────────────────────────────┘
```

Cuando `init_db.js` intentaba insertar el hash:

```javascript
const hashedPassword = await PasswordHasher.hash(u.password);
await db.none(
    'INSERT INTO users(name, password) VALUES($1, $2) ON CONFLICT (name) DO UPDATE SET password = $2',
    [u.username, hashedPassword]
);  // .catch(() => {}) ← Error silenciado!
```

PostgreSQL lanzaba:

```
ERROR: value too long for type character varying(50)
```

Pero el `.catch(() => {})` **silenciaba el error**. Los passwords quedaban en texto plano de la version anterior.

### Verificacion: Estado de la DB

```bash
$ node -e "import db from './model/db.js'; db.any('SELECT name, password FROM users').then(console.log)"

[
  { name: 'admin', password: 'admin' },          # ❌ Texto plano!
  { name: 'roberto', password: 'asdfpiuw981' }    # ❌ Texto plano!
]
```

### Diagrama del Problema

```
init_db.js ejecuta:
    │
    ├─ CREATE TABLE IF NOT EXISTS users(... password VARCHAR(255))
    │   └─ Tabla YA EXISTE con VARCHAR(50) → NO OPERATION (esquema no cambia)
    │
    ├─ PasswordHasher.hash("admin") → "$argon2id$v=19$..." (97 chars)
    │
    ├─ INSERT ... ON CONFLICT DO UPDATE SET password = '$argon2id$...'
    │   └─ ERROR: value too long for type character varying(50)
    │       └─ .catch(() => {}) → Error SILENCIADO
    │
    └─ console.log("Users initialized with hashed passwords") ← FALSO!
```

---

## ✅ Solucion Implementada

### Paso 1: Alterar Columna Password

```sql
ALTER TABLE users ALTER COLUMN password TYPE VARCHAR(255);
```

### Paso 2: Re-hashear Passwords

```javascript
import db from './model/db.js';
import { PasswordHasher } from './src/infrastructure/security/PasswordHasher.js';

const users = [
    { username: 'admin', password: 'admin' },
    { username: 'roberto', password: 'asdfpiuw981' }
];

for (const u of users) {
    const hash = await PasswordHasher.hash(u.password);
    await db.none('UPDATE users SET password = $1 WHERE name = $2', [hash, u.username]);
}
```

### Verificacion Post-Fix

```bash
$ node -e "import db from './model/db.js'; db.any('SELECT name, substring(password, 1, 30) as pwd FROM users').then(console.log)"

[
  { name: 'admin', pwd: '$argon2id$v=19$m=65536,t=3,p=4' },     # ✅ Hash argon2!
  { name: 'roberto', pwd: '$argon2id$v=19$m=65536,t=3,p=4' }     # ✅ Hash argon2!
]
```

### Recomendacion: Agregar ALTER en init_db.js

Para prevenir este problema en futuros despliegues, `init_db.js` deberia incluir un `ALTER TABLE` despues del `CREATE TABLE IF NOT EXISTS`:

```javascript
// Asegurar que la columna password tiene el tamano correcto para hashes argon2
await db.none('ALTER TABLE users ALTER COLUMN password TYPE VARCHAR(255)').catch(() => {});
```

---

## 🧪 Validacion

### Test 1: Hash Almacenado Correctamente

```bash
$ SELECT substring(password, 1, 10) FROM users WHERE name = 'admin';
  substring
-----------
 $argon2id$
```

✅ **PASS**: Password almacenada como hash argon2id

### Test 2: Login con Credenciales Validas

```
[AUTH] Login attempt from user: admin
[AUTH] Starting authentication for user: admin
[AUTH] Authentication successful
POST /login/auth HTTP/1.1 302  → Location: /
```

✅ **PASS**: Autenticacion exitosa, redirect a pagina principal

### Test 3: Login con Credenciales Invalidas

```
[AUTH] Login attempt from user: admin
[AUTH] Starting authentication for user: admin
[AUTH] Invalid password
POST /login/auth HTTP/1.1 302  → Location: /login?error=Invalid%20credentials
```

✅ **PASS**: Credenciales incorrectas son rechazadas correctamente

### Test 4: Navegador - Flujo Completo

```
1. GET /login → 200 OK (pagina de login)
2. POST /login/auth (admin/admin) → 302 → /
3. GET / → 200 OK (catalogo de 8 productos visible)
4. GET /logout → 302 → /login
```

✅ **PASS**: Flujo completo funcional

---

## 📊 Comparacion: Antes vs. Despues

### Antes del Fix

| Estado | Resultado |
|---|---|
| Columna password | ❌ VARCHAR(50) - insuficiente para hashes |
| Passwords en DB | ❌ Texto plano ("admin", "asdfpiuw981") |
| Login admin/admin | ❌ "Invalid credentials" |
| argon2.verify() | ❌ "pchstr must contain a $ as first char" |
| Seguridad | ❌ Passwords expuestas en texto plano |

### Despues del Fix

| Estado | Resultado |
|---|---|
| Columna password | ✅ VARCHAR(255) - suficiente para argon2 |
| Passwords en DB | ✅ Hash argon2id con salt |
| Login admin/admin | ✅ Autenticacion exitosa |
| argon2.verify() | ✅ Verificacion correcta |
| Seguridad | ✅ Passwords protegidas con argon2id |

---

## 🎯 Lecciones Aprendidas

### Antipatrones Identificados

1. **`CREATE TABLE IF NOT EXISTS` no migra esquemas**
   - ❌ **BAD**: Asumir que el esquema se actualiza si la tabla ya existe
   - ✅ **GOOD**: Usar `ALTER TABLE` explicito o sistema de migraciones

2. **`.catch(() => {})` silencia errores criticos**
   - ❌ **BAD**: `db.none(...).catch(() => {})` oculta fallos de INSERT/UPDATE
   - ✅ **GOOD**: `db.none(...).catch(err => { console.error('Error:', err.message); throw err; })`

3. **Log misleading despues de operacion fallida**
   - ❌ **BAD**: `console.log("Users initialized with hashed passwords")` sin verificar exito
   - ✅ **GOOD**: Verificar el estado real de la DB despues de la operacion

4. **Volumen persistente de Docker con datos legacy**
   - ❌ **BAD**: Asumir que la DB esta limpia en cada inicio
   - ✅ **GOOD**: Disenar init_db para manejar datos pre-existentes con esquemas diferentes

### Mejores Practicas

✅ **ALTER TABLE para migraciones**: Cambiar el tipo de columna explicitamente
✅ **Verificar post-operacion**: Consultar la DB para confirmar que los datos son correctos
✅ **Error handling visible**: Nunca silenciar errores de base de datos
✅ **Tamano de columna adecuado**: VARCHAR(255) minimo para hashes criptograficos

---

## 📎 Archivos Relacionados

- [`model/init_db.js`](../../model/init_db.js) - Script de inicializacion con `.catch(() => {})`
- [`model/auth.js`](../../model/auth.js) - Autenticacion con argon2.verify()
- [`src/infrastructure/security/PasswordHasher.js`](../../src/infrastructure/security/PasswordHasher.js) - Hash y verificacion argon2id
- [`dummy.js`](../../dummy.js) - Datos semilla con passwords en texto plano
- [`config.js`](../../config.js) - Configuracion de conexion a PostgreSQL

---

## 👥 Contributors

- **Diagnosed by**: Staff Software Engineer + Claude Opus 4.6
- **Fixed by**: Staff Software Engineer + Claude Opus 4.6
- **Date**: 2026-02-11
- **Version**: 1.0

---

## 🏷️ Tags

`database` `schema` `argon2` `password-hashing` `postgresql` `varchar` `migration` `critical-fix` `blocking-issue`

---

## ✅ Checklist de Resolucion

- [x] Problema diagnosticado
- [x] Causa raiz identificada (VARCHAR(50) vs hash de 97 chars)
- [x] Columna alterada a VARCHAR(255)
- [x] Passwords re-hasheadas con argon2id
- [x] Login verificado funcional
- [x] Documentacion completa
- [ ] Agregar ALTER TABLE en init_db.js para prevencion futura
- [ ] Eliminar `.catch(() => {})` silenciosos en init_db.js

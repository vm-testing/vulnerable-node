# Fix #013: Redirect Loop por Orden de Routers

**Fecha**: 2026-02-11
**Severidad**: 🔴 CRITICA (Bloqueante)
**Categoria**: Configuration / Routing
**Impacto**: Application Completely Non-Functional (infinite redirect loop)
**Estado**: ✅ RESUELTO

---

## 📋 Descripcion del Problema

### Sintomas Observados

1. **Pagina de login no carga**: El navegador muestra `ERR_TOO_MANY_REDIRECTS`
2. **Redirect loop infinito**: `GET /login` redirige a `/login?returnurl=%2Flogin` recursivamente
3. **Toda la aplicacion inaccesible**: Sin acceso al login, ninguna funcionalidad es utilizable

### Error Reportado

```
ERR_TOO_MANY_REDIRECTS at http://localhost:3000/
```

### Evidencia del Log del Servidor

```
GET /login?returnurl=%2Flogin%3Freturnurl%3D%252Flogin%253Freturnurl%253D%25252Flogin...
```

La URL crece exponencialmente con cada redirect, encodificando `returnurl` dentro de si misma.

---

## 🔍 Analisis de Causa Raiz

### Ubicacion

**Archivo**: [`app.js`](../../app.js) (lineas 84-86)

### Codigo Problematico

```javascript
// app.js - ORIGINAL (orden incorrecto)
app.use('', products);  // ❌ Montado PRIMERO - tiene check_logged global
app.use('', login);     // Montado SEGUNDO - nunca se alcanza para /login
```

### ¿Por que ocurre el loop?

**Archivo**: [`routes/products.js`](../../routes/products.js)
```javascript
const router = express.Router();
router.use(check_logged);  // ❌ Se aplica a TODAS las rutas del router
```

**Archivo**: [`routes/login_check.js`](../../routes/login_check.js)
```javascript
function check_logged(req, res, next) {
    if (req.session.logged === undefined || req.session.logged === false) {
        return res.redirect("/login?returnurl=" + encodeURIComponent(req.url));
    }
    next();
}
```

### Flujo del Redirect Loop

```
1. Usuario visita GET /login
2. Express evalua products router primero (montado antes que login)
3. products router tiene router.use(check_logged) → se ejecuta para TODA ruta
4. check_logged: session.logged === undefined → redirect a /login?returnurl=%2Flogin
5. GET /login?returnurl=%2Flogin llega al servidor
6. products router intercepta de nuevo → check_logged ejecuta de nuevo
7. redirect a /login?returnurl=%2Flogin%3Freturnurl%3D%252Flogin
8. Loop infinito ∞
```

### Diagrama del Problema

```
Request: GET /login
    │
    ▼
app.use('', products)  ← Express evalua PRIMERO
    │
    ▼
router.use(check_logged)  ← Middleware global del router
    │
    ▼
session.logged === undefined?
    │ SI
    ▼
res.redirect("/login?returnurl=...")  ← LOOP! Nunca llega al login router
    │
    ▼
GET /login?returnurl=...  ← Misma situacion, loop infinito
```

---

## ✅ Solucion Implementada

### Cambio en `app.js`

**Antes**:
```javascript
// Routes
app.use('', products);
app.use('', login);
```

**Despues**:
```javascript
// Routes (login must be before products to avoid redirect loop from auth middleware)
app.use('', login);
app.use('', products);
```

### ¿Por que funciona?

```
Request: GET /login
    │
    ▼
app.use('', login)  ← Express evalua PRIMERO
    │
    ▼
router.get('/login')  ← Coincide! Maneja la request
    │
    ▼
res.render('login', {...})  ← Responde con la pagina de login ✅
    │
    (products router nunca se ejecuta para /login)
```

Con el login router montado primero:
- `GET /login` → login router lo maneja directamente → renderiza pagina
- `POST /login/auth` → login router lo maneja → procesa autenticacion
- `GET /logout` → login router lo maneja → destruye sesion
- `GET /` → login router no tiene ruta para `/` → pasa a products router → `check_logged` evalua sesion

---

## 🧪 Validacion

### Test 1: Login Page Carga Correctamente

```bash
$ curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/login
200
```

✅ **PASS**: HTTP 200 OK (antes: ERR_TOO_MANY_REDIRECTS)

### Test 2: Redirect a Login para Rutas Protegidas

```bash
$ curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/
302
$ curl -s -o /dev/null -w "%{redirect_url}" http://localhost:3000/
http://localhost:3000/login?returnurl=%2F
```

✅ **PASS**: Rutas protegidas redirigen a login correctamente (un solo redirect)

### Test 3: Login Funcional Post-Fix

```
1. Navegar a http://localhost:3000/login
2. Username: admin, Password: admin
3. Click "Sign in"
4. Resultado: Redirect a / con catalogo de productos visible
```

✅ **PASS**: Login exitoso, sesion creada, productos visibles

### Test 4: Logout Funciona

```bash
$ curl -s -o /dev/null -w "%{redirect_url}" http://localhost:3000/logout
http://localhost:3000/login
```

✅ **PASS**: Logout redirige a login sin loop

---

## 📊 Comparacion: Antes vs. Despues

### Antes del Fix

| Estado | Resultado |
|---|---|
| GET /login | ❌ ERR_TOO_MANY_REDIRECTS |
| GET / | ❌ ERR_TOO_MANY_REDIRECTS |
| Login funcional | ❌ NO (pagina inaccesible) |
| Application usable | ❌ NO |

### Despues del Fix

| Estado | Resultado |
|---|---|
| GET /login | ✅ HTTP 200 - Pagina de login renderizada |
| GET / | ✅ HTTP 302 → /login (single redirect) |
| Login funcional | ✅ SI |
| Application usable | ✅ SI |

---

## 🎯 Lecciones Aprendidas

### Antipatrones Identificados

1. **Orden de Middleware Matters**
   - ❌ **BAD**: Montar routers con middleware restrictivo antes que rutas publicas
   - ✅ **GOOD**: Montar rutas publicas (login, health) antes que rutas protegidas

2. **Middleware Global en Router**
   - ❌ **BAD**: `router.use(authMiddleware)` cuando el router se monta en path `''` (intercepta todo)
   - ✅ **GOOD**: Aplicar auth middleware solo a rutas especificas o asegurar orden correcto

3. **Testing de Rutas Publicas**
   - ❌ **BAD**: No verificar que rutas sin autenticacion son accesibles
   - ✅ **GOOD**: Test automatizado que valide `/login`, `/health` responden sin sesion

### Mejores Practicas Aplicadas

✅ **Orden explicito**: Comentario documenta el por que del orden
✅ **Rutas publicas primero**: Login y health check se evaluan antes que rutas protegidas
✅ **Principio de menor sorpresa**: El flujo de routing sigue un orden logico

---

## 📎 Archivos Relacionados

- [`app.js`](../../app.js) - Orden de montaje de routers (lineas 84-86)
- [`routes/products.js`](../../routes/products.js) - Router con `check_logged` global
- [`routes/login_check.js`](../../routes/login_check.js) - Middleware de autenticacion
- [`routes/login.js`](../../routes/login.js) - Rutas de login/logout

---

## 👥 Contributors

- **Diagnosed by**: Staff Software Engineer + Claude Opus 4.6
- **Fixed by**: Staff Software Engineer + Claude Opus 4.6
- **Date**: 2026-02-11
- **Version**: 1.0

---

## 🏷️ Tags

`routing` `express` `middleware` `redirect-loop` `authentication` `critical-fix` `blocking-issue`

---

## ✅ Checklist de Resolucion

- [x] Problema diagnosticado
- [x] Causa raiz identificada
- [x] Orden de routers corregido en app.js
- [x] Login verificado funcional
- [x] Rutas protegidas siguen requiriendo autenticacion
- [x] Documentacion completa

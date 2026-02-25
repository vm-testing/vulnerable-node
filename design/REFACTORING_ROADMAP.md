# Roadmap de Refactoring: Vulnerable-Node
## Priorización Basada en Datos - Post-Rehabilitación

**Proyecto**: Course Project - Staff Software Engineer Simulation
**Equipo**: Engineering Squad (Parejas)
**Contexto**: Sistema post-rehabilitación con arquitectura mixta → Sistema con arquitectura limpia unificada
**Fecha**: 2026-02-24
**Versión**: 1.0
**Prerrequisito**: [REHABILITATION_PLAN.md](./REHABILITATION_PLAN.md) completado (14 fixes, 100% OWASP Top 10)

---

## 1. Resumen Ejecutivo

### Estado Post-Rehabilitación

La fase de rehabilitación finalizó con éxito:
- **14 fixes de seguridad** aplicados cubriendo el 100% de OWASP Top 10
- **Dependencias actualizadas**: Express 4.21, pg-promise 11.10, argon2, helmet 8, winston 3
- **Nuevos componentes Clean Architecture** en `src/` (7 archivos)
- **Código legacy funcional** en `model/` y `routes/` (7 archivos)

### Problema Actual

El codebase presenta una **arquitectura dual** resultante de la rehabilitación incremental:

| Capa | Legacy (`model/`, `routes/`) | Clean Architecture (`src/`) |
|---|---|---|
| Archivos | 7 | 7 |
| Patrón | MVC monolítico | Hexagonal (domain/infrastructure/interface) |
| Logging | `console.log` (14 llamadas) | Winston logger |
| Validación | Inline en routes | Zod validators separados |
| Seguridad | Parcheada | Diseñada desde cero |

**Drift arquitectónico**: 50% del código sigue patrones legacy.

### Propósito del Documento

Este roadmap establece un **framework cuantitativo** para priorizar 16 items de refactoring, eliminando decisiones basadas en intuición. Cada item se evalúa con métricas objetivas y se asigna a una fase según su ROI calculado.

### Metodología

1. Definir un framework de priorización con 4 dimensiones cuantificables
2. Recopilar métricas base del estado actual del proyecto
3. Puntuar cada item con la fórmula de ROI
4. Agrupar en fases respetando dependencias técnicas
5. Establecer KPIs y mecanismos de seguimiento

---

## 2. Framework de Priorización

### 2.1 Dimensiones de Evaluación

Cada item de refactoring se evalúa en 4 dimensiones independientes, puntuadas de 1 a 5:

#### Riesgo (R) - Peso: 0.30

Mide el riesgo de NO realizar el cambio.

| Puntaje | Nivel | Criterio |
|---|---|---|
| 5 | Crítico | Vulnerabilidad activa explotable, datos en riesgo |
| 4 | Alto | Dependencia deprecada con CVEs conocidos, falla silenciosa probable |
| 3 | Medio | Deuda técnica que dificulta cambios futuros, inconsistencia arquitectónica |
| 2 | Bajo | Mejora de calidad sin riesgo operacional inmediato |
| 1 | Mínimo | Mejora cosmética o de developer experience |

#### Deuda Técnica (DT) - Peso: 0.25

Mide cuánta deuda técnica se elimina con el cambio.

| Puntaje | Nivel | Criterio |
|---|---|---|
| 5 | Masiva | Elimina patrón anti-arquitectónico sistémico (>10 archivos afectados) |
| 4 | Significativa | Remueve inconsistencia mayor entre módulos (5-10 archivos) |
| 3 | Moderada | Estandariza componente aislado (2-4 archivos) |
| 2 | Menor | Mejora localizada en 1 archivo |
| 1 | Trivial | Cambio de configuración o renaming |

#### Valor de Negocio (VN) - Peso: 0.25

Mide el impacto positivo en productividad, confiabilidad o capacidad del equipo.

| Puntaje | Nivel | Criterio |
|---|---|---|
| 5 | Transformacional | Habilita nuevas capacidades (CI/CD, monitoring, deployment automatizado) |
| 4 | Significativo | Mejora medible en productividad del equipo (>30% en área específica) |
| 3 | Moderado | Reduce fricción en flujo de desarrollo habitual |
| 2 | Menor | Mejora incremental sin cambio en flujo de trabajo |
| 1 | Marginal | Beneficio teórico sin impacto inmediato |

#### Esfuerzo (E) - Peso: 0.20

Mide el costo de implementación (actúa como divisor en la fórmula).

| Puntaje | Nivel | Criterio |
|---|---|---|
| 1 | Trivial | <1 hora, cambio de configuración, <10 líneas |
| 2 | Bajo | 1-4 horas, cambios localizados, <50 líneas |
| 3 | Medio | 4-16 horas, múltiples archivos, requiere testing |
| 4 | Alto | 2-5 días, refactoring estructural, migración de datos |
| 5 | Masivo | >1 semana, reescritura de módulo completo, riesgo de regresión |

### 2.2 Fórmula de ROI

```
ROI = (R × 0.30 + DT × 0.25 + VN × 0.25) / (E × 0.20)
```

**Interpretación**:
- El numerador captura el **valor total** del cambio (riesgo mitigado + deuda eliminada + valor de negocio)
- El denominador penaliza el **costo** de implementación
- Un ROI alto indica máximo valor con mínimo esfuerzo

### 2.3 Umbrales de Decisión

| Rango ROI | Fase | Estrategia |
|---|---|---|
| ≥ 5.0 | Fase 1 - Quick Wins | Implementar inmediatamente, máximo valor por esfuerzo |
| 3.0 - 4.99 | Fase 2 - Estratégicos | Planificar sprint dedicado, requiere coordinación |
| 2.0 - 2.99 | Fase 3 - Arquitectónicos | Ejecutar cuando Fase 1-2 provean base necesaria |
| < 2.0 | Fase 4 - Modernización | Evaluar en siguiente ciclo de planning |

---

## 3. Estrategia de Recolección de Métricas

### 3.1 Métricas Base y Herramientas

| Métrica | Herramienta | Baseline Actual | Target |
|---|---|---|---|
| **Complejidad ciclomática** | `npx complexity-report` / ESLint rules | Sin medición | <10 por función |
| **Salud de dependencias** | `npm audit`, `npm outdated` | 1 deprecada (`csurf`), 0 vulnerabilidades | 0 deprecadas, 0 vulnerabilidades |
| **Cobertura de tests** | Jest `--coverage` | ~15% estimada (4 archivos test, 12 tests) | ≥80% unit, ≥60% integration |
| **Duplicación de código** | `npx jscpd` | Sin medición, duplicación visible en error handlers | <3% |
| **Drift arquitectónico** | Conteo manual `model/`+`routes/` vs `src/` | 50% (7 legacy / 7 clean) | 0% (100% en `src/`) |
| **Llamadas console.log** | `grep -r "console\."` | 14 en server-side (excl. `public/`) | 0 (100% Winston) |
| **Error rate en producción** | Winston logs + health endpoint | Sin monitoring | <0.1% |

### 3.2 Proceso de Medición

```
1. Establecer baselines (medición inicial antes de cambios)
2. Instrumentar: agregar métricas automatizadas en CI/CD (Fase 2)
3. Medir después de cada fase completada
4. Comparar contra targets y ajustar prioridades si es necesario
```

### 3.3 Fuentes de Datos por Dimensión

| Dimensión | Fuentes Primarias |
|---|---|
| Riesgo (R) | `npm audit`, CVE databases, OWASP checklists |
| Deuda Técnica (DT) | Conteo de archivos afectados, `jscpd`, análisis de imports |
| Valor de Negocio (VN) | Reducción de tiempo en onboarding, frecuencia de errores |
| Esfuerzo (E) | Conteo de archivos a modificar, LOC estimadas, dependencias |

---

## 4. Matriz de Decisión

### Tabla de Puntuación Completa

| ID | Item | R | DT | VN | E | ROI | Fase |
|---|---|---|---|---|---|---|---|
| REF-001 | Reemplazo de `csurf` (deprecado) → `csrf-sync` | 4 | 2 | 2 | 2 | **5.50** | 1 |
| REF-002 | Activación de `connect-pg-simple` para sesiones | 4 | 2 | 3 | 1 | **12.25** | 1 |
| REF-003 | Migración `console.log` → Winston logger | 2 | 3 | 3 | 2 | **5.25** | 1 |
| REF-004 | Configuración ESLint + Prettier | 1 | 2 | 4 | 1 | **9.00** | 1 |
| REF-005 | Estandarización de error handling | 3 | 3 | 3 | 3 | **4.00** | 2 |
| REF-006 | Cobertura de tests (unit + integration) | 3 | 4 | 5 | 4 | **3.94** | 2 |
| REF-007 | Migraciones de DB (reemplazar `init_db.js`) | 3 | 3 | 4 | 3 | **4.42** | 2 |
| REF-008 | Formato estándar de respuestas API | 2 | 3 | 3 | 2 | **5.25** | 1 |
| REF-009 | Centralización de configuración de entorno | 3 | 2 | 3 | 2 | **5.38** | 1 |
| REF-010 | Pipeline CI/CD (GitHub Actions) | 2 | 2 | 5 | 3 | **3.92** | 2 |
| REF-011 | Migración `model/` → `src/domain/` | 3 | 5 | 3 | 4 | **3.63** | 2 |
| REF-012 | Migración `routes/` → `src/interface/` | 3 | 5 | 3 | 4 | **3.63** | 2 |
| REF-013 | Enriquecimiento de logging (request correlation) | 2 | 2 | 3 | 3 | **3.08** | 2 |
| REF-014 | Path a TypeScript | 1 | 3 | 4 | 5 | **2.05** | 3 |
| REF-015 | Actualización de frontend (EJS → alternativa moderna) | 1 | 2 | 2 | 5 | **1.30** | 4 |
| REF-016 | Hardening de CSP (eliminar `unsafe-inline`) | 3 | 1 | 2 | 3 | **2.75** | 3 |

### Notas de Cálculo

**Ejemplo REF-002** (connect-pg-simple):
```
ROI = (4×0.30 + 2×0.25 + 3×0.25) / (1×0.20)
    = (1.20 + 0.50 + 0.75) / 0.20
    = 2.45 / 0.20
    = 12.25  →  Fase 1 (Quick Win)
```

**Ejemplo REF-014** (TypeScript):
```
ROI = (1×0.30 + 3×0.25 + 4×0.25) / (5×0.20)
    = (0.30 + 0.75 + 1.00) / 1.00
    = 2.05 / 1.00
    = 2.05  →  Fase 3 (Arquitectónico)
```

---

## 5. Backlog Priorizado

### Fase 1 - Quick Wins (ROI ≥ 5.0)

Items de alto valor y bajo esfuerzo. Ejecutables en 1-2 sprints.

| Orden | ID | Item | ROI | Esfuerzo Est. |
|---|---|---|---|---|
| 1 | REF-002 | Activación `connect-pg-simple` | 12.25 | <1 hora |
| 2 | REF-004 | ESLint + Prettier | 9.00 | 1-2 horas |
| 3 | REF-001 | Reemplazo de `csurf` | 5.50 | 1-4 horas |
| 4 | REF-009 | Configuración de entorno | 5.38 | 1-4 horas |
| 5 | REF-003 | Migración console.log → Winston | 5.25 | 1-4 horas |
| 6 | REF-008 | Formato de respuestas API | 5.25 | 1-4 horas |

### Fase 2 - Estratégicos (ROI 3.0 - 4.99)

Items que requieren planning dedicado y habilitan cambios posteriores.

| Orden | ID | Item | ROI | Esfuerzo Est. |
|---|---|---|---|---|
| 1 | REF-007 | Migraciones de DB | 4.42 | 4-8 horas |
| 2 | REF-005 | Error handling estándar | 4.00 | 4-16 horas |
| 3 | REF-006 | Cobertura de tests | 3.94 | 2-5 días |
| 4 | REF-010 | Pipeline CI/CD | 3.92 | 4-16 horas |
| 5 | REF-011 | Migración `model/` → `src/domain/` | 3.63 | 2-5 días |
| 6 | REF-012 | Migración `routes/` → `src/interface/` | 3.63 | 2-5 días |
| 7 | REF-013 | Enriquecimiento de logging | 3.08 | 4-16 horas |

### Fase 3 - Arquitectónicos (ROI 2.0 - 2.99)

Requiere que Fase 1-2 provean testing y CI/CD como red de seguridad.

| Orden | ID | Item | ROI | Esfuerzo Est. |
|---|---|---|---|---|
| 1 | REF-016 | CSP hardening | 2.75 | 4-16 horas |
| 2 | REF-014 | Path a TypeScript | 2.05 | >1 semana |

### Fase 4 - Modernización (ROI < 2.0)

Transformaciones de largo plazo. Evaluar viabilidad después de estabilizar Fase 1-3.

| Orden | ID | Item | ROI | Esfuerzo Est. |
|---|---|---|---|---|
| 1 | REF-015 | Actualización de frontend | 1.30 | >1 semana |

---

## 6. Detalle por Item

---

### REF-001: Reemplazo de `csurf` por `csrf-sync`

**ROI**: 5.50 | **Fase**: 1 | **Esfuerzo**: 2 (1-4 horas)

**Contexto**: El paquete `csurf` está **deprecado** desde septiembre 2022. Si bien funciona correctamente, no recibe parches de seguridad. `csrf-sync` es el reemplazo recomendado con API compatible con sessions.

**Archivos Afectados**:
- `app.js` (L9, L68-75): Import y configuración de CSRF middleware
- `package.json` (L17): Dependencia `csurf`
- Todas las views EJS que usen `csrfToken` (verificar compatibilidad)

**Criterios de Aceptación**:
- [ ] `csurf` removido de `package.json`
- [ ] `csrf-sync` instalado y configurado en `app.js`
- [ ] Token CSRF disponible en `res.locals.csrfToken` (misma interfaz)
- [ ] Formularios de login y compra funcionan correctamente
- [ ] Tests de CSRF existentes pasan sin modificación

**Riesgos**:
- API de `csrf-sync` difiere ligeramente de `csurf` → verificar middleware signature
- Views EJS dependen de `csrfToken` → validar que el nombre del token no cambie

**Dependencias**: Ninguna

---

### REF-002: Activación de `connect-pg-simple` para Session Store

**ROI**: 12.25 | **Fase**: 1 | **Esfuerzo**: 1 (<1 hora)

**Contexto**: `connect-pg-simple` ya está en `package.json` (L24) pero **no se usa**. Las sesiones se almacenan en memoria (default de `express-session`), lo que significa pérdida de sesiones en cada reinicio y no escala con múltiples instancias.

**Archivos Afectados**:
- `app.js` (L2, L54-65): Agregar import y configurar `store` en session middleware

**Cambio Estimado** (~5 líneas):
```javascript
import pgSession from 'connect-pg-simple';
const PgStore = pgSession(session);

// En session config (L54-65), agregar:
store: new PgStore({
  conString: config.db.connectionString,
  tableName: 'session'
})
```

**Criterios de Aceptación**:
- [ ] Sesiones persisten entre reinicios del servidor
- [ ] Tabla `session` creada automáticamente en PostgreSQL
- [ ] Login/logout funciona correctamente
- [ ] No hay memory leaks por acumulación de sesiones

**Riesgos**:
- Requiere que la base de datos esté disponible antes de iniciar el server
- La tabla `session` debe crearse (connect-pg-simple la crea automáticamente por default)

**Dependencias**: Base de datos PostgreSQL operativa

---

### REF-003: Migración de `console.log` a Winston Logger

**ROI**: 5.25 | **Fase**: 1 | **Esfuerzo**: 2 (1-4 horas)

**Contexto**: Winston logger existe en `src/infrastructure/logging/Logger.js` pero el código legacy usa `console.log`/`console.error` (14 llamadas en server-side). Esto impide logging estructurado, niveles de log, y rotación de archivos.

**Archivos Afectados**:
- `model/auth.js` (L5, L12, L19, L23): 4 llamadas `console.log`
- `model/init_db.js` (L21, L32, L35): 2 `console.log` + 1 `console.error`
- `routes/login.js` (L31): 1 `console.log`
- `routes/products.js` (L19, L30, L47, L66, L114): 5 `console.error`
- `src/infrastructure/security/PasswordHasher.js` (L17): 1 `console.error`

**Criterios de Aceptación**:
- [ ] 0 llamadas a `console.log`/`console.error` en código server-side
- [ ] Todos los logs usan niveles apropiados: `logger.info`, `logger.warn`, `logger.error`
- [ ] Logs de error incluyen contexto estructurado (no solo `err.message`)
- [ ] Archivo `logs/combined.log` captura actividad completa

**Riesgos**: Mínimo. Cambio mecánico de find-and-replace con ajuste de import.

**Dependencias**: Ninguna (Winston ya configurado)

---

### REF-004: Configuración ESLint + Prettier

**ROI**: 9.00 | **Fase**: 1 | **Esfuerzo**: 1 (1-2 horas)

**Contexto**: No existe configuración de linting ni formatting en el proyecto. Esto permite inconsistencias de estilo y no detecta errores comunes estáticamente.

**Archivos Afectados**:
- Nuevo: `.eslintrc.json` o `eslint.config.js`
- Nuevo: `.prettierrc`
- `package.json`: Scripts `lint` y `format`

**Criterios de Aceptación**:
- [ ] `npm run lint` ejecuta ESLint en todo el proyecto
- [ ] `npm run format` aplica Prettier a todo el proyecto
- [ ] Reglas configuradas para ESM (`"type": "module"`)
- [ ] Sin errores de lint en el codebase actual (ajustar reglas si es necesario)

**Riesgos**: Formateo automático puede producir un diff grande en el primer commit.

**Dependencias**: Ninguna

---

### REF-005: Estandarización de Error Handling

**ROI**: 4.00 | **Fase**: 2 | **Esfuerzo**: 3 (4-16 horas)

**Contexto**: El manejo de errores es inconsistente. `routes/products.js:71` usa `router.all()` aceptando GET para compras. Los error handlers en `app.js` (L89-121) mezclan JSON y HTML sin criterio. Los catch blocks en routes silencian errores renderizando páginas vacías.

**Archivos Afectados**:
- `routes/products.js` (L71): Cambiar `router.all` → `router.post` para `/products/buy`
- `routes/products.js` (L18-21, L29-32, L46-49, L65-68, L113-116): Estandarizar catch blocks
- `app.js` (L88-121): Unificar error handler con formato consistente
- Nuevo: `src/interface/http/middleware/errorHandler.js` (centralizado)

**Criterios de Aceptación**:
- [ ] `/products/buy` solo acepta POST (no GET)
- [ ] Error handler centralizado con formato JSON para API y HTML para views
- [ ] Todos los errores se loggean con Winston (no `console.error`)
- [ ] Errores 404 y 500 tienen respuestas predecibles

**Riesgos**:
- Cambiar `router.all` a `router.post` puede romper clientes que usen GET para compras
- Error handler centralizado debe mantener compatibilidad con CSRF error handler

**Dependencias**: REF-003 (Winston migration) recomendado primero

---

### REF-006: Cobertura de Tests (Unit + Integration)

**ROI**: 3.94 | **Fase**: 2 | **Esfuerzo**: 4 (2-5 días)

**Contexto**: Existen 4 archivos de test con ~12 tests. No hay integration tests funcionales. Sin cobertura medida, los refactorings de Fase 3 son riesgosos.

**Archivos de Test Existentes**:
- `tests/unit/passwordHasher.test.js`
- `tests/unit/validators.test.js`
- `tests/e2e/auth.e2e.test.js`
- `tests/e2e/products.e2e.test.js`

**Archivos a Cubrir (prioridad)**:
- `model/auth.js`: Tests de autenticación con mocks de DB
- `model/products.js`: Tests de cada acción (list, search, purchase, etc.)
- `routes/login.js`: Tests de flujo de login/logout con supertest
- `routes/products.js`: Tests de cada endpoint con supertest
- `src/interface/http/middleware/rateLimiter.js`: Tests de rate limiting
- `config.js`: Tests de configuración por entorno

**Criterios de Aceptación**:
- [ ] Coverage ≥80% en unit tests
- [ ] Coverage ≥60% en integration tests
- [ ] `npm test` ejecuta todos los tests y reporta cobertura
- [ ] Tests son independientes (no dependen de estado de DB real)

**Riesgos**: Tests de integration requieren setup de DB mock o test database.

**Dependencias**: REF-004 (ESLint) recomendado para consistencia en tests

---

### REF-007: Migraciones de DB (Reemplazar `init_db.js`)

**ROI**: 4.42 | **Fase**: 2 | **Esfuerzo**: 3 (4-8 horas)

**Contexto**: `model/init_db.js` ejecuta `CREATE TABLE IF NOT EXISTS` y seeds en cada arranque. No hay versionado de schema, no se pueden agregar columnas de forma incremental, y los seeds sobreescriben datos.

**Archivos Afectados**:
- `model/init_db.js` (completo): Reemplazar con sistema de migraciones
- `app.js` (L125-126): Cambiar llamada a `init_db()` por runner de migraciones
- Nuevo: `migrations/` directorio con archivos de migración versionados
- Nuevo: `seeds/` directorio para datos de desarrollo

**Criterios de Aceptación**:
- [ ] Migraciones versionadas con timestamps (e.g., `001_create_users.sql`)
- [ ] Seeds separados del schema (solo ejecutan en development)
- [ ] `npm run migrate` ejecuta migraciones pendientes
- [ ] `npm run seed` carga datos de prueba
- [ ] Schema existente se preserva (migración inicial captura estado actual)

**Riesgos**:
- Migración inicial debe capturar exactamente el schema actual sin pérdida de datos
- Passwords ya hasheados con argon2 deben preservarse

**Dependencias**: Ninguna

---

### REF-008: Formato Estándar de Respuestas API

**ROI**: 5.25 | **Fase**: 1 | **Esfuerzo**: 2 (1-4 horas)

**Contexto**: Las respuestas API no siguen un formato consistente. Algunos endpoints retornan `{ message: "..." }`, otros renderizan HTML, y los errores mezclan formatos.

**Archivos Afectados**:
- `routes/products.js`: Endpoints de búsqueda, compra, y listado
- `app.js` (L88-121): Error handlers
- Nuevo: `src/interface/http/helpers/apiResponse.js`

**Formato Propuesto**:
```javascript
// Éxito
{ success: true, data: { ... }, meta: { timestamp, requestId } }

// Error
{ success: false, error: { code: "NOT_FOUND", message: "..." }, meta: { timestamp, requestId } }
```

**Criterios de Aceptación**:
- [ ] Helper de respuesta reutilizable creado
- [ ] Endpoints API usan formato consistente
- [ ] Campos `requestId` y `timestamp` incluidos (requestId ya existe en middleware)
- [ ] Views EJS no afectadas (solo endpoints JSON)

**Riesgos**: Si existen clientes consumiendo la API actual, el cambio de formato es breaking.

**Dependencias**: REF-005 (error handling) recomendado primero

---

### REF-009: Centralización de Configuración de Entorno

**ROI**: 5.38 | **Fase**: 1 | **Esfuerzo**: 2 (1-4 horas)

**Contexto**: `config.js` tiene fallbacks hardcodeados (`'dev-secret-change-in-production'` en L9). La variable `STAGE` para Docker (L19) es un patrón legacy. No hay validación de variables de entorno requeridas.

**Archivos Afectados**:
- `config.js` (completo): Refactorizar con validación
- `app.js` (L59): `COOKIE_SECURE` hardcodeada como string comparison
- Nuevo: `.env.example` con documentación de todas las variables

**Criterios de Aceptación**:
- [ ] Validación de variables requeridas al arranque (fail fast si falta `SESSION_SECRET` en production)
- [ ] `.env.example` documenta todas las variables con valores de ejemplo
- [ ] Eliminación del patrón `STAGE === 'DOCKER'` (usar `DATABASE_URL` directamente)
- [ ] Tipos correctos para todas las variables (parseInt para PORT, etc.)

**Riesgos**: Fail-fast puede romper ambientes existentes que no tengan `.env` configurado.

**Dependencias**: Ninguna

---

### REF-010: Pipeline CI/CD (GitHub Actions)

**ROI**: 3.92 | **Fase**: 2 | **Esfuerzo**: 3 (4-16 horas)

**Contexto**: No existe `.github/workflows/`. No hay validación automatizada en PRs. Los tests se ejecutan manualmente.

**Archivos Afectados**:
- Nuevo: `.github/workflows/ci.yml`
- `package.json`: Verificar scripts de test

**Pipeline Propuesto**:
```yaml
Trigger: push to main, pull_request
Jobs:
  1. lint (ESLint)
  2. test:unit (Jest unit tests)
  3. test:integration (Jest integration tests con DB de prueba)
  4. security (npm audit)
```

**Criterios de Aceptación**:
- [ ] PRs bloqueados si lint falla
- [ ] PRs bloqueados si tests fallan
- [ ] `npm audit` reporta vulnerabilidades pero no bloquea
- [ ] Pipeline completo ejecuta en <5 minutos

**Riesgos**: Integration tests requieren PostgreSQL en CI (usar service container).

**Dependencias**: REF-004 (ESLint), REF-006 (tests) idealmente completados primero

---

### REF-011: Migración `model/` → `src/domain/`

**ROI**: 3.63 | **Fase**: 2 | **Esfuerzo**: 4 (2-5 días)

**Contexto**: 4 archivos en `model/` implementan acceso a datos sin separación de responsabilidades. La migración a `src/domain/` establece la capa de dominio con entities, repositories y use cases.

**Archivos a Migrar**:
- `model/auth.js` → `src/domain/auth/AuthService.js` + `src/infrastructure/persistence/UserRepository.js`
- `model/products.js` → `src/domain/product/ProductService.js` + `src/infrastructure/persistence/ProductRepository.js`
- `model/db.js` → `src/infrastructure/persistence/DatabaseConnection.js`
- `model/init_db.js` → Eliminado (reemplazado por migraciones en REF-007)

**Criterios de Aceptación**:
- [ ] Directorio `model/` eliminado completamente
- [ ] Capa de dominio sin dependencias de infraestructura (inversión de dependencias)
- [ ] Repositories implementan interfaz definida en dominio
- [ ] Todos los imports actualizados en `routes/` y `app.js`
- [ ] Tests existentes pasan sin modificación

**Riesgos**:
- Refactoring grande con alto riesgo de regresión si no hay tests adecuados
- Imports circular si no se respeta la dirección de dependencias

**Dependencias**: REF-006 (tests) y REF-007 (migraciones) DEBEN completarse antes

---

### REF-012: Migración `routes/` → `src/interface/`

**ROI**: 3.63 | **Fase**: 2 | **Esfuerzo**: 4 (2-5 días)

**Contexto**: 3 archivos en `routes/` mezclan lógica de negocio con handling HTTP. La migración a `src/interface/http/routes/` establece controllers delgados que delegan a servicios de dominio.

**Archivos a Migrar**:
- `routes/login.js` → `src/interface/http/routes/auth.js` + `src/interface/http/controllers/AuthController.js`
- `routes/products.js` → `src/interface/http/routes/products.js` + `src/interface/http/controllers/ProductController.js`
- `routes/login_check.js` → `src/interface/http/middleware/authGuard.js`

**Criterios de Aceptación**:
- [ ] Directorio `routes/` eliminado completamente
- [ ] Controllers no contienen lógica de negocio (solo HTTP concerns)
- [ ] Middleware de auth migrado y reutilizable
- [ ] Validators existentes en `src/interface/http/validators/` integrados directamente
- [ ] Todos los endpoints responden igual que antes (no breaking changes)

**Riesgos**:
- `app.js` requiere actualización de todos los imports de routes
- El order de middleware en Express es crítico (login antes de products)

**Dependencias**: REF-011 (domain migration) DEBE completarse antes

---

### REF-013: Enriquecimiento de Logging (Request Correlation)

**ROI**: 3.08 | **Fase**: 2 | **Esfuerzo**: 3 (4-16 horas)

**Contexto**: Winston logger existe pero no aprovecha el `requestId` middleware (`src/interface/http/middleware/requestId.js`). Los logs no correlacionan requests con sus operaciones downstream.

**Archivos Afectados**:
- `src/infrastructure/logging/Logger.js`: Agregar child logger con requestId
- `src/interface/http/middleware/requestId.js`: Integrar con Winston
- Todos los archivos que usen logger: pasar contexto de request

**Criterios de Aceptación**:
- [ ] Cada log entry incluye `requestId` cuando está en contexto HTTP
- [ ] Formato JSON estructurado con campos consistentes
- [ ] Morgan integrado con Winston (un solo pipeline de logging)
- [ ] Logs permiten trazar una request completa (login → auth → response)

**Riesgos**: Pasar contexto de request a través de capas sin acoplar dominio a HTTP.

**Dependencias**: REF-003 (Winston migration) y REF-011/REF-012 (architecture migration)

---

### REF-014: Path a TypeScript

**ROI**: 2.05 | **Fase**: 3 | **Esfuerzo**: 5 (>1 semana)

**Contexto**: El proyecto usa JavaScript con ESM. TypeScript agregaría type safety, mejor IDE support, y detección de errores en compilación. Sin embargo, es un cambio masivo.

**Estrategia Propuesta**: Migración gradual con `allowJs: true`:
1. Configurar `tsconfig.json` con `allowJs`
2. Renombrar archivos nuevos a `.ts`
3. Agregar tipos a archivos existentes incrementalmente
4. Activar `strict` cuando cobertura sea suficiente

**Archivos Afectados**: Todos (14+ archivos `.js`)

**Criterios de Aceptación**:
- [ ] `tsconfig.json` configurado
- [ ] Build pipeline compila TypeScript
- [ ] Al menos `src/` migrado a `.ts`
- [ ] Tipos para Express request/response extendidos

**Riesgos**: Alto esfuerzo, posible resistencia del equipo, require actualizar todo el tooling.

**Dependencias**: REF-004 (ESLint), REF-010 (CI/CD), REF-011/REF-012 (architecture)

---

### REF-015: Actualización de Frontend (EJS → Alternativa Moderna)

**ROI**: 1.30 | **Fase**: 4 | **Esfuerzo**: 5 (>1 semana)

**Contexto**: EJS con ejs-mate funciona pero es un template engine server-rendered sin interactividad moderna. Opciones: mantener EJS mejorado, migrar a HTMX, o separar frontend con React/Vue.

**Archivos Afectados**:
- `views/` (todos los templates EJS)
- `app.js` (L26-28): Engine configuration
- `public/` (assets estáticos)

**Criterios de Aceptación**:
- [ ] Evaluar opciones (EJS mejorado vs HTMX vs SPA)
- [ ] Documentar decisión con trade-offs
- [ ] Migración gradual sin perder funcionalidad

**Riesgos**: Mayor esfuerzo del backlog. Evaluar si el ROI justifica la inversión.

**Dependencias**: Todas las fases anteriores completadas

---

### REF-016: Hardening de CSP (Eliminar `unsafe-inline`)

**ROI**: 2.75 | **Fase**: 3 | **Esfuerzo**: 3 (4-16 horas)

**Contexto**: Helmet CSP en `app.js` (L41-51) permite `'unsafe-inline'` para `styleSrc` y `scriptSrc`. Esto debilita la protección contra XSS. Requiere externalizar todos los estilos y scripts inline.

**Archivos Afectados**:
- `app.js` (L44-45): Remover `'unsafe-inline'` de directivas
- `views/` (todos): Mover estilos inline a archivos CSS
- `views/` (todos): Mover scripts inline a archivos JS
- `public/css/` y `public/js/`: Nuevos archivos extraídos
- Alternativa: Implementar nonces con `helmet-csp` para scripts necesarios

**Criterios de Aceptación**:
- [ ] CSP no incluye `'unsafe-inline'` en ninguna directiva
- [ ] Todas las páginas renderizan correctamente
- [ ] No hay errores de CSP en la consola del navegador
- [ ] Scripts necesarios usan nonces o hashes

**Riesgos**:
- ejs-mate y EJS pueden generar inline styles/scripts difíciles de externalizar
- Third-party libraries (freewall.js) pueden requerir inline scripts

**Dependencias**: REF-015 (frontend update) puede simplificar esta tarea

---

## 7. Dashboard de Seguimiento

### KPIs del Roadmap

| KPI | Baseline (Actual) | Target Fase 1 | Target Fase 2 | Target Fase 3 | Target Final |
|---|---|---|---|---|---|
| **Drift Arquitectónico** | 50% | 50% | 0% | 0% | 0% |
| **Llamadas console.log** | 14 | 0 | 0 | 0 | 0 |
| **Cobertura Unit Tests** | ~15% | ~15% | ≥80% | ≥80% | ≥85% |
| **Cobertura Integration** | 0% | 0% | ≥60% | ≥70% | ≥75% |
| **Dependencias Deprecadas** | 1 (`csurf`) | 0 | 0 | 0 | 0 |
| **npm audit Vulnerabilities** | 0 | 0 | 0 | 0 | 0 |
| **ESLint Errors** | N/A | 0 | 0 | 0 | 0 |
| **Duplicación de Código** | Sin medir | Sin medir | <5% | <3% | <3% |
| **Session Store** | In-memory | PostgreSQL | PostgreSQL | PostgreSQL | PostgreSQL |
| **DB Migrations** | Manual (`init_db`) | Manual | Versionadas | Versionadas | Versionadas |
| **CI/CD Pipeline** | Ninguno | Ninguno | GitHub Actions | GitHub Actions | GitHub Actions |
| **Archivos TypeScript** | 0 | 0 | 0 | ≥7 (src/) | ≥7 (src/) |

### Herramientas de Medición

| Métrica | Herramienta | Comando |
|---|---|---|
| Test coverage | Jest | `npm test -- --coverage` |
| Lint errors | ESLint | `npm run lint` |
| Dependencias | npm | `npm audit && npm outdated` |
| Duplicación | jscpd | `npx jscpd --pattern "**/*.js" --ignore "node_modules,public"` |
| Complejidad | ESLint complexity rule | Configurado en `.eslintrc` |
| console.log count | grep | `grep -r "console\." --include="*.js" --exclude-dir=node_modules --exclude-dir=public` |
| Drift arquitectónico | Conteo manual | `ls model/ routes/` (target: vacíos) |

---

## 8. Cronograma y Dependencias

### Grafo de Dependencias

```
REF-002 (pg-simple) ──────────────────────────┐
REF-004 (ESLint) ──────────┬──────────────────┤
REF-009 (env config) ──────┤                  │
REF-003 (Winston) ─────────┤                  │
                           │                  │
REF-007 (migrations) ──────┤                  │
REF-005 (error handling) ──┘                  │
       │                                      │
       ├── REF-008 (API format) ──────────────┤
       ├── REF-001 (csrf-sync) ───────────────┤
       ├── REF-010 (CI/CD) ───────────────────┤
       └── REF-006 (tests) ──────┐            │
                                 │            │
              REF-011 (model→domain) ─────────┤
                     │                        │
              REF-012 (routes→interface) ─────┤
                     │                        │
              REF-013 (logging enrichment) ───┤
                                              │
              REF-014 (TypeScript) ────────────┤
              REF-016 (CSP hardening) ─────────┤
              REF-015 (frontend) ──────────────┘
```

### Estimación por Fase

| Fase | Items | Esfuerzo Total Est. | Duración Sugerida |
|---|---|---|---|
| Fase 1 - Quick Wins | 6 items | 6-18 horas | 1 sprint |
| Fase 2 - Estratégicos | 7 items | 8-20 días | 3-5 sprints |
| Fase 3 - Arquitectónicos | 2 items | 1-2 semanas | 2-3 sprints |
| Fase 4 - Modernización | 1 item | >1 semana | 1-2 sprints |

### Dependencias Críticas (Blocking)

| Dependencia | Bloqueador | Bloqueado | Razón |
|---|---|---|---|
| Tests antes de Refactoring | REF-006 | REF-011, REF-012 | Sin tests, la migración arquitectónica es demasiado riesgosa |
| Migrations antes de Domain | REF-007 | REF-011 | `init_db.js` debe reemplazarse antes de eliminar `model/` |
| Domain antes de Interface | REF-011 | REF-012 | Routes dependen de models; migrar models primero |
| CI/CD antes de Architecture | REF-010 | REF-011, REF-012 | Pipeline automatizado valida que la migración no rompe nada |

### Checkpoints de Revisión

| Checkpoint | Después de | Criterio de Go/No-Go |
|---|---|---|
| **CP-1** | Fase 1 completa | 0 console.log, sessions en PG, ESLint green, csurf reemplazado, API format estándar |
| **CP-2** | Fase 2 completa | Coverage ≥80% unit, CI/CD activo, migraciones DB, drift 0% (`model/` y `routes/` eliminados) |
| **CP-3** | Fase 3 completa | TypeScript en `src/`, CSP sin unsafe-inline |
| **CP-4** | Fase 4 completa | Frontend modernizado |

---

## Apéndice: Referencias

- [REHABILITATION_PLAN.md](./REHABILITATION_PLAN.md) — Plan de rehabilitación completado
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) — Framework de seguridad referenciado
- [connect-pg-simple docs](https://www.npmjs.com/package/connect-pg-simple) — Session store para PostgreSQL
- [csrf-sync docs](https://www.npmjs.com/package/csrf-sync) — Reemplazo recomendado de csurf

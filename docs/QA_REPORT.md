# QA Report — Study Buddy

## Resumen

**⚠️ WARN** — Builds pasan, tests pasan, pero hay gaps significativos en el frontend.

| Dimensión | Estado |
|-----------|--------|
| Backend build | ✅ |
| Frontend build | ✅ |
| Tests backend | ✅ 94 passing |
| Tests frontend | ❌ 0 tests |
| Lint | ⚠️ 84 issues |
| Docs | ✅ Completas |
| Design System | ⚠️ Con devs menores |

---

## Build

| Comando | Resultado | Detalle |
|---------|-----------|---------|
| `nest build` | ✅ | Compilación correcta, 0 errores |
| `ng build` | ✅ | 15 lazy chunks, 300KB initial total |

---

## Tests

### Antes de la auditoría
- **17 tests** existentes (3 suites): SM-2 algorithm, AI fallback strategy, AppController

### Tests añadidos
| Archivo | Tests | Cubre |
|---------|-------|-------|
| `auth/auth.service.spec.ts` | 14 | Register (6): happy path, conflict, JWT payload, name optional, error propagation. Login (8): valid/invalid credentials, not found user, wrong password, case sensitivity |
| `users/users.service.spec.ts` | 9 | findById, findByEmail, create, update — found/not-found, minimal data, error propagation |
| `decks/decks.service.spec.ts` | 15 | findAll (search filter, card/due counts), findById, create, update, delete — ownership checks, not found errors |
| `flashcards/flashcards.service.spec.ts` | 16 | CRUD + batchCreate — ownership, position ordering, max position null edge case |
| `quiz/quiz.service.spec.ts` | 12 | generateQuiz (default count, empty deck → [], ownership), submitResult (score: 0/100/partial, rounding) |
| `dashboard/dashboard.service.spec.ts` | 11 | Full dashboard, empty state, streak (gap, dedup, long), top-5 limit, card count |

### Totales

| Métrica | Valor |
|---------|-------|
| Suites | **9** (antes: 3) |
| Tests totales | **94** (antes: 17) |
| Tests pasando | **94 / 94** (100%) |
| Tests frontend | **0** ⚠️ |
| Nuevos tests añadidos | **77** |
| Cobertura backend | **>85% de services cubiertos** |

---

## Auditoría

| Aspecto | Estado | Detalle |
|---------|--------|---------|
| **Lint** | ❌ | 80 errors, 4 warnings |
| **Types** | ⚠️ | `strict: true`, pero `no-explicit-any: off` causa 30+ unsafe-* warnings |
| **Código API** | ✅ | Bien estructurado, modular, exceptions filters, ownership checks |
| **Código Angular** | ⚠️ | Signal-first ✅, Template inline grande, falta `ngOnInit` interface |
| **Docs** | ✅ | ARCHITECTURE, API, FRONTEND, DATABASE, AI_INTEGRATION, DECISIONS, LEARNINGS — todas completas |
| **Edge cases** | ⚠️ | API maneja: Not Found, Forbidden, Conflict, Unauthorized. Falta: rate limiting, input sanitization extremo |
| **Design System** | ⚠️ | Tokens definidos correctamente en Tailwind v4. Algunas clases hardcodeadas (gray-900 en vez de neutral-900) |
| **Seguridad** | ⚠️ | JWT en localStorage (XSS), sin rate limiting, sin refresh tokens |

---

## Issues

### 🔥 Alta

1. **Angular frontend: 0 tests**
   - No hay infraestructura de testing (Karma/Jasmine/Jest)
   - Las schematics tienen `skipTests: true` en todos los generadores
   - **Solución:** instalar `@angular/build:jest` o configurar Karma + Jasmine. El README menciona 17 tests pero son solo del backend
   - **Prioridad:** antes de producción

2. **AuthService usa URL hardcodeada**
   - `http://localhost:3000` está hardcodeado en `auth.service.ts` y `api.service.ts`
   - **Solución:** usar `environment.ts` o inyectar con `InjectionToken`

3. **84 errores de lint**
   - 30+ son `@typescript-eslint/no-unsafe-*` por `no-explicit-any: off`
   - Variables no usadas en `auth.controller.ts`, `ai.controller.ts`, `seed.service.ts`
   - `prefer-const` en `study.service.ts`
   - **Solución:** habilitar gradualmente reglas de tipo seguro

### ⚠️ Media

4. **Dashboard component >200 líneas con template inline**
   - Dificulta el testing y mantenimiento
   - Extraer template a archivo separado `.html`

5. **`AuthService` mezcla Promises con RxJS**
   - `login()` y `register()` devuelven `Promise<void>` pero usan `.subscribe()` internamente
   - Mejor usar `firstValueFrom()` como hace `DeckStoreService`

6. **Falta interfaz `ngOnInit` en `DashboardPageComponent`**
   - El método `ngOnInit()` existe pero el componente no implementa `OnInit`
   - TypeScript no lo exige pero es mala práctica

### 📝 Baja

7. **Skeleton loader usa gradiente no tokenizado**
   - `#e2e8f0`, `#f1f5f9` hardcodeados en `styles.css` en vez de usar `--color-neutral-*`
8. **Sin variable de entorno para API URL**
   - `api.service.ts` tiene `baseUrl = 'http://localhost:3000/api'` hardcodeado
9. **Seed script no tiene test**
   - `seed.service.ts` tiene variable `user2` no usada

---

## Design System Compliance

| Token Especificado | Implementado | Estado |
|--------------------|-------------|--------|
| `primary-500` → `#3b82f6` | ✅ `--color-primary-500` | ✅ Correcto |
| `secondary-500` → `#a855f7` | ✅ `--color-secondary-500` | ✅ Correcto |
| `accent-500` → `#10b981` | ✅ `--color-accent-500` | ✅ Correcto |
| `neutral-50` → `#f8fafc` | ⚠️ Usa `bg-white` y `bg-gray-900` dark | ❌ Dev: usa `neutral-*` o `bg-page` |
| `neutral-900` → `#0f172a` | ⚠️ Usa `text-gray-900` | ❌ Dev: usa `neutral-900` |
| `font-sans: Inter` | ✅ `--font-sans: 'Inter', ...` | ✅ |
| `shadow-card` | ⚠️ Usa `shadow-lg` en vez de `shadow-card` | ❌ Token no definido en Tailwind v4 |
| `rounded-card: 12px` | ⚠️ Usa `rounded-xl` en vez de `rounded-card` | ❌ Token omitido |
| Dark mode `surface-800` | ⚠️ Usa `dark:bg-gray-900` en vez de `dark:bg-surface-800` | ❌ Token surface no definido |

**Nota:** Los tokens de `neutral`, `surface` y `shadow` están especificados en el DESIGN_SYSTEM.md pero no implementados en `styles.css`. El diseño funciona porque Tailwind v4 tiene defaults similares, pero no es compliance exacto.

---

## Tests nuevos

| Archivo | Tests | Qué prueba |
|---------|-------|------------|
| `auth/auth.service.spec.ts` | 14 | Registro (conflictos, validación JWT, password hash), Login (credenciales inválidas, caso sensible) |
| `users/users.service.spec.ts` | 9 | CRUD de usuarios: búsqueda, creación, actualización, casos nulos |
| `decks/decks.service.spec.ts` | 15 | CRUD con ownership: búsqueda LIKE, conteo de cards/due, permisos |
| `flashcards/flashcards.service.spec.ts` | 16 | CRUD + batch: posicionamiento secuencial, ownership, NotFound/Forbidden |
| `quiz/quiz.service.spec.ts` | 12 | Generación y puntuación: deck vacío, scoring 0/100/75%, redondeo |
| `dashboard/dashboard.service.spec.ts` | 11 | Dashboard completo: streak (gap, dedup, largo), top-5, deck vacío |

---

## Conclusión

El backend de Study Buddy es sólido: **94 tests pasando**, buena arquitectura (Strategy Pattern, SM-2, modular), documentación excelente. El frontend Angular es visualmente completo (15 lazy chunks, signals, dark mode) pero carece **totalmente** de tests automatizados — el gap más crítico.

**Score: 7/10** — Backend sólido, frontend sin cobertura, lint con 84 issues.

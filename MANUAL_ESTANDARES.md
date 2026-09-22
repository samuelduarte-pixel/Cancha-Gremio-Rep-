# Manual de Estándares — Cancha Gremio

## 1. Nomenclatura de Variables

| Tipo | Convención | Ejemplo |
|------|-----------|---------|
| Variables | `camelCase` | `userName`, `reservaActiva` |
| Constantes | `UPPER_SNAKE_CASE` | `API_BASE_URL`, `MAX_RETRIES` |
| Funciones | `camelCase` | `getReservas()`, `createUser()` |
| Clases | `PascalCase` | `ReservaService`, `AuthController` |
| Archivos (JS/TS) | `camelCase` | `reservaService.ts` |
| Archivos (componentes) | `PascalCase` | `ReservaCard.tsx` |
| CSS/SCSS | `kebab-case` | `reserva-card.css` |
| Tablas DB | `snake_case` | `reservas`, `user_sessions` |

## 2. Estructura de Carpetas

```
/
├── .github/            # Configuración de GitHub (PR templates, CI)
├── src/                # Código ejecutable general
│   ├── components/     # Componentes reutilizables
│   ├── screens/        # Pantallas / páginas
│   └── utils/          # Utilidades y helpers
├── be/                 # Backend (FastAPI - Python)
├── fe/                 # Frontend (React - TypeScript)
├── bd/                 # Base de datos (esquemas)
└── docs/               # Documentación adicional
```

## 3. Convención de Commits (Conventional Commits)

Formato: `<tipo>(<alcance>): <descripción>`

### Tipos permitidos

| Tipo | Uso |
|------|-----|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `docs` | Solo documentación |
| `style` | Formato, Prettier, sin cambio lógico |
| `refactor` | Reestructuración sin cambio de funcionalidad |
| `test` | Agregar o modificar tests |
| `chore` | Tareas de mantenimiento (config, dependencias) |
| `perf` | Mejora de rendimiento |
| `ci` | Cambios en integración continua |

### Ejemplos

```
feat: agregar modal de reservas
fix: corregir error de autenticación en login
docs: actualizar instrucciones de instalación
style: formatear archivos con Prettier
refactor: extraer lógica de reservas a servicio separado
```

## 4. Ramas (Gitflow)

| Rama | Origen | Uso |
|------|--------|-----|
| `main` | — | Producción estable |
| `develop` | `main` | Desarrollo integrado |
| `feature/*` | `develop` | Nuevas funcionalidades |
| `hotfix/*` | `main` | Correcciones urgentes |
| `release/*` | `develop` | Preparación de release |

## 5. Reglas de Pull Requests

- Todo código debe pasar lint antes de merge
- Mínimo 1 revisor aprueba el PR
- Describir el cambio en el template de PR
- No hacer merge con conflictos sin resolver

## 6. Herramientas

- **Linter:** ESLint (JS/TS), Ruff (Python)
- **Formatter:** Prettier (JS/TS), Ruff format (Python)
- **Testing:** pytest (Backend), vitest/jest (Frontend)
- **Containerización:** Docker + Docker Compose

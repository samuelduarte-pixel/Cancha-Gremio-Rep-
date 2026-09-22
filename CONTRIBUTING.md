# Guía de Contribución — Cancha Gremio

Gracias por contribuir al proyecto. Por favor sigue estas directrices.

## Flujo de ramas (Gitflow)

- `main` — Producción estable, no se commitea directamente
- `develop` — Rama de integración, base para nuevas funcionalidades
- `feature/*` — Nuevas funcionalidades, salen desde `develop`
- `hotfix/*` — Correcciones urgentes, salen desde `main`

## Pasos para contribuir

1. Actualizar `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   ```

2. Crear tu rama feature:
   ```bash
   git checkout -b feature/nombre-descriptivo
   ```

3. Hacer tus cambios con commits descriptivos:
   ```bash
   git commit -m "feat: descripción del cambio"
   ```

4. Subir y crear Pull Request:
   ```bash
   git push origin feature/nombre-descriptivo
   ```

## Convención de Commits

Formato: `<tipo>(<alcance>): <descripción>`

| Tipo | Uso |
|------|-----|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `docs` | Documentación |
| `style` | Formato sin cambio lógico |
| `refactor` | Reestructuración |
| `test` | Tests |
| `chore` | Mantenimiento |

## Reglas

- No commitear archivos `.env` o credenciales
- Seguir los estándares en `MANUAL_ESTANDARES.md`
- Todo código debe pasar lint antes de merge
- Mínimo 1 revisor aprueba el PR

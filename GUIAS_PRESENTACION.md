# ⚽ Cancha Gremio — Guía técnica para presentación

> Documento de apoyo para exponer: herramientas usadas, Docker, la base de datos y los comandos para abrirla.

---

## 1. Herramientas que usa el proyecto

| Capa | Tecnología | ¿Para qué? |
|---|---|---|
| **Base de datos** | PostgreSQL 17 (imagen `postgres:17-alpine`) | Almacena toda la información del sistema: usuarios, canchas, reservas, eventos, auditoría. Corre dentro de un contenedor Docker. |
| **Backend** | Python + FastAPI + SQLAlchemy + Alembic | Servicio que expone la API REST y conecta la base de datos con la aplicación web. |
| **Frontend** | React 18 + TypeScript + Vite | Interfaz de usuario (lo que se ve en el navegador). |
| **Contenedores** | Docker + Docker Compose | Empaqueta y levanta los 3 componentes (bd, backend, frontend) aislados entre sí. |
| **Migraciones** | Alembic | Versiona los cambios de la estructura de la BD (tablas, índices, triggers, vistas). |
| **Cliente visual de BD** | pgAdmin 4 (contenedor adicional) | Herramienta gráfica para ver y consultar la base de datos. |
| **Cliente por terminal** | psql | Herramienta de texto para consultar la base de datos con comandos SQL. |

---

## 2. ¿Qué es Docker y cómo funciona en el proyecto?

**Docker** es una herramienta que permite ejecutar aplicaciones en *contenedores*: entornos aislados que ya incluyen todo lo necesario para funcionar (código, sistema operativo básico, dependencias). Esto garantiza que el proyecto funcione igual en cualquier máquina.

**Docker Compose** es un archivo (`docker-compose.yml`) que define y levanta todos los contenedores del proyecto con un solo comando.

### Los servicios definidos en `docker-compose.yml`

| Servicio | Nombre del contenedor | Puertos | Función |
|---|---|---|---|
| `db` | `cancha_sintetica_db` | 5433 → 5432 | PostgreSQL 17 (la base de datos) |
| `be` | `cancha_be` | 8001 → 8001 | API FastAPI |
| `fe` | `cancha_fe` | 5173 → 5173 | Frontend React (Vite) |

*Nota: `5433 → 5432` significa que dentro del contenedor la BD usa el puerto 5432 (el estándar de PostgreSQL), pero en tu máquina se accede por el puerto 5433.*

### Contenedores en ejecución

| Contenedor | Estado | Acceso |
|---|---|---|
| `cancha_sintetica_db` | Up (healthy) | BD PostgreSQL — puerto 5433 |
| `cancha_be` | Up | API — http://localhost:8001 |
| `cancha_fe` | Up | Web — http://localhost:5173 |
| `pgadmin` | Up | Visualizador BD — http://localhost:5050 |

---

## 3. Comandos básicos de Docker

### Levantar todo el proyecto

```bash
docker compose up -d
```

*`-d` = "detached", corre en segundo plano.*

### Ver el estado de los contenedores

```bash
docker compose ps
```

### Ver todos los contenedores

```bash
docker ps
```

### Ver los logs de un servicio (backend)

```bash
docker compose logs -f be
```

### Detener contenedores (sin borrar los datos)

```bash
docker compose stop
```

### Detener y eliminar contenedores (rápido, en desarrollo)

> ⚠️ `down` NO borra los datos de la BD porque están en un volumen Docker.

```bash
docker compose down
```

### Reconstruir y levantar desde cero

```bash
docker compose build
docker compose up -d
```

---

## 4. ¿Qué hay dentro de la base de datos?

La base de datos se llama **`cancha_sintetica_db`**. Contiene 9 tablas:

| Tabla | Contenido |
|---|---|
| `users` | Usuarios registrados: clientes, capitanes y administradores. |
| `fields` | Canchas sintéticas disponibles (horarios, capacidad). |
| `reservations` | Reservas: fecha, hora, cliente, cancha, estado y precio total. |
| `events` | Torneos y ligas: nombre, tipo (liga/torneo/evento), fecha, cupos. |
| `pricing_tiers` | Tarifas por horario (pico / valle / festivo). |
| `audit_logs` | Auditoría: quién y cuándo hizo cambios en las reservas. |
| `auth_tokens` | Sesiones/tokens de autenticación. |
| `token_blacklist` | Tokens revocados (seguridad al cerrar sesión). |
| `alembic_version` | Control interno de migraciones (versión actual de la BD). |

También incluye mejoras de integridad y control (aplicadas desde migraciones):

- **3 vistas** para reportes:
  - `v_reservas_detalle` → detalle de cada reserva con cliente y cancha.
  - `v_ingresos_mensuales` → ingresos resumidos por mes.
  - `v_ocupacion_canchas` → qué tan ocupada está cada cancha.
- **2 triggers** de PostgreSQL que se ejecutan solos al insertar/actualizar:
  - `trg_audit_reservations` → registra cada acción sobre las reservas en `audit_logs`.
  - `trg_reservations_no_overlap` → impide que dos reservas choquen en el mismo horario/cancha.
- **Restricciones** que evitan datos duplicados o inválidos: correo único, teléfono único, horario válido (fin después de inicio), precio no negativo, sin solapamientos.

---

## 5. Cómo abrir la base de datos (opción A) — psql en terminal

1. Abre **PowerShell o CMD** de Windows.
2. Ejecuta:

```bash
docker exec -it cancha_sintetica_db psql -U cancha_user -d cancha_sintetica_db
```

Esto entra al contenedor de PostgreSQL y abre la consola SQL (verás `cancha_sintetica_db=#`).

### Primeros comandos dentro de psql

```sql
\dt            -- Listar tablas
\dv            -- Listar vistas
\d reservations -- Ver estructura de una tabla
SELECT * FROM users;                 -- Ver todos los usuarios
SELECT * FROM reservations;          -- Ver todas las reservas
SELECT * FROM events;                -- Ver torneos y ligas
SELECT * FROM audit_logs ORDER BY id DESC;  -- Últimos cambios registrados
\q             -- Salir de psql
```

> 💡 Si al ejecutar sale `the input device is not a TTY`, usa `winpty` delante:
> `winpty docker exec -it cancha_sintetica_db psql -U cancha_user -d cancha_sintetica_db`

### Ejecutar un comando sin entrar a psql

```bash
docker exec cancha_sintetica_db psql -U cancha_user -d cancha_sintetica_db -c "SELECT * FROM users;"
```

---

## 6. Cómo abrir la base de datos (opción B) — pgAdmin (gráfico)

1. En el navegador abre: **http://localhost:5050**
2. Credenciales de pgAdmin: **Email:** `admin@admin.com` | **Password:** `admin`
3. En el panel izquierdo, expande **Servers** → clic en el servidor guardado (o regístralo manualmente con los siguientes datos):

| Campo | Valor |
|---|---|
| Host | `cancha_sintetica_db` |
| Port | `5432` |
| Database | `cancha_sintetica_db` |
| Username | `cancha_user` |
| Password | `cancha_password` |

4. Dentro de la BD ya puedes ver tablas, ejecutar SQL (botón **Query Tool**) y explorar vistas/triggers.

---

## 7. Credenciales del proyecto (para la presentación)

| Dato | Valor |
|---|---|
| Aplicación web | http://localhost:5173 |
| API (Swagger) | http://localhost:8001/docs |
| Backend (raíz) | http://localhost:8001 |
| Usuario admin de la app | `admin@example.com` / `admin123` |
| BD — nombre | `cancha_sintetica_db` |
| BD — usuario | `cancha_user` |
| BD — contraseña | `cancha_password` |
| BD — puerto en tu PC | `5433` |

---

## 8. Datos de ejemplo que ya existen (para demostrar en vivo)

- **Usuarios:** admin `admin@example.com` (rol admin) y varios clientes registrados.
- **Eventos de septiembre:** Liga Nocturna (10 sep), Torneo Relámpago (12 sep), Día del Niño (20 sep).
- **Reservas:** reservas confirmadas y canceladas, con precio calculado automático.
- **Auditoría:** varias entradas registradas en `audit_logs`.
- **Registro nuevo:** la app crea la cuenta con verificación automática (el usuario entra directo sin confirmar correo) y guarda el usuario en `users`.

---

## 9. Flujo de la presentación (recomendado)

1. **¿Qué es el proyecto?** App web para gestionar reservas de la cancha sintética.
2. **¿Qué herramientas usa?** React, FastAPI, PostgreSQL y Docker (tabla de la sección 1).
3. **¿Qué es Docker?** Contenedores = servicios aislados; muestre el `docker-compose.yml`.
4. **Mostrar la app viva:** http://localhost:5173 → login admin → dashboard con eventos de septiembre e ingresos del mes.
5. **Abrir la BD en vivo (psql):** listar tablas con `\dt`, ver `users`, ver `events`.
6. **Abrir pgAdmin:** mostrar el árbol de tablas y ejecutar una consulta.
   ```sql
   SELECT * FROM v_reservas_detalle ORDER BY id DESC LIMIT 5;
   ```
7. **Mostrar las mejoras de la BD:** restricciones (correo/teléfono únicos, evitar dobles reservas) y el trigger de auditoría.
   ```sql
   SELECT * FROM audit_logs ORDER BY id DESC LIMIT 5;
   ```
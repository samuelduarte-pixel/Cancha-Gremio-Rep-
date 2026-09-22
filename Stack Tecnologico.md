Estructura del Proyecto — Cancha Gremio

## 1. ¿Qué estructura tiene el proyecto y por qué?

El proyecto está dividido en tres carpetas raíz independientes, una por cada capa del sistema:

```
Cancha-Gremio/
├── BD/     # Definición de la base de datos
├── BE/     # Backend (API REST)
├── FE/     # Frontend (interfaz de usuario)
└── docker-compose.yml   # Levanta las 3 capas juntas
```

Esta división la elegimos ya que fue la forma inicial en la que nos la enseñaron en el método de estudio, siendo entendida por nosotros y por la forma en la que fue aplicada desde el inicio del programa de formación.


Ventajas concretas de esta separación:

- **Independencia de despliegue**: cada capa tiene su propio `Dockerfile` y puede reiniciarse/escalarse sin afectar a las otras (ver `docker-compose.yml`).
- **Trabajo en paralelo**: quien trabaja en frontend no necesita tocar Python, y viceversa.
- **Dentro de BE y FE** se usa además el patrón **MVC / por capas** (modelos, esquemas, rutas, servicios), para que cada archivo tenga una sola responsabilidad y el código sea mantenible a medida que el proyecto crece.

---

## 2. Estructura completa por carpeta

### 📁 BD — Base de datos

```
BD/
├── schema.prisma       # Definición de tablas, relaciones y enums
│                         (User, Field, Booking, Payment, Notification, Event, Maintenance)
├── .env.example        # Variable DATABASE_URL de ejemplo
└── package-lock.json
```

La base de datos real es **PostgreSQL 17**, levantada vía Docker en el puerto `5433`. El backend gestiona las migraciones con **Alembic** (`BE/alembic/`); el `schema.prisma` documenta el modelo de datos de forma clara y tipada.

### 📁 BE — Backend (FastAPI)

```
BE/
├── app/
│   ├── main.py              # Punto de entrada: crea la app FastAPI y registra los routers
│   ├── config.py            # Configuración centralizada (variables de entorno)
│   ├── database.py          # Conexión a PostgreSQL (SQLAlchemy)
│   │
│   ├── models/               # Modelo → tablas mapeadas a clases Python
│   │   ├── user.py  ├── field.py  ├── reservation.py  └── event.py
│   │
│   ├── schemas/               # Validación de entrada/salida (Pydantic)
│   │   ├── auth.py  ├── user.py  ├── field.py  ├── reservation.py
│   │   ├── event.py  └── maintenance.py
│   │
│   ├── routers/                # Controlador → reciben la petición HTTP y responden
│   │   ├── auth.py             # Login, registro, recuperación de contraseña (JWT)
│   │   ├── reservations.py     # CRUD de reservas
│   │   ├── fields.py           # CRUD de canchas
│   │   ├── events.py           # Eventos
│   │   ├── maintenance.py      # Mantenimientos
│   │   ├── dashboard.py        # Métricas/reportes
│   │   └── clientes.py         # CRUD de clientes
│   │
│   ├── services/                # Lógica de negocio separada del router
│   │   └── auth_service.py      # Genera/valida tokens JWT, hashea contraseñas
│   │
│   ├── utils/                   # Funciones auxiliares
│   └── tests/                   # Pruebas
│
├── alembic/              # Migraciones de base de datos
├── requirements.txt
├── Dockerfile
├── .env.example
└── seed_data.sql, create_admin.py, etc.   # Datos y scripts utilitarios
```

**Por qué esta estructura (patrón por capas):**

| Carpeta | Responsabilidad |
|---|---|
| `models/` | Cómo se ven los datos en la base de datos |
| `schemas/` | Qué forma deben tener los datos que entran/salen de la API (validación) |
| `routers/` | Qué URL + verbo HTTP dispara qué acción (el "controlador") |
| `services/` | Reglas de negocio reales (ej: generar un token) |

Esto evita que un router mezcle validación, lógica de negocio y consultas SQL en un mismo archivo.

**Tecnologías:** Python 3.12, FastAPI, SQLAlchemy, Alembic, Pydantic, `python-jose` (JWT).

### 📁 FE — Frontend (React + TypeScript)

```
FE/
├── src/
│   ├── main.tsx           # Punto de entrada de React
│   ├── App.tsx             # Configuración de rutas (React Router)
│   │
│   ├── api/                 # Comunicación con el backend (llamadas HTTP)
│   │   ├── client.ts         # Instancia de Axios + interceptores (JWT, errores 401)
│   │   ├── auth.ts  ├── campos.ts  ├── eventos.ts  └── reservas.ts
│   │
│   ├── context/              # Estado global (Context API)
│   │   ├── AuthContext.tsx    # Usuario autenticado, login/logout
│   │   └── ToastContext.tsx   # Notificaciones tipo toast
│   │
│   ├── pages/                # Pantallas completas, una por ruta
│   │   ├── LoginPage, RegisterPage, ForgotPassword, ResetPassword
│   │   ├── DashboardPage, ReservasPage, ClientesPage
│   │   ├── EventosPage, MantenimientoPage, ReportesPage
│   │   └── LandingPage
│   │
│   ├── components/           # Componentes reutilizables de UI
│   │   ├── Layout, Sidebar, Topbar, StatCard
│   │   └── ProtectedRoute.tsx    # Bloquea rutas si no hay sesión
│   │
│   ├── hooks/                # Hooks personalizados reutilizables
│   ├── types/                # Interfaces/tipos TypeScript compartidos
│   ├── assets/                # Imágenes, íconos, fuentes
│   ├── features/              # Módulos por funcionalidad (crecimiento futuro)
│   ├── styles/                # Estilos globales/variables (crecimiento futuro)
│   ├── utils/                  # Funciones auxiliares (crecimiento futuro)
│   └── index.css
│
├── package.json  ├── vite.config.ts  ├── tsconfig.json
├── Dockerfile
└── .env.example          # VITE_API_URL: URL del backend
```

**Por qué esta estructura:** separa *qué se ve* (`pages/`, `components/`) de *cómo se obtienen los datos* (`api/`) y de *el estado compartido* (`context/`), con el mismo principio de responsabilidad única que el backend. `pages/` contiene una pantalla por ruta (`/reservas` → `ReservasPage.tsx`), y `api/` centraliza las llamadas HTTP para que un cambio en el backend solo se ajuste en un lugar.

**Tecnologías:** React 18, TypeScript, Vite, TailwindCSS, React Router, Axios.

---

## 3. ¿Cómo es la comunicación con la API?

El proyecto sigue el modelo **cliente-servidor vía API REST sobre HTTP**: React nunca habla directamente con la base de datos — todo pasa por FastAPI.

```
React (FE)                FastAPI (BE)              PostgreSQL (BD)
    |                           |                          |
    | 1. Usuario hace clic      |                          |
    | 2. api/reservas.ts hace   |                          |
    |    GET /api/v1/reservations                          |
    |-------------------------->|                          |
    |                           | 3. router reservations.py|
    |                           |    recibe la petición     |
    |                           | 4. Consulta vía SQLAlchemy|
    |                           |    (models/reservation.py)|
    |                           |------------------------->|
    |                           |                          | 5. Consulta la tabla
    |                           |<-------------------------|    "reservations"
    |                           | 6. Devuelve JSON validado |
    |                           |    con schemas/           |
    |<--------------------------|                          |
    | 7. React actualiza el     |                          |
    |    estado y re-renderiza  |                          |
```

**En la práctica, dentro de este repo:**

1. **Cliente HTTP**: `FE/src/api/client.ts` — instancia de Axios apuntando a `VITE_API_URL`, con un interceptor que agrega el token JWT a cada petición automáticamente.

2. **Un archivo de API por recurso** en el frontend (`api/reservas.ts`, `api/campos.ts`, `api/eventos.ts`, `api/auth.ts`), tipado en TypeScript. Ejemplo:
   - `reservasApi.getAll()` → `GET /api/v1/reservations`
   - `reservasApi.getById(id)` → `GET /api/v1/reservations/{id}`
   - `reservasApi.create(data)` → `POST /api/v1/reservations`

3. **Del lado del backend**, cada recurso tiene su propio router con su prefijo (ej. `prefix="/api/v1/reservations"` en `reservations.py`), que valida la entrada con un `schema`, consulta/modifica la BD vía SQLAlchemy con el `model`, y devuelve la respuesta en **JSON** validada con un `schema` de salida.

4. **Autenticación**: el login (`POST /api/auth/login`) devuelve un token JWT generado en `auth_service.py`. El frontend lo guarda y el interceptor de Axios lo adjunta como `Authorization: Bearer <token>` en cada petición. Si el backend responde `401`, la sesión se limpia y se redirige a `/login`.



5. **CORS**: como React (`localhost:5173`) y FastAPI (`localhost:8001`) corren en puertos distintos, `BE/app/main.py` habilita `CORSMiddleware` para permitir las respuestas del backend en el navegador.

6. **Documentación interactiva**: FastAPI genera automáticamente la documentación de todos los endpoints en `http://localhost:8001/docs` (Swagger UI).


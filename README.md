# Cancha Gremio

Software de gestión de reservas para cancha sintética — desarrollo como actividad académica del programa ADSO.

---

## Descripción

Cancha Gremio es una aplicación web que permite gestionar de manera sencilla, organizada y eficiente las reservas de una cancha sintética. El sistema optimiza los procesos administrativos, mejora la experiencia de los usuarios y moderniza la gestión del establecimiento mediante una plataforma digital centralizada.

### Funcionalidades principales

- Registro y gestión de clientes
- Creación, confirmación y cancelación de reservas en línea
- Procesamiento de pagos digitales
- Difusión de eventos y torneos mediante notificaciones
- Generación de reportes administrativos y estadísticas de uso
- Comunicación directa entre usuarios y administrador

---

## Tecnologías utilizadas

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18, TypeScript, Vite |
| Backend | Python, FastAPI, SQLAlchemy, Alembic |
| Base de datos | PostgreSQL 17 |
| Contenedores | Docker, Docker Compose |
| Gestor de paquetes | pnpm (Frontend), pip (Backend) |

---

## Instalación local

### Prerrequisitos

- Python 3.10+
- Node.js 18+
- pnpm
- Docker y Docker Compose

### 1. Clonar el repositorio

```bash
git clone https://github.com/samuelduarte-pixel/Cancha-Gremio-Rep-.git
cd Cancha-Gremio-Rep-
```

### 2. Levantar la base de datos

```bash
docker compose up -d
docker compose ps
# Debe mostrar la DB con estado "healthy"
```

### 3. Configurar el Backend

```bash
cd be

# Crear entorno virtual
python -m venv .venv

# Activar entorno virtual
source .venv/Scripts/activate    # Windows (Git Bash)
source .venv/bin/activate        # Linux/macOS

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env

# Ejecutar migraciones
alembic upgrade head
```

### 4. Configurar el Frontend

```bash
cd fe
pnpm install
cp .env.example .env
```

---

## Ejecución

```bash
# Terminal 1 — Base de datos
docker compose up -d

# Terminal 2 — Backend (FastAPI)
cd be && source .venv/Scripts/activate
uvicorn app.main:app --reload
# API en http://localhost:8000
# Swagger UI en http://localhost:8000/docs

# Terminal 3 — Frontend (React)
cd fe && pnpm dev
# App en http://localhost:5173
```

---

## Testing

### Backend

```bash
cd be && source .venv/Scripts/activate
pytest -v
pytest --cov=app --cov-report=term-missing
```

### Frontend

```bash
cd fe
pnpm test
pnpm test:coverage
```

---

## Integrantes del equipo

| Nombre | GitHub |
|--------|--------|
| Integrante 1 | @usuario1 |
| Integrante 2 | @usuario2 |
| Integrante 3 | @usuario3 |

> **Nota:** Completa esta tabla con los nombres y usuarios de GitHub de los integrantes de tu equipo.

---

## Licencia

Este proyecto está bajo la licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

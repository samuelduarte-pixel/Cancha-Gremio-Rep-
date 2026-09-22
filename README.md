# ⚽ Cancha Gremio

**Integrantes:**

- Diego Palencia
- Julián Avilez
- Erik Crespo

---

## 📌 Introducción

El presente proyecto tiene como objetivo el desarrollo de una aplicación web que permita gestionar de manera sencilla, organizada y eficiente las reservas de la cancha sintética **Cancha Gremio**.

La implementación de esta herramienta tecnológica busca optimizar los procesos administrativos, mejorar la experiencia de los usuarios y modernizar la gestión del establecimiento.

---

## 🎯 Objetivo General

Desarrollar e implementar un software de reservas para la cancha sintética que permita:

- Registrar y gestionar clientes.
- Crear, confirmar y cancelar reservas en línea.
- Procesar pagos digitales de manera segura.
- Difundir eventos y actividades mediante notificaciones y redes sociales.
- Generar reportes administrativos y estadísticas de uso.

Todo esto con el fin de optimizar la organización, reducir los procesos manuales y mejorar la experiencia tanto de los usuarios como de la administración.

---

## ❗ Problema a Solucionar

Actualmente, los procesos de la cancha se realizan de forma manual, lo que genera desorden y múltiples inconvenientes administrativos.

Entre las principales problemáticas se encuentran:

- ❌ Duplicidad de reservas y confusión de horarios.
- ❌ Pérdida de información.
- ❌ Exceso de papeleo físico.
- ❌ Baja difusión de eventos y torneos.

Para dar solución a estos inconvenientes, se propone el desarrollo de un software que permita:

- ✅ Automatizar el proceso de reservas mediante una aplicación o página web.
- ✅ Difundir información de manera organizada a través de recordatorios automáticos y redes sociales.
- ✅ Facilitar pagos y contratos en línea, eliminando procesos físicos innecesarios.
- ✅ Centralizar datos administrativos y de usuarios en un solo sistema confiable.

---

## 🧾 Justificación

La implementación de un sistema digital es necesaria debido a que los procesos manuales actuales generan desorganización, pérdida de información, duplicidad de horarios y deficiencias en la comunicación con los clientes.

Si no se soluciona esta situación, la cancha continuará perdiendo tiempo, recursos económicos y clientes potenciales debido a la falta de control y organización.

Con este software se busca:

- Optimizar la administración.
- Mejorar la comunicación con los usuarios.
- Garantizar una experiencia más rápida, ordenada y confiable.
- Modernizar la gestión del establecimiento.

---

## 📊 Alcance del Proyecto

El sistema de reservas permitirá:

- Registro y gestión de clientes.
- Creación, confirmación y cancelación de reservas mediante un calendario en línea.
- Procesamiento de pagos digitales y generación de comprobantes.
- Difusión de eventos y torneos mediante notificaciones y recordatorios.
- Organización de mantenimientos.
- Administración de proveedores, promociones e insumos deportivos.
- Generación de reportes y estadísticas de uso.
- Comunicación directa entre usuarios y administrador.

### 🚫 Limitaciones

El software **no incluirá**:

- Gestión de inventarios de productos para venta.
- Control de nómina del personal.
- Manejo de sistemas contables avanzados.
- Integración con plataformas externas de facturación o entidades bancarias.

Estas funciones no forman parte del objetivo principal del proyecto, ya que la solución se centra exclusivamente en la organización de reservas, pagos, comunicación y administración de la cancha sintética.

---

## ✅ Conclusiones

La implementación del sistema de reservas digitales para la cancha sintética representa una solución efectiva a los problemas actuales de desorden, pérdida de información y baja difusión de eventos.

Al centralizar todos los procesos en una sola plataforma, se logra:

- Optimizar la administración.
- Reducir el papeleo físico y los tiempos de gestión.
- Mejorar la comunicación mediante notificaciones automáticas.
- Facilitar la toma de decisiones gracias a reportes y estadísticas.

---

## 🛠️ Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/samuelduarte-pixel/Cancha-Gremio-Rep-.git
cd Cancha-Gremio-Rep-
```

### 2. Levantar la base de datos

```bash
docker compose up -d
docker compose ps
# Debe mostrar nn_auth_db con estado "healthy"
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

## ▶️ Ejecución

```bash
# Terminal 1 — Base de datos
docker compose up -d

# Terminal 2 — Backend (FastAPI)
cd be && source .venv/Scripts/activate
uvicorn app.main:app --reload
# → API en http://localhost:8000
# → Swagger UI en http://localhost:8000/docs

# Terminal 3 — Frontend (React)
cd fe && pnpm dev
# → App en http://localhost:5173
```

---

## 🧪 Testing

### Backend

```bash
cd be && source .venv/Scripts/activate

# Todos los tests
pytest -v

# Con cobertura
pytest --cov=app --cov-report=term-missing
```

**Resultado:** ✅ 32/32 tests pasando

### Frontend

```bash
cd fe

# Todos los tests
pnpm test

# Con cobertura
pnpm test:coverage
```

**Resultado:** ✅ 82/82 tests pasando

En conclusión, el proyecto cumple con el objetivo de modernizar y organizar la operación de la cancha, mejorando significativamente la experiencia tanto de los clientes como de los administradores.

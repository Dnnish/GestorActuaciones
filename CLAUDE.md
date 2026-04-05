# MiniDrive — Sistema de Gestión Documental

## Descripcion del Proyecto

MiniDrive es un sistema web de gestión documental empresarial para organizar archivos por proyectos (actuaciones). Cada actuación contiene secciones fijas (postes, cámaras, fachadas, fotos) con validación de formato por sección, más una sección especial PETs con conversión automática de imágenes a JPG. Incluye control de acceso basado en roles (RBAC) con tres niveles de usuario.

## Stack Tecnologico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + TypeScript + Vite |
| UI | Shadcn/ui + Tailwind CSS 4 |
| State/Fetch | TanStack Query v5 |
| Backend | Node.js + TypeScript + Fastify |
| ORM | Drizzle ORM |
| Base de datos | PostgreSQL 16 |
| Storage | MinIO (S3-compatible) |
| Auth | Better Auth |
| Procesamiento de imagenes | Sharp |
| Visor PDF | react-pdf |
| Monorepo | Turborepo + pnpm workspaces |

## Estructura del Monorepo

```
MiniDrive/
├── apps/
│   ├── web/                 # React SPA (Vite)
│   └── api/                 # Fastify API
├── packages/
│   ├── shared/              # Tipos, constantes, validaciones compartidas
│   └── db/                  # Schema Drizzle + migraciones
├── turbo.json
├── package.json
├── docker-compose.yml       # PostgreSQL + MinIO para desarrollo
└── CLAUDE.md
```

## Modelo de Dominio

### Entidades

- **User**: id, email, passwordHash, name, role, createdAt, deletedAt (soft delete)
- **Actuacion**: id, name, createdById (FK User), coliseoStatus, createdAt, updatedAt
- **Document**: id, actuacionId (FK), folder (enum), filename, storageKey, mimeType, size, uploadedById (FK User), uploadedAt

### Roles y Permisos

| Accion | Superadmin | Admin | User |
|--------|-----------|-------|------|
| CRUD usuarios | SI | NO | NO |
| Crear actuaciones | SI | SI | NO |
| Eliminar actuaciones | TODAS | Solo propias | NO |
| Subir archivos | SI | SI | SI |
| Descargar archivos | SI | SI | SI |
| Marcar coliseo | SI | SI | NO |

### Carpetas por Actuacion (enum, no tabla)

```typescript
enum Folder {
  POSTES = 'postes',       // solo PDF
  CAMARAS = 'camaras',     // solo PDF
  FACHADAS = 'fachadas',   // solo PDF
  FOTOS = 'fotos',         // imagenes (cualquier formato)
  PETS = 'pets',           // imagenes (conversion automatica a JPG)
  PLANOS = 'planos',       // PDF + KMZ
}
```

### Validacion de Formatos por Carpeta

| Carpeta | Formatos permitidos |
|---------|-------------------|
| postes, camaras, fachadas | application/pdf |
| fotos | image/* |
| pets | image/* (conversion automatica a JPG via Sharp) |
| planos | application/pdf, application/vnd.google-earth.kmz |

## Reglas de Negocio

- Los usuarios eliminados se marcan con `deletedAt` (soft delete), NUNCA se borran fisicamente. Esto preserva la trazabilidad de quien subio/modifico documentos.
- La busqueda de actuaciones es en tiempo real con debounce (300ms) usando trigram indexes de PostgreSQL (`pg_trgm`).
- Los documentos dentro de cada carpeta se ordenan por `uploadedAt DESC` (mas reciente primero).
- Las actuaciones en el listado general se agrupan/filtran por fecha de creacion.
- El campo `coliseoStatus` en la actuacion indica si fue subida a Coliseo. El frontend muestra un indicador visual de color (verde = subido, rojo/gris = pendiente).
- Los archivos binarios se almacenan en MinIO/S3, NUNCA en PostgreSQL.
- La validacion de formato se hace SIEMPRE en el backend (el frontend valida tambien pero como UX, no como seguridad).

## Convenciones de Codigo

### General

- TypeScript estricto (`strict: true`) en todo el monorepo
- Sin `any` explicitos — usar tipos concretos o `unknown` cuando sea necesario
- Nombres de archivo: kebab-case (`user-service.ts`, `upload-button.tsx`)
- Imports con alias `@/` para cada app/package

### Backend (API)

- Arquitectura: routes -> handlers -> services -> repositories
- Validacion de input con esquemas Zod integrados en Fastify
- Errores tipados con codigos HTTP correctos (no todo es 500)
- Middleware de auth y RBAC como plugins de Fastify
- Logs estructurados con Pino (viene con Fastify)

### Frontend (Web)

- Componentes: PascalCase (`ActuacionCard.tsx`)
- Hooks custom: `use-` prefix en kebab-case (`use-actuaciones.ts`)
- Paginas en directorio `pages/` con lazy loading
- Formularios con React Hook Form + Zod
- NO usar estado global — TanStack Query como cache del servidor

### Base de Datos

- Nombres de tabla: snake_case plural (`users`, `actuaciones`, `documents`)
- Nombres de columna: snake_case (`created_at`, `uploaded_by_id`)
- Todas las tablas tienen `id` (UUID v7), `created_at`
- Foreign keys NO usan CASCADE DELETE — preservar integridad referencial
- Migraciones versionadas con Drizzle Kit

### Testing

- Tests unitarios para servicios y utilidades
- Tests de integracion para endpoints de la API con base de datos real (NO mocks de BD)
- Frontend: tests de componentes con Vitest + Testing Library

## Comandos de Desarrollo

```bash
pnpm install              # Instalar dependencias
pnpm dev                  # Levantar todo (API + Web + DB + MinIO)
pnpm dev --filter=api     # Solo API
pnpm dev --filter=web     # Solo Frontend
pnpm db:generate          # Generar migracion Drizzle
pnpm db:migrate           # Ejecutar migraciones
pnpm db:studio            # Abrir Drizzle Studio
pnpm test                 # Tests en todo el monorepo
pnpm lint                 # Lint en todo el monorepo
pnpm build                # Build de produccion
```

## Variables de Entorno

```env
# Base de datos
DATABASE_URL=postgresql://minidrive:minidrive@localhost:5432/minidrive

# MinIO / S3
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=minidrive

# Auth
AUTH_SECRET=<random-secret-for-sessions>

# API
API_PORT=3001
API_HOST=0.0.0.0

# Frontend
VITE_API_URL=http://localhost:3001
```

## Skills

<!-- Las skills se añaden aqui. Cada skill sigue el formato:
### Skill: nombre
- Trigger: cuando se activa
- Archivo: ruta al archivo de la skill
-->

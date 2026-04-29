# GGPC Security Management System

Sistema completo de gestión de horarios para guardias de seguridad.

## 🚀 Instalación Local

```bash
cd ggpc-app
npm install
npm start
```

La aplicación abrirá en http://localhost:3000

## 🔐 Credenciales de Acceso

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `admin` | `GGPC2024!` | Administrador |
| `supervisor1` | `Super2024!` | Supervisor |
| `supervisor2` | `Super2024!` | Supervisor |
| `manager` | `Manager2024!` | Gerente RRHH |
| `director` | `Director2024!` | Director |

> **Importante:** Cambiar las contraseñas en `src/data/store.js` antes de producción.

## 📄 Páginas del Sistema

1. **Dashboard** — Vista general de todos los empleados, turnos y alertas de vacantes
2. **Empleados** — CRUD completo de guardias (FT/PT, días disponibles, tarifa, etc.)
3. **Puestos** — Gestión de puestos de seguridad y sus turnos
4. **Plan Bisemanal** — Horario auto-generado para 2 semanas, exportable a PDF
5. **Vacantes** — Gestión de vacantes con búsqueda de empleados disponibles + cálculo de overtime
6. **Citas** — Registro de citas médicas y ausencias que bloquean asignaciones

## ⚖️ Cumplimiento Legal

El scheduler automático cumple con:
- **FLSA Federal:** Overtime después de 40h/semana (×1.5)
- **Ley 379 PR:** Jornada máxima de 8h, overtime diario
- **Ley 180 PR:** Domingos = paga doble (×2.0)
- **Mínimo salarial PR:** $8.50/hora mínimo (configurable)
- Respeto de días disponibles por empleado
- Verificación automática de citas/ausencias
- Control de límites part-time (máx. 24h/sem configurable)

## 🚀 Deploy en Vercel

### Opción 1: Vercel CLI
```bash
npm install -g vercel
cd ggpc-app
npm run build
vercel --prod
```

### Opción 2: GitHub + Vercel (Recomendado)
1. Subir el proyecto a GitHub
2. Ir a https://vercel.com/new
3. Importar el repositorio
4. Settings:
   - **Framework Preset:** Create React App
   - **Root Directory:** `ggpc-app`
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`
5. Click **Deploy**

### Opción 3: Vercel Dashboard
1. Comprimir carpeta `ggpc-app` en ZIP
2. Ir a https://vercel.com/new
3. Drag & drop el ZIP
4. Configure como Create React App

## 📱 Funcionalidades Principales

- ✅ Login seguro (5 usuarios, sesión en sessionStorage)
- ✅ Dashboard con estado de todos los empleados
- ✅ Generación automática de horario bisemanal
- ✅ Vista por empleado y por puesto
- ✅ Detección automática de vacantes
- ✅ Búsqueda de empleados disponibles con cálculo de overtime
- ✅ Exportación a PDF (horarios + vacantes + por puesto)
- ✅ Registro de citas médicas sincronizado con scheduler
- ✅ Soporte full-time y part-time
- ✅ Días disponibles configurables por empleado

## 🔧 Personalización

### Añadir logo GGPC
1. Coloca el logo en `public/logo.png`
2. Reemplaza el SVG del escudo en `src/components/Layout.jsx` y `src/pages/Login.jsx` con:
   ```html
   <img src="/logo.png" alt="GGPC" style="height: 38px" />
   ```

### Cambiar colores corporativos
Los colores principales están en los componentes. Buscar:
- `#0a1628` → Azul oscuro (sidebar, headers)
- `#1e5fa8` → Azul principal
- `#0f6e56` → Verde

### Base de datos en producción
Actualmente usa `localStorage` (datos por navegador). Para persistencia real:
- Integrar con **Firebase Firestore** (gratis para proyectos pequeños)
- O **Supabase** (PostgreSQL gratuito)
- Reemplazar funciones en `src/data/store.js`

## 📋 Estructura del Proyecto

```
ggpc-app/
├── public/
│   └── index.html
├── src/
│   ├── data/
│   │   └── store.js          # Almacenamiento local (CRUD)
│   ├── utils/
│   │   ├── scheduler.js      # Motor de scheduling
│   │   └── pdfExport.js      # Generación de PDF
│   ├── hooks/
│   │   └── useAuth.js        # Contexto de autenticación
│   ├── components/
│   │   └── Layout.jsx        # Sidebar + navegación
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Empleados.jsx
│   │   ├── Puestos.jsx
│   │   ├── Horarios.jsx
│   │   └── Citas.jsx
│   ├── App.jsx               # Router principal
│   └── index.js
├── vercel.json               # Config para Vercel
└── package.json
```

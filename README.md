# 🎓 Sistema de Seguimiento Académico

Un sistema web moderno para que estudiantes puedan gestionar y dar seguimiento a su desempeño académico, permitiendo organizar semestres, materias y actividades con un cálculo automático de notas.

![Sistema de Seguimiento Académico](https://via.placeholder.com/800x400?text=Sistema+de+Seguimiento+Acad%C3%A9mico)

## 📋 Índice

- [Descripción](#-descripción)
- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Instalación](#-instalación)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Uso](#-uso)
- [Seguridad](#-seguridad)
- [Licencia](#-licencia)

## 📝 Descripción

El Sistema de Seguimiento Académico es un sistema web diseñado para ayudar a estudiantes a llevar un control detallado de su rendimiento académico a través de semestres, materias y diferentes tipos de evaluaciones. Permite configurar sistemas de evaluación personalizados, registrar actividades y calificaciones, y visualizar el progreso en tiempo real.

## ✨ Características

### Gestión de Semestres
- Crear, editar y eliminar semestres académicos
- Búsqueda y filtrado de semestres
- Selección múltiple para eliminación por lote

### Gestión de Materias
- Agregar materias a los semestres con nota mínima configurable
- Cálculo automático de notas y conversión a letras (A, B, C, D, F)
- Visualización del porcentaje de curso evaluado

### Sistema de Evaluación Flexible
- Dos modos de cálculo: dinámico y fijo
- Categorías personalizables (parciales, laboratorios, etc.)
- Control de porcentajes con validación automática

### Gestión de Actividades
- Registro detallado de actividades y calificaciones
- Soporte para actividades pendientes (no calificadas)
- Cálculo de porcentajes y contribución a la nota final

### Interfaz de Usuario
- Diseño responsive con Tailwind CSS
- Feedback visual con notificaciones toast
- Navegación intuitiva entre componentes

### Seguridad
- Autenticación de usuarios con email y contraseña
- Políticas de Row Level Security (RLS) en la base de datos
- Protección de datos personales

## 🛠️ Tecnologías

- **Frontend**: React.js, Next.js
- **Estilos**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL)
- **Autenticación**: Supabase Auth
- **Despliegue**: Vercel

## 🚀 Instalación

### Prerrequisitos
- Node.js (v14 o superior)
- npm o yarn
- Cuenta en Supabase

### Pasos de instalación

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/sistema-notas.git
   cd sistema-notas
   ```

2. Instalar dependencias:
   ```bash
   npm install
   # o
   yarn install
   ```

3. Configurar variables de entorno:
   - Crea un archivo `.env.local` en la raíz del proyecto:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anonima
   ```

4. Configurar la base de datos en Supabase:
   - Inicia sesión en Supabase
   - Crea un nuevo proyecto

5. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   # o
   yarn dev
   ```

6. Abrir [http://localhost:3000](http://localhost:3000) en el navegador.
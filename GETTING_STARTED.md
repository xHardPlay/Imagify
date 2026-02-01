# 🚀 Getting Started with Imagify

## ⚡ Quick Start

### Opción 1: Acceso Directo
**Visita**: https://flux-studio-ai.pages.dev/

### Opción 2: Desarrollo Local
1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Open in Browser**
   Visit `http://localhost:5173`

---

## 🎯 Primeros Pasos

### 1. Configurar API Key
- Al abrir la aplicación por primera vez, se cargarán configuraciones por defecto
- Para usar tu propia API key: Configuración → API Settings
- Obtén tu API key en: https://makersuite.google.com/app/apikey
- Tu API key se almacena localmente y nunca se envía a servidores externos

### 2. Workflows Predefinidos
La aplicación incluye 3 workflows listos para usar:

#### 🖼️ Image Reversion
- **Propósito**: Análisis para ComfyUI
- **Variables**: Image Title, Image Prompt
- **Uso**: Genera prompts detallados para recrear imágenes

#### 🎬 IMG2VID
- **Propósito**: Conversión de imagen a video
- **Variables**: Video Title, Video Prompt
- **Uso**: Crea prompts para generar videos desde imágenes

#### 🎭 Multi Video
- **Propósito**: Crear 5 secuencias de video
- **Variables**: Sequences
- **Uso**: Genera 5 videos correlativos desde una imagen

### 3. Crear tu Primer Workflow Personalizado
1. Click "New Workflow" en la barra lateral
2. Dale un nombre descriptivo (ej: "Análisis de Productos")
3. Agrega una descripción explicando qué quieres analizar

### 4. Definir Variables
1. Click "Add Variable" para crear tu primera variable
2. Ejemplos de variables:
   - **Name**: "color palette" | **Type**: "color" | **Description**: "Extract dominant colors from the image"
   - **Name**: "number of people" | **Type**: "number" | **Description**: "Count how many people are in the photo"
   - **Name**: "mood/emotion" | **Type**: "text" | **Description**: "Describe the overall mood or emotion conveyed"

### 5. Analizar Imágenes
1. Cambia a la pestaña "Image Analysis"
2. Sube o pega una imagen
3. La IA analizará la imagen y extraerá las variables que definiste

### 6. Ver Resultados
- Los resultados aparecen en la pestaña "Results"
- Puedes copiar resultados individuales o exportar todos los datos

---

## 🎨 Ejemplos de Workflows

### Análisis de Diseño
Variables a extraer:
- **Color Palette**: Colores primarios y secundarios con códigos hex
- **Typography Style**: Estilos de fuente y características
- **Layout Type**: Sistema de grid, alineación, espaciado
- **Visual Hierarchy**: Cómo están organizados los elementos

### Análisis de Fotografía
Variables a extraer:
- **Number of People**: Conteo de personas en la imagen
- **Setting/Location**: Interior/exterior, tipo de ubicación específica
- **Lighting Conditions**: Natural, artificial, hora del día
- **Composition Style**: Regla de tercios, simetría, etc.

### Análisis de Productos
Variables a extraer:
- **Product Category**: Tipo de producto mostrado
- **Brand Elements**: Logos, texto, colores de marca
- **Product Count**: Número de artículos visibles
- **Background Style**: Limpio, lifestyle, estudio, etc.

---

## ⚙️ Características Avanzadas

### Tipos de Variables
- **Text**: Para información descriptiva
- **Number**: Para conteos, mediciones, calificaciones
- **Color**: Para extracción de colores con códigos hex
- **Boolean**: Para preguntas sí/no
- **List**: Para múltiples elementos o categorías

### Tips para Mejores Resultados
1. **Sé Específico**: Descripciones claras de variables ayudan a la IA a entender qué extraer
2. **Usa Ejemplos**: Incluye ejemplos en las descripciones cuando sea posible
3. **Empieza Simple**: Comienza con variables básicas y agrega complejidad gradualmente
4. **Prueba Iterativamente**: Prueba diferentes imágenes para refinar tu workflow

---

## 🔧 Troubleshooting

### Problemas Comunes

**API Key No Funciona**
- Asegúrate de que tu API key empiece con "AIza"
- Verifica que tu API key tenga acceso a Gemini API habilitado
- Confirma que tu facturación de Google Cloud esté configurada

**Resultados de Análisis Pobres**
- Haz las descripciones de variables más específicas
- Prueba diferentes tipos de imágenes
- Ajusta la temperatura del modelo IA en configuraciones

**Problemas de Subida de Imágenes**
- Asegúrate de que las imágenes estén en formatos soportados (JPEG, PNG, WebP)
- Verifica el tamaño del archivo (recomendado < 10MB)
- Intenta refrescar la página

### Obtener Ayuda
- Revisa la consola para mensajes de error (F12 en el navegador)
- Asegúrate de que todas las variables estén configuradas correctamente
- Verifica tu conexión a internet para las llamadas a la API

---

## 🏗️ Building para Producción

```bash
# Build de la aplicación
npm run build

# Preview del build
npm run preview

# Despliegue a Cloudflare Pages
npm run deploy:cloudflare
```

Los archivos construidos estarán en el directorio `dist` y pueden desplegarse en cualquier servicio de hosting estático.

---

## 🚀 Próximos Pasos

1. **Mejorar Análisis**: Agrega variables más sofisticadas y workflows
2. **Procesamiento por Lotes**: Procesa múltiples imágenes con el mismo workflow
3. **Integración de Exportación**: Conecta resultados a tus herramientas de diseño
4. **Colaboración en Equipo**: Comparte workflows con miembros del equipo
5. **Prompts Personalizados**: Ajusta prompts de IA para casos de uso específicos

---

## 📊 Estado Actual del Proyecto

- **Versión**: 0.1.0
- **Estado**: ✅ En producción
- **URL**: https://flux-studio-ai.pages.dev/
- **Último despliegue**: Exitoso
- **Dependencias**: Actualizadas y estables

### Funcionalidades Implementadas
- ✅ Análisis de imágenes con Google Gemini AI
- ✅ OCR con Tesseract.js
- ✅ Gestión de workflows personalizables
- ✅ Variables dinámicas (text, number, color, boolean, list)
- ✅ Interfaz moderna con React + TypeScript
- ✅ Persistencia local con localStorage
- ✅ Despliegue en Cloudflare Pages

¡Feliz análisis! 🎨✨

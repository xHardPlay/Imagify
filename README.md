# 🚀 Imagify - AI-Powered Image Analysis & Workflow Management

## 📊 Estado del Proyecto
**Versión**: 0.1.0  
**Estado**: ✅ **PRODUCCIÓN**  
**URL**: https://neurovision-33m.pages.dev/
**Último despliegue**: Exitoso  
**Fecha**: Agosto/1/2025  

---

## 🎯 Descripción del Proyecto

Neuro Visión es una aplicación web moderna que utiliza inteligencia artificial para analizar imágenes y extraer información valiosa. Diseñada para creadores de contenido, diseñadores y desarrolladores que necesitan automatizar el análisis de imágenes y generar prompts detallados.

### ✨ Características Principales

- **🤖 Análisis con IA**: Integración con Google Gemini AI para análisis inteligente de imágenes
- **📝 OCR Avanzado**: Reconocimiento de texto con Tesseract.js
- **⚙️ Workflows Personalizables**: Crear y gestionar flujos de trabajo personalizados
- **🎨 Variables Dinámicas**: Extracción automática de datos específicos
- **📱 Interfaz Moderna**: Diseño responsive con React y Tailwind CSS
- **💾 Persistencia Local en modo Pro**: Configuraciones guardadas automáticamente

---

## 🚀 Despliegue Rápido

### Opción 1: Acceso Directo
**Visita**: https://eafedefe.neurovision-33m.pages.dev

### Opción 2: Desarrollo Local
```bash
git clone <repository-url>
cd imagify
npm install
npm run dev
```

---

## 🎨 Workflows Predefinidos

### 1. 🖼️ Image Reversion
**Propósito**: Análisis para ComfyUI y generación de prompts  
**Variables**: 
- Image Title (título descriptivo)
- Image Prompt (prompt detallado para recrear la imagen)

### 2. 🎬 IMG2VID
**Propósito**: Conversión de imagen a video  
**Variables**:
- Video Title (título del video)
- Video Prompt (prompt para generar video con movimientos de cámara)

### 3. 🎭 Multi Video
**Propósito**: Crear 5 secuencias de video correlativas  
**Variables**:
- Sequences (5 prompts para videos secuenciales)

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 18.3.1** - Framework principal
- **TypeScript 5.8.3** - Tipado estático
- **Tailwind CSS 3.4.17** - Estilos y diseño
- **Vite 5.0.8** - Build tool y dev server
- **Lucide React 0.294.0** - Iconografía

### APIs y Servicios
- **Google Generative AI 0.17.2** - Análisis de imágenes con IA
- **Tesseract.js 5.1.1** - Reconocimiento óptico de caracteres
- **React Dropzone 14.3.8** - Subida de archivos

### Despliegue
- **Cloudflare Pages** - Hosting y CDN global
- **Wrangler** - CLI para Cloudflare

---

## 📁 Estructura del Proyecto

```
imagify/
├── 📄 package.json          # Dependencias y scripts
├── 📄 vite.config.ts        # Configuración de Vite
├── 📄 wrangler.toml         # Configuración Cloudflare
├── 📄 tsconfig.json         # Configuración TypeScript
├── 📄 tailwind.config.js    # Configuración Tailwind
├── 📁 src/
│   ├── 📄 App.tsx           # Componente principal (372 líneas)
│   ├── 📁 components/
│   │   ├── 📁 ImageUpload/      # Subida de imágenes
│   │   ├── 📁 VariableManager/  # Gestión de variables
│   │   ├── 📁 ResultsDisplay/   # Visualización de resultados
│   │   ├── 📁 APIKeyManager/    # Gestión de API keys
│   │   └── 📄 ImportExportModal.tsx
│   ├── 📁 hooks/
│   │   └── 📄 useLocalStorage.ts
│   ├── 📁 services/
│   │   └── 📄 defaultConfig.ts  # Configuración por defecto
│   ├── 📁 types/
│   │   └── 📄 index.ts          # Definiciones de tipos
│   └── 📁 utils/
├── 📁 public/               # Archivos estáticos
├── 📁 dist/                 # Build de producción
└── 📁 cfg/                  # Configuraciones
```

---

## 🔧 Configuración

### Variables de Entorno (Opcional)
```env
VITE_DEFAULT_API_MODEL=gemini-1.5-flash
VITE_APP_NAME=Imagify
```

### API Key de Google Gemini
1. Visita [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crea una nueva API key
3. Configúrala en la aplicación

---

## 📊 Métricas de Rendimiento

### Build de Producción
- **Tamaño total**: ~240KB (comprimido)
- **CSS**: 35.86KB (6.08KB gzipped)
- **JavaScript**: 204.89KB (61.86KB gzipped)
- **Tiempo de build**: ~2.13 segundos

### Optimizaciones
- ✅ Code splitting automático
- ✅ Compresión gzip
- ✅ Minificación de código
- ✅ Tree shaking
- ✅ Lazy loading

---

## 🚀 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo
npm run preview          # Preview del build

# Build
npm run build            # Build de producción
npm run lint             # Linting del código

# Despliegue
npm run deploy:cloudflare    # Despliegue a Cloudflare Pages
npm run deploy:vercel        # Despliegue a Vercel
npm run deploy:netlify       # Despliegue a Netlify
```

---

## 🔐 Seguridad

### API Keys
- ✅ Configuración segura de Google Gemini API
- ✅ Almacenamiento local en localStorage
- ✅ Validación de credenciales
- ⚠️ **Nota**: Migrar a variables de entorno en futuras versiones

### Manejo de Datos
- ✅ Procesamiento local de imágenes
- ✅ No almacenamiento de imágenes en servidor
- ✅ Configuración local persistente

---

## 🚨 Problemas Conocidos

### ⚠️ Problemas Menores
1. **API Key hardcodeada**: Existe una API key en defaultConfig.ts
2. **Logs de consola**: Muchos console.log en producción
3. **Validación**: Falta validación robusta de inputs

### 🔧 Mejoras Sugeridas
1. **Manejo de errores**: Mejorar feedback al usuario
2. **Loading states**: Mejorar indicadores de carga
3. **Responsive design**: Optimizar para móviles
4. **Accesibilidad**: Mejorar navegación por teclado

---

## 📈 Roadmap

### 🎯 Próximas Funcionalidades
- [ ] Exportación de resultados (JSON, CSV)
- [ ] Batch processing de múltiples imágenes
- [ ] Templates de workflows predefinidos
- [ ] Historial de análisis con búsqueda
- [ ] Integración con herramientas de diseño

### 🔄 Mejoras Técnicas
- [ ] Migración a variables de entorno para API keys
- [ ] Implementación de tests unitarios
- [ ] Optimización de bundle size
- [ ] Mejora de UX con animaciones
- [ ] Implementación de PWA features

---

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

---

## 📞 Soporte

- **Documentación**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Estado**: [APP_STATUS_LOG.md](APP_STATUS_LOG.md)
- **Inicio Rápido**: [GETTING_STARTED.md](GETTING_STARTED.md)

---

*Última actualización: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")*

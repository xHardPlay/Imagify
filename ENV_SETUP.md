# 🔧 Configuración de Variables de Entorno

## Cambios Realizados

Se ha actualizado la aplicación para usar variables de entorno (`.env`) en lugar de hardcodear la API key.

### ✅ Archivos Creados/Modificados

1. **`.env`** (Local - NO se sube a Git)
   - Contiene tu API key de Gemini
   - Solo en tu máquina local

2. **`.env.example`** (Público - Se sube a Git)
   - Template para otros desarrolladores
   - Muestra qué variables configurar

3. **`src/vite-env.d.ts`** (Nuevo)
   - Define tipos para variables de entorno en Vite

4. **`src/services/defaultConfig.ts`** (Modificado)
   - Lee variables de entorno en lugar de valores hardcodeados
   - Si no existe `.env`, usa valores por defecto

## 📋 Variables de Entorno

```env
VITE_GEMINI_API_KEY=
VITE_GEMINI_MODEL=gemini-1.5-flash
VITE_MAX_TOKENS=2000
VITE_TEMPERATURE=0.4
```

## 🚀 Cómo Usar

### Desarrollo Local

```bash
# 1. Instalar dependencias
npm install

# 2. El archivo .env ya está configurado con tu API key

# 3. Iniciar servidor de desarrollo
npm run dev
```

### Construir para Producción

```bash
npm run build
```

## ⚠️ Seguridad

- ✅ El archivo `.env` está en `.gitignore`
- ✅ Tu API key nunca se sube a Git
- ✅ Los cambios se hacen localmente
- ✅ Usa `.env.example` como referencia

## 🐛 Verificación

- ✅ Build: Exitoso
- ✅ Types: Sin errores
- ✅ Configuración: Cargada desde variables de entorno

## Si Algo No Funciona

1. Verifica que el archivo `.env` existe en la raíz del proyecto
2. Cierra VS Code y vuelve a abrir (para que Vite recargue las variables)
3. Limpia cache: `npm run build` desde cero
4. Verifica la API key es válida (comienza con "AIza")

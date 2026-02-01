@echo off
REM Imagify - Development Server Launcher
REM Este script instala dependencias y ejecuta el servidor local

echo.
echo ========================================
echo      IMAGIFY - LOCAL DEVELOPMENT
echo ========================================
echo.

REM Verificar si node_modules existe
if not exist "node_modules" (
    echo [INFO] Instalando dependencias...
    echo.
    call npm install
    if errorlevel 1 (
        echo [ERROR] Fallo al instalar dependencias
        pause
        exit /b 1
    )
    echo.
)

REM Iniciar servidor de desarrollo
echo [INFO] Iniciando servidor de desarrollo...
echo.
call npm run dev

pause

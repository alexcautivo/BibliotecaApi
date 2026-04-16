@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo ============================================
echo  Biblioteca - reinicio y arranque (8000+4200)
echo ============================================
echo.

echo Cerrando lo que escucha en 8000 y 4200 (PowerShell)...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\kill-ports.ps1" 8000 4200

timeout /t 1 /nobreak >nul

echo.
echo Abriendo backend ^(uvicorn^) y frontend ^(ng serve^) en ventanas nuevas...
echo.

start "Biblioteca BACKEND :8000" cmd /k cd /d "%~dp0backend" ^&^& python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
start "Biblioteca FRONTEND :4200" cmd /k cd /d "%~dp0frontend" ^&^& npm start

echo Listo. API: http://127.0.0.1:8000/docs   Angular: http://localhost:4200/
echo Comprueba GET /api/salud: debe incluir "capacidades".
echo Cierra cada ventana con Ctrl+C o con la X para detener ese proceso.
echo.
pause

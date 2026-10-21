@echo off
title Kick Prediction Overlay - OBS Server
cls
echo ============================================================
echo         KICK PREDICTION OVERLAY PARA OBS STUDIO
echo ============================================================
echo.
echo Iniciando servidor local en http://localhost:8080 ...
echo.

where python >nul 2>nul
if %errorlevel% equ 0 (
    echo Usando Python para servir los archivos...
    python -m http.server 8080
    goto end
)

where deno >nul 2>nul
if %errorlevel% equ 0 (
    echo Usando Deno para servir los archivos...
    deno run --allow-net --allow-read https://deno.land/std/http/file_server.ts -p 8080
    goto end
)

echo Abriendo directamente en el navegador...
start index.html

:end
pause

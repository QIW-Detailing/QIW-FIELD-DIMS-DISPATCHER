@echo off
title QIW- Field dimention dispatcher
echo ========================================================
echo   Launching QIW- Field dimention dispatcher
echo ========================================================
echo.
timeout /t 2 /nobreak >nul
start http://localhost:5000
python app.py
pause

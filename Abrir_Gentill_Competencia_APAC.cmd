@echo off
setlocal

set "APP=%~dp0src\index.html"

if not exist "%APP%" (
  echo.
  echo Gentill Competencia APAC
  echo ERRO: arquivo src\index.html nao encontrado.
  echo.
  pause
  exit /b 1
)

for %%I in ("%APP%") do set "APP_FULL=%%~fI"
set "APP_URL=file:///%APP_FULL:\=/%"

where msedge.exe >nul 2>&1
if %errorlevel%==0 (
  start "Gentill Competencia APAC" msedge.exe --app="%APP_URL%"
  exit /b 0
)

start "Gentill Competencia APAC" "%APP_FULL%"
exit /b 0

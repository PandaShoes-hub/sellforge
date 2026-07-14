@echo off
cd /d %~dp0
if not exist node_modules (
  echo A instalar dependencias...
  call npm install
)
call shopify app dev
pause

@echo off
setlocal
cd /d "%~dp0\.."
node server\index.js > server-runtime.log 2> server-runtime.err.log

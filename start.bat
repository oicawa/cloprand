@echo off
setlocal
set TAMES_CONFIG_PATH=%1
lein ring server-headless
pause

@echo off
chcp 65001 >nul
cd /d "%~dp0"
python manage_users.py
if errorlevel 1 (
    echo.
    echo 程式執行出錯，請檢查 Python 是否已安裝
    pause
)


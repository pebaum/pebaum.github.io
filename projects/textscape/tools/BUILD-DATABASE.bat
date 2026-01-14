@echo off
REM Textscape Knowledge Base Builder - Windows Launcher
REM Run this to build the complete database

echo.
echo ====================================================================
echo   TEXTSCAPE KNOWLEDGE BASE BUILDER
echo ====================================================================
echo.
echo This will download and process 60,000+ words into a music database
echo.
echo Requirements:
echo   - Python 3.6 or higher
echo   - Internet connection (for downloading lexicons)
echo.
echo Time: ~2-3 minutes
echo Cost: $0 (all free resources)
echo.
echo ====================================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found!
    echo.
    echo Please install Python 3.6+ from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation
    echo.
    pause
    exit /b 1
)

echo Python found! Starting build process...
echo.

REM Run the build script
python build-complete-database.py

echo.
echo ====================================================================
pause

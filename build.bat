@echo off
REM Build script for Windows
REM This script builds both frontend and backend for production

echo ================================
echo Building RAG Chatbot Application
echo ================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org
    exit /b 1
)

REM Check if Python is installed
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Python is not installed!
    echo Please install Python from https://python.org
    exit /b 1
)

echo [1/4] Installing backend dependencies...
cd backend
pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install backend dependencies
    exit /b 1
)
echo ✓ Backend dependencies installed
echo.

echo [2/4] Installing frontend dependencies...
cd ../frontend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install frontend dependencies
    exit /b 1
)
echo ✓ Frontend dependencies installed
echo.

echo [3/4] Type checking frontend...
call npm run typecheck
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Type checking failed (continuing anyway)
)
echo ✓ Type checking complete
echo.

echo [4/4] Building frontend for production...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to build frontend
    exit /b 1
)
echo ✓ Frontend built successfully
echo.

cd ..

echo ================================
echo Build Complete!
echo ================================
echo.
echo Next steps:
echo 1. Test the build: cd frontend ^&^& npm run preview
echo 2. Configure environment: copy .env.example .env
echo 3. Deploy using Docker: docker-compose up -d
echo.

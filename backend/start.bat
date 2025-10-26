@echo off
REM Quick Start Script for RAG Chatbot Backend (Windows)

echo ============================================
echo RAG Chatbot Backend - Quick Start
echo ============================================
echo.

REM Check if Python is installed
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not installed!
    echo Please install Python from https://python.org
    exit /b 1
)

REM Check if virtual environment exists
if not exist "venv\" (
    echo [1/5] Creating virtual environment...
    python -m venv venv
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to create virtual environment
        exit /b 1
    )
    echo [OK] Virtual environment created
) else (
    echo [OK] Virtual environment already exists
)
echo.

REM Activate virtual environment
echo [2/5] Activating virtual environment...
call venv\Scripts\activate
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to activate virtual environment
    exit /b 1
)
echo [OK] Virtual environment activated
echo.

REM Install dependencies
echo [3/5] Installing dependencies...
pip install -r requirements.txt --quiet
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install dependencies
    exit /b 1
)
echo [OK] Dependencies installed
echo.

REM Check .env file
echo [4/5] Checking environment configuration...
if not exist ".env" (
    echo [WARNING] .env file not found!
    echo Please create .env file from .env.example
    echo and configure your GOOGLE_API_KEY and MONGODB_URI
    echo.
    pause
    REM Continuing without .env file - server may fail if environment variables are not set
) else (
    echo [OK] .env file found
)
echo.

REM Start the server
echo [5/5] Starting FastAPI server...
echo.
echo ============================================
echo Server starting at http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo Health Check: http://localhost:8000/api/health
echo ============================================
echo.
echo Press Ctrl+C to stop the server
echo.

python -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000

@echo off
REM Quick Start Script for RAG Chatbot Backend

echo ============================================
echo RAG Chatbot Backend - Quick Start
echo ============================================
echo.

REM Check if virtual environment exists
if not exist "venv\" (
    echo [1/5] Creating virtual environment...
    python -m venv venv
    echo ✓ Virtual environment created
) else (
    echo ✓ Virtual environment already exists
)
echo.

REM Activate virtual environment
echo [2/5] Activating virtual environment...
call venv\Scripts\activate
echo ✓ Virtual environment activated
echo.

REM Install dependencies
echo [3/5] Installing dependencies...
pip install -r requirements.txt --quiet
echo ✓ Dependencies installed
echo.

REM Check .env file
echo [4/5] Checking environment configuration...
if not exist ".env" (
    echo ⚠ Warning: .env file not found!
    echo Please create .env file from .env.example
    echo and configure your GOOGLE_API_KEY and MONGODB_URI
    pause
    exit /b 1
) else (
    echo ✓ .env file found
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

py -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
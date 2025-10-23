#!/bin/bash
# Build script for Linux/Mac
# This script builds both frontend and backend for production

set -e  # Exit on error

echo "================================"
echo "Building RAG Chatbot Application"
echo "================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed!"
    echo "Please install Node.js from https://nodejs.org"
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python is not installed!"
    echo "Please install Python from https://python.org"
    exit 1
fi

echo "[1/4] Installing backend dependencies..."
cd backend
pip3 install -r requirements.txt
echo "✓ Backend dependencies installed"
echo ""

echo "[2/4] Installing frontend dependencies..."
cd ../frontend
npm install
echo "✓ Frontend dependencies installed"
echo ""

echo "[3/4] Type checking frontend..."
npm run typecheck || echo "WARNING: Type checking failed (continuing anyway)"
echo "✓ Type checking complete"
echo ""

echo "[4/4] Building frontend for production..."
npm run build
echo "✓ Frontend built successfully"
echo ""

cd ..

echo "================================"
echo "Build Complete!"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Test the build: cd frontend && npm run preview"
echo "2. Configure environment: cp .env.example .env"
echo "3. Deploy using Docker: docker-compose up -d"
echo ""

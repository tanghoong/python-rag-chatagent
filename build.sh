#!/bin/bash
# Build script for Linux/Mac
# This script builds both frontend and backend for production

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Building RAG Chatbot Application${NC}"
echo -e "${BLUE}================================${NC}"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}ERROR: Node.js is not installed!${NC}"
    echo "Please install Node.js from https://nodejs.org"
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}ERROR: Python is not installed!${NC}"
    echo "Please install Python from https://python.org"
    exit 1
fi

echo -e "${BLUE}[1/4] Installing backend dependencies...${NC}"
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip3 install -r requirements.txt -q
echo -e "${GREEN}✓ Backend dependencies installed${NC}"
echo ""

echo -e "${BLUE}[2/4] Installing frontend dependencies...${NC}"
cd ../frontend
npm install
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
echo ""

echo -e "${BLUE}[3/4] Type checking frontend...${NC}"
if npm run typecheck; then
    echo -e "${GREEN}✓ Type checking complete${NC}"
else
    echo -e "${YELLOW}WARNING: Type checking failed (continuing anyway)${NC}"
fi
echo ""

echo -e "${BLUE}[4/4] Building frontend for production...${NC}"
npm run build
echo -e "${GREEN}✓ Frontend built successfully${NC}"
echo ""

cd ..

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Build Complete!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Next steps:"
echo "1. Test the build: cd frontend && npm run preview"
echo "2. Configure environment: cp backend/.env.example backend/.env"
echo "3. Deploy using Docker: docker-compose up -d"
echo ""

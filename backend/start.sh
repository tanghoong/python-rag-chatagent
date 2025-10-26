#!/bin/bash
# Quick Start Script for RAG Chatbot Backend (Linux/Mac)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}RAG Chatbot Backend - Quick Start${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}ERROR: Python 3 is not installed!${NC}"
    echo "Please install Python 3 from https://python.org"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${BLUE}[1/5] Creating virtual environment...${NC}"
    python3 -m venv venv
    echo -e "${GREEN}✓ Virtual environment created${NC}"
else
    echo -e "${GREEN}✓ Virtual environment already exists${NC}"
fi
echo ""

# Activate virtual environment
echo -e "${BLUE}[2/5] Activating virtual environment...${NC}"
source venv/bin/activate
echo -e "${GREEN}✓ Virtual environment activated${NC}"
echo ""

# Install dependencies
echo -e "${BLUE}[3/5] Installing dependencies...${NC}"
pip install -r requirements.txt -q
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Check .env file
echo -e "${BLUE}[4/5] Checking environment configuration...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠ Warning: .env file not found!${NC}"
    echo "Please create .env file from .env.example"
    echo "and configure your GOOGLE_API_KEY and MONGODB_URI"
    echo ""
    read -p "Press Enter to continue anyway, or Ctrl+C to exit..."
else
    echo -e "${GREEN}✓ .env file found${NC}"
fi
echo ""

# Start the server
echo -e "${BLUE}[5/5] Starting FastAPI server...${NC}"
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}Server starting at http://localhost:8000${NC}"
echo -e "${GREEN}API Docs: http://localhost:8000/docs${NC}"
echo -e "${GREEN}Health Check: http://localhost:8000/api/health${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

python -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000

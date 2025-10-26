#!/bin/bash
# Development helper script for RAG Chatbot Backend

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

show_help() {
    echo -e "${BLUE}RAG Chatbot Backend - Development Helper${NC}"
    echo ""
    echo "Usage: ./dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  lint          - Run flake8 linter"
    echo "  format        - Auto-format code with autopep8"
    echo "  test          - Run tests (if available)"
    echo "  start         - Start development server"
    echo "  install       - Install dependencies"
    echo "  install-dev   - Install dev dependencies"
    echo "  clean         - Clean cache files"
    echo "  help          - Show this help message"
    echo ""
}

run_lint() {
    echo -e "${BLUE}Running linter...${NC}"
    python3 lint.py
}

run_format() {
    echo -e "${BLUE}Formatting code with autopep8...${NC}"
    # Using --aggressive twice enables level 2 aggressive formatting
    python3 -m autopep8 --in-place --aggressive --aggressive --recursive .
    echo -e "${GREEN}✓ Code formatted${NC}"
}

run_tests() {
    echo -e "${BLUE}Running tests...${NC}"
    # Add test command here when tests are configured
    echo -e "${YELLOW}⚠ No test suite configured yet${NC}"
}

start_server() {
    echo -e "${BLUE}Starting development server...${NC}"
    python -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
}

install_deps() {
    echo -e "${BLUE}Installing dependencies...${NC}"
    pip install -r requirements.txt
    echo -e "${GREEN}✓ Dependencies installed${NC}"
}

install_dev_deps() {
    echo -e "${BLUE}Installing dev dependencies...${NC}"
    pip install -r requirements.txt
    pip install -r requirements-dev.txt
    echo -e "${GREEN}✓ All dependencies installed${NC}"
}

clean_cache() {
    echo -e "${BLUE}Cleaning cache files...${NC}"
    find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
    find . -type f -name "*.pyc" -delete 2>/dev/null || true
    find . -type f -name "*.pyo" -delete 2>/dev/null || true
    find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
    echo -e "${GREEN}✓ Cache cleaned${NC}"
}

# Main script
cd "$(dirname "$0")"

case "${1:-help}" in
    lint)
        run_lint
        ;;
    format)
        run_format
        ;;
    test)
        run_tests
        ;;
    start)
        start_server
        ;;
    install)
        install_deps
        ;;
    install-dev)
        install_dev_deps
        ;;
    clean)
        clean_cache
        ;;
    help|*)
        show_help
        ;;
esac

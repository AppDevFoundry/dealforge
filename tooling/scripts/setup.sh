#!/bin/bash

# DealForge Development Setup Script
# Run this after cloning the repository

set -e

echo "🏗️  DealForge Development Setup"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check for required tools
check_command() {
    if command -v "$1" &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 is installed"
        return 0
    else
        echo -e "${RED}✗${NC} $1 is not installed"
        return 1
    fi
}

echo "Checking required dependencies..."
echo ""

# Required
check_command "node" || { echo "Please install Node.js 20+: https://nodejs.org/"; exit 1; }
check_command "pnpm" || { echo "Please install pnpm: npm install -g pnpm"; exit 1; }

# Optional (for full development)
check_command "rustc" || echo -e "${YELLOW}⚠${NC}  Rust not found (optional, needed for calc-engine)"
check_command "go" || echo -e "${YELLOW}⚠${NC}  Go not found (optional, needed for data-sync)"

echo ""

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${RED}✗${NC} Node.js version must be 20 or higher (found: $(node -v))"
    exit 1
fi
echo -e "${GREEN}✓${NC} Node.js version is compatible ($(node -v))"

echo ""
echo "Installing dependencies..."
pnpm install

echo ""
echo "Setting up environment..."

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    cp .env.example .env.local
    echo -e "${GREEN}✓${NC} Created .env.local from .env.example"
    echo -e "${YELLOW}⚠${NC}  Please edit .env.local with your actual values"
else
    echo -e "${GREEN}✓${NC} .env.local already exists"
fi

echo ""
echo "================================"
echo -e "${GREEN}✓${NC} Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Edit .env.local with your database and API credentials"
echo "  2. Run 'pnpm dev' to start the development server"
echo "  3. Open http://localhost:3000 in your browser"
echo ""

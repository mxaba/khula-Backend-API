#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Khula Smart Input - Complete Setup Script                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Node.js is installed
echo -e "${YELLOW}Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js v18 or higher.${NC}"
    echo -e "${YELLOW}Download from: https://nodejs.org/${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v) detected${NC}"
echo ""

# Check if PostgreSQL is installed
echo -e "${YELLOW}Checking PostgreSQL installation...${NC}"
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL client not found${NC}"
    echo -e "${YELLOW}Please install PostgreSQL first:${NC}"
    echo -e "  ${GREEN}macOS:${NC}    brew install postgresql@14"
    echo -e "  ${GREEN}Ubuntu:${NC}   sudo apt install postgresql postgresql-contrib"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✅ PostgreSQL detected${NC}"
    psql --version
fi
echo ""

# Install dependencies
echo -e "${YELLOW}📦 Installing npm dependencies...${NC}"
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    echo -e "${YELLOW}Common fixes:${NC}"
    echo -e "  1. Fix npm cache permissions:"
    echo -e "     ${GREEN}sudo chown -R \$(whoami) ~/.npm${NC}"
    echo -e "  2. Clean cache:"
    echo -e "     ${GREEN}npm cache clean --force${NC}"
    echo -e "  3. Try again:"
    echo -e "     ${GREEN}npm install${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Check if .env exists and update if needed
echo -e "${YELLOW}Configuring environment variables...${NC}"
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}✅ .env file created from .env.example${NC}"

    # Try to detect the correct username for PostgreSQL
    CURRENT_USER=$(whoami)
    echo -e "${YELLOW}Updating DATABASE_URL with your macOS username...${NC}"

    # Update .env with current user
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/postgres:postgres@/\${CURRENT_USER}@/" .env
        echo -e "${GREEN}✅ DATABASE_URL updated to use username: ${CURRENT_USER}${NC}"
    fi
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi
echo ""

# Run the comprehensive database setup
echo -e "${YELLOW}Running complete database setup...${NC}"
echo -e "${YELLOW}This will:${NC}"
echo -e "  ✓ Test database connection"
echo -e "  ✓ Create database if needed"
echo -e "  ✓ Generate Prisma Client"
echo -e "  ✓ Run migrations"
echo -e "  ✓ Offer to seed sample data"
echo ""

npm run db:setup

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Database setup failed${NC}"
    echo ""
    echo -e "${YELLOW}Manual troubleshooting:${NC}"
    echo -e "  1. Check PostgreSQL is running:"
    echo -e "     ${GREEN}brew services list | grep postgresql${NC}"
    echo -e "  2. Check DATABASE_URL in .env matches your PostgreSQL setup"
    echo -e "  3. For macOS Homebrew PostgreSQL, use your username ($(whoami))"
    echo -e "  4. Test connection:"
    echo -e "     ${GREEN}npm run db:test${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  🎉 Setup Complete!                                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ All systems ready!${NC}"
echo ""
echo -e "${YELLOW}Start developing:${NC}"
echo -e "  ${GREEN}npm run start:dev${NC}          - Start development server"
echo -e "  ${GREEN}npm run prisma:studio${NC}      - View database in browser"
echo -e "  ${GREEN}npm run db:test${NC}            - Test database connection"
echo ""
echo -e "${YELLOW}Access your API:${NC}"
echo -e "  📡 API:  ${GREEN}http://localhost:3000/api/v1${NC}"
echo -e "  📚 Docs: ${GREEN}http://localhost:3000/api/docs${NC}"
echo ""

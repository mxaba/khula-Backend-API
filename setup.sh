#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Khula Smart Input - Setup Script${NC}"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js v18 or higher.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v) detected${NC}"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL client not found. Make sure PostgreSQL is installed and running.${NC}"
else
    echo -e "${GREEN}✅ PostgreSQL detected${NC}"
fi

# Install dependencies
echo ""
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    echo -e "${YELLOW}If you see cache permission errors, try:${NC}"
    echo -e "   sudo chown -R \$(whoami) ~/.npm"
    echo -e "   npm cache clean --force"
    echo -e "   npm install"
    echo ""
    echo -e "${YELLOW}Note: .npmrc is configured to use --legacy-peer-deps automatically${NC}"
    exit 1
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo ""
    echo -e "${YELLOW}📝 Creating .env file from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ .env file created${NC}"
    echo -e "${YELLOW}⚠️  Please update DATABASE_URL in .env with your credentials${NC}"
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

# Generate Prisma Client
echo ""
echo -e "${YELLOW}🔨 Generating Prisma Client...${NC}"
npm run prisma:generate

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to generate Prisma Client${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Setup completed successfully!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Update DATABASE_URL in .env with your PostgreSQL credentials"
echo -e "  2. Create database: ${GREEN}createdb khula_db${NC}"
echo -e "  3. Run migrations: ${GREEN}npm run prisma:migrate${NC}"
echo -e "  4. Seed database (optional): ${GREEN}npx prisma db seed${NC}"
echo -e "  5. Start the app: ${GREEN}npm run start:dev${NC}"
echo ""
echo -e "${GREEN}📚 API docs will be available at: http://localhost:3000/api/docs${NC}"

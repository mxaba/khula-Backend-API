#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Khula Database Setup - Step by Step                      ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo ""

# Step 1: Check .env file
echo -e "${YELLOW}Step 1: Checking .env configuration...${NC}"
if [ -f .env ]; then
    echo -e "${GREEN}✅ .env file found${NC}"

    if grep -q "DATABASE_URL" .env; then
        echo -e "${GREEN}✅ DATABASE_URL is set${NC}"
        echo -e "${YELLOW}   Current DATABASE_URL:${NC}"
        grep DATABASE_URL .env | sed 's/:[^:@]*@/:****@/'
    else
        echo -e "${RED}❌ DATABASE_URL not found in .env${NC}"
        exit 1
    fi
else
    echo -e "${RED}❌ .env file not found${NC}"
    echo -e "${YELLOW}Creating from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✅ .env file created${NC}"
    echo -e "${YELLOW}⚠️  Please update DATABASE_URL in .env with your credentials${NC}"
    exit 1
fi
echo ""

# Step 2: Check PostgreSQL
echo -e "${YELLOW}Step 2: Checking PostgreSQL installation...${NC}"
if command -v psql &> /dev/null; then
    echo -e "${GREEN}✅ PostgreSQL client is installed${NC}"
    psql --version
else
    echo -e "${RED}❌ PostgreSQL client not found${NC}"
    echo -e "${YELLOW}Please install PostgreSQL first${NC}"
    exit 1
fi
echo ""

# Step 3: Test connection (this will fail if DB doesn't exist yet, that's ok)
echo -e "${YELLOW}Step 3: Testing database connection...${NC}"
node scripts/test-db-connection.js
CONNECTION_TEST=$?

if [ $CONNECTION_TEST -eq 0 ]; then
    echo -e "${GREEN}✅ Database connection successful${NC}"
else
    echo -e "${YELLOW}⚠️  Database might not exist yet (this is normal)${NC}"
    echo -e "${YELLOW}Will create it in next step...${NC}"
fi
echo ""

# Step 4: Create database
echo -e "${YELLOW}Step 4: Creating database if it doesn't exist...${NC}"
bash scripts/create-database.sh
echo ""

# Step 5: Test connection again
echo -e "${YELLOW}Step 5: Testing database connection again...${NC}"
node scripts/test-db-connection.js
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Database connection failed${NC}"
    exit 1
fi
echo ""

# Step 6: Generate Prisma Client
echo -e "${YELLOW}Step 6: Generating Prisma Client...${NC}"
npm run prisma:generate
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to generate Prisma Client${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Prisma Client generated${NC}"
echo ""

# Step 7: Run migrations
echo -e "${YELLOW}Step 7: Running database migrations...${NC}"
echo -e "${YELLOW}This will create all tables in the database${NC}"
npx prisma migrate dev --name init
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Migration failed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Migrations completed${NC}"
echo ""

# Step 8: Seed database
echo -e "${YELLOW}Step 8: Seeding database with sample data...${NC}"
read -p "Do you want to seed the database with sample data? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx prisma db seed
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database seeded successfully${NC}"
    else
        echo -e "${RED}❌ Seeding failed${NC}"
    fi
else
    echo -e "${YELLOW}⏭️  Skipping database seeding${NC}"
fi
echo ""

# Step 9: Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Setup Complete!                                           ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ Database is ready to use!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Start the application: ${GREEN}npm run start:dev${NC}"
echo -e "  2. View API docs: ${GREEN}http://localhost:3000/api/docs${NC}"
echo -e "  3. View database: ${GREEN}npm run prisma:studio${NC}"
echo ""

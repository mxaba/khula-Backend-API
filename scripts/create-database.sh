#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🗄️  Database Creation Script${NC}\n"

# Load DATABASE_URL from .env
if [ -f .env ]; then
    export $(cat .env | grep DATABASE_URL | xargs)
else
    echo -e "${RED}❌ .env file not found${NC}"
    exit 1
fi

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ DATABASE_URL not set in .env${NC}"
    exit 1
fi

# Parse DATABASE_URL
# Example: postgresql://username:password@localhost:5432/khula_db?schema=public
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')

echo -e "${YELLOW}Database details:${NC}"
echo -e "  Host: ${DB_HOST}"
echo -e "  Port: ${DB_PORT}"
echo -e "  User: ${DB_USER}"
echo -e "  Database: ${DB_NAME}"
echo ""

echo -e "${YELLOW}Checking if database exists...${NC}"

# Check if database exists
DB_EXISTS=$(PGPASSWORD=$(echo $DATABASE_URL | sed -n 's/.*:\([^@]*\)@.*/\1/p') psql -h $DB_HOST -p $DB_PORT -U $DB_USER -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null)

if [ "$DB_EXISTS" = "1" ]; then
    echo -e "${GREEN}✅ Database '$DB_NAME' already exists${NC}\n"
else
    echo -e "${YELLOW}Creating database '$DB_NAME'...${NC}"

    # Create database
    PGPASSWORD=$(echo $DATABASE_URL | sed -n 's/.*:\([^@]*\)@.*/\1/p') createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME 2>/dev/null

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database '$DB_NAME' created successfully${NC}\n"
    else
        echo -e "${RED}❌ Failed to create database${NC}"
        echo -e "${YELLOW}Try creating it manually:${NC}"
        echo -e "  psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c \"CREATE DATABASE $DB_NAME;\""
        echo ""
        exit 1
    fi
fi

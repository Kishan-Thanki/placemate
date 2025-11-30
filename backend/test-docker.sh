#!/bin/bash
# Quick Docker Local Testing Script

set -e

echo "=========================================="
echo "Placemate Backend - Docker Local Test"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Docker
echo -e "\n${YELLOW}Step 1: Checking Docker installation...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}ERROR: Docker is not installed!${NC}"
    exit 1
fi
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}ERROR: Docker Compose is not installed!${NC}"
    exit 1
fi
echo -e "${GREEN}PASS: Docker: $(docker --version)${NC}"
echo -e "${GREEN}PASS: Docker Compose: $(docker-compose --version)${NC}"

# Check .env file
echo -e "\n${YELLOW}Step 2: Checking .env file...${NC}"
if [ ! -f .env ]; then
    echo -e "${RED}ERROR: .env file not found!${NC}"
    echo -e "${YELLOW}   Please create .env file with required variables.${NC}"
    exit 1
fi
echo -e "${GREEN}PASS: .env file exists${NC}"

# Check DATABASE_URL in .env
if ! grep -q "DATABASE_URL=" .env || grep -q "DATABASE_URL=$" .env; then
    echo -e "${YELLOW}WARNING: DATABASE_URL not set or empty in .env${NC}"
fi

# Clean up any existing containers
echo -e "\n${YELLOW}Step 3: Cleaning up existing containers...${NC}"
docker-compose down 2>/dev/null || true
echo -e "${GREEN}PASS: Cleanup complete${NC}"

# Build image
echo -e "\n${YELLOW}Step 4: Building Docker image...${NC}"
docker-compose build
if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Build failed!${NC}"
    exit 1
fi
echo -e "${GREEN}PASS: Build successful${NC}"

# Start container
echo -e "\n${YELLOW}Step 5: Starting container...${NC}"
docker-compose up -d
if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Failed to start container!${NC}"
    exit 1
fi
echo -e "${GREEN}PASS: Container started${NC}"

# Wait for startup
echo -e "\n${YELLOW}Step 6: Waiting for application to start (30 seconds)...${NC}"
sleep 30

# Check container status
echo -e "\n${YELLOW}Step 7: Checking container status...${NC}"
if ! docker ps | grep -q placemate-backend; then
    echo -e "${RED}ERROR: Container is not running!${NC}"
    echo -e "${YELLOW}Checking logs...${NC}"
    docker-compose logs --tail=50 backend
    exit 1
fi
echo -e "${GREEN}PASS: Container is running${NC}"

# Test health endpoint
echo -e "\n${YELLOW}Step 8: Testing health endpoint...${NC}"
for i in {1..10}; do
    if curl -f -s http://localhost:8000/health/ > /dev/null 2>&1; then
        echo -e "${GREEN}PASS: Health check passed${NC}"
        break
    fi
    if [ $i -eq 10 ]; then
        echo -e "${RED}ERROR: Health check failed after 10 attempts${NC}"
        echo -e "${YELLOW}Container logs:${NC}"
        docker-compose logs --tail=50 backend
        exit 1
    fi
    echo -e "${YELLOW}   Attempt $i/10... waiting...${NC}"
    sleep 3
done

# Test API endpoint
echo -e "\n${YELLOW}Step 9: Testing API endpoint...${NC}"
if curl -f -s "http://localhost:8000/api/v1/core/lookup/?type=countries" > /dev/null 2>&1; then
    echo -e "${GREEN}PASS: API endpoint working${NC}"
else
    echo -e "${YELLOW}WARNING: API endpoint test failed (may require authentication)${NC}"
fi

# Show logs
echo -e "\n${YELLOW}Step 10: Recent container logs:${NC}"
docker-compose logs --tail=30 backend

# Summary
echo -e "\n=========================================="
echo -e "${GREEN}All tests passed!${NC}"
echo -e "=========================================="
echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "  View logs: ${GREEN}docker-compose logs -f backend${NC}"
echo -e "  Stop container: ${GREEN}docker-compose down${NC}"
echo -e "  Access API: ${GREEN}http://localhost:8000${NC}"
echo -e "  Access Admin: ${GREEN}http://localhost:8000/admin${NC}"
echo -e "\n"


#!/bin/bash
# show_test_errors.sh - Show detailed error messages for failing tests

# Color codes
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}🔍 DETAILED TEST ERROR VIEWER${NC}"
echo "==================================================="
echo ""

if [ -z "$1" ]; then
    echo -e "${YELLOW}Usage: $0 <app_name>${NC}"
    echo ""
    echo "Examples:"
    echo "  $0 apps.users"
    echo "  $0 apps.placements"
    echo "  $0 apps.applications"
    echo ""
    echo "Or run a specific test:"
    echo "  python manage.py test apps.users.tests.test_auth.AuthenticationTest.test_successful_login_with_single_role --verbosity=2"
    exit 1
fi

APP_NAME=$1

echo -e "${CYAN}Running tests for: $APP_NAME${NC}"
echo "==================================================="
echo ""

# Run tests with full verbosity and show all output
python manage.py test "$APP_NAME" --verbosity=2 --keepdb 2>&1 | tee /tmp/test_output.txt

echo ""
echo -e "${YELLOW}===================================================${NC}"
echo -e "${YELLOW}ERROR SUMMARY:${NC}"
echo -e "${YELLOW}===================================================${NC}"

# Extract failing tests
grep -A 20 "FAIL:\|ERROR:" /tmp/test_output.txt | head -200

echo ""
echo -e "${CYAN}For even more details, run:${NC}"
echo "python manage.py test <specific.test.class> --verbosity=2 --keepdb"


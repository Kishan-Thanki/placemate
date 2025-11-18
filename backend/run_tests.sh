#!/bin/bash
# run_tests.sh - Placemate Test Suite Runner

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Function to print colored output
print_color() {
    echo -e "${2}${1}${NC}"
}

# Function to show usage
show_usage() {
    echo "Usage: $0 [OPTIONS] [APP_NAMES...]"
    echo ""
    echo "OPTIONS:"
    echo "  -a, --all              Run all app tests"
    echo "  -c, --core             Run core app tests only"
    echo "  -u, --users            Run users app tests only" 
    echo "  -s, --students         Run students app tests only"
    echo "  -co, --companies       Run companies app tests only"
    echo "  -p, --placements       Run placements app tests only"
    echo "  -ap, --applications    Run applications app tests only"
    echo "  -h, --help             Show this help message"
    echo ""
    echo "EXAMPLES:"
    echo "  $0 --all               # Run all tests"
    echo "  $0 --core --users      # Run core and users tests"
    echo "  $0 apps.core apps.users # Run specific app tests"
    echo "  $0                     # Run core tests (default)"
}

# Function to get display name for app
get_display_name() {
    local app=$1
    case $app in
        "apps.core") echo "CORE APP" ;;
        "apps.users") echo "USERS APP" ;;
        "apps.students") echo "STUDENTS APP" ;;
        "apps.companies") echo "COMPANIES APP" ;;
        "apps.placements") echo "PLACEMENTS APP" ;;
        "apps.applications") echo "APPLICATIONS APP" ;;
        *) echo "$app" ;;
    esac
}

# Function to run tests for a specific app
run_app_tests() {
    local app_name=$1
    local display_name=$2
    
    print_color "TESTING: $display_name" "$PURPLE"
    echo "==================================================="
    
    # Run tests and capture output
    TEST_OUTPUT=$(python manage.py test "$app_name" --verbosity=2 --keepdb 2>&1)
    TEST_RESULT=$?
    
    # Extract test statistics
    TEST_COUNT=$(echo "$TEST_OUTPUT" | grep -o "Ran [0-9]* test" | grep -o "[0-9]*" | head -1)
    FAILURES=$(echo "$TEST_OUTPUT" | grep -o "FAILED (failures=[0-9]*" | grep -o "[0-9]*" | head -1)
    ERRORS=$(echo "$TEST_OUTPUT" | grep -o "errors=[0-9]*" | grep -o "[0-9]*" | head -1)
    
    # Set defaults if empty
    TEST_COUNT=${TEST_COUNT:-0}
    FAILURES=${FAILURES:-0}
    ERRORS=${ERRORS:-0}
    
    # Print results
    if [ "$TEST_RESULT" -eq 0 ] && [ "$FAILURES" -eq 0 ] && [ "$ERRORS" -eq 0 ]; then
        print_color "ALL $TEST_COUNT $display_name TESTS PASSED!" "$GREEN"
        return 0
    else
        print_color "$FAILURES failures and $ERRORS errors out of $TEST_COUNT tests in $display_name" "$RED"
        echo ""
        print_color "DETAILED ERROR REPORT:" "$YELLOW"
        echo "==================================================="
        
        # Extract and show test case IDs of failing tests
        echo "$TEST_OUTPUT" | grep -E "Test Case ID:" | head -20
        
        echo ""
        print_color "🔍 FULL ERROR DETAILS:" "$YELLOW"
        echo "==================================================="
        
        # Save full output to temp file for better parsing
        TEMP_FILE=$(mktemp)
        echo "$TEST_OUTPUT" > "$TEMP_FILE"
        
        # Extract all FAIL and ERROR sections with their tracebacks
        FAIL_COUNT=0
        ERROR_COUNT=0
        
        # Extract FAIL errors with context
        FAIL_LINES=$(grep -n "^FAIL:" "$TEMP_FILE" | head -10)
        if [ -n "$FAIL_LINES" ]; then
            echo "$FAIL_LINES" | while IFS=: read -r line_num line_content; do
                ((FAIL_COUNT++))
                echo ""
                echo -e "${RED}=== FAILURE #$FAIL_COUNT ===${NC}"
                # Show 40 lines starting from the FAIL line
                sed -n "${line_num},+40p" "$TEMP_FILE" | head -40
                echo ""
            done
        fi
        
        # Extract ERROR errors with context
        ERROR_LINES=$(grep -n "^ERROR:" "$TEMP_FILE" | head -10)
        if [ -n "$ERROR_LINES" ]; then
            echo "$ERROR_LINES" | while IFS=: read -r line_num line_content; do
                ((ERROR_COUNT++))
                echo ""
                echo -e "${RED}=== ERROR #$ERROR_COUNT ===${NC}"
                # Show 40 lines starting from the ERROR line
                sed -n "${line_num},+40p" "$TEMP_FILE" | head -40
                echo ""
            done
        fi
        
        # If no structured errors found, show last 150 lines
        if [ $FAIL_COUNT -eq 0 ] && [ $ERROR_COUNT -eq 0 ]; then
            echo "$TEST_OUTPUT" | tail -150
        fi
        
        rm -f "$TEMP_FILE"
        
        echo ""
        print_color "TIP: Run individual test for more details:" "$CYAN"
        echo "   python manage.py test <specific.test.class> --verbosity=2"
        echo ""
        return 1
    fi
}

# Function to setup test environment
setup_test_environment() {
    print_color "SETUP PHASE" "$BLUE"
    echo "==================================================="
    
    print_color "Checking test dependencies..." "$CYAN"
    python manage.py check --verbosity=0
    if [ $? -ne 0 ]; then
        print_color "Django check failed!" "$RED"
        exit 1
    fi
    
    print_color "🗄️ Setting up database..." "$CYAN"
    python manage.py makemigrations --verbosity=0
    MIGRATE_OUTPUT=$(python manage.py migrate --verbosity=0 2>&1)
    if [ $? -ne 0 ]; then
        print_color "Database migration failed!" "$RED"
        echo "$MIGRATE_OUTPUT"
        exit 1
    fi
    
    print_color "Environment setup completed" "$GREEN"
    echo ""
}

# Default behavior
RUN_ALL=false
RUN_CORE=false
RUN_USERS=false
RUN_STUDENTS=false
RUN_COMPANIES=false
RUN_PLACEMENTS=false
RUN_APPLICATIONS=false
APPS_TO_TEST=()

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -a|--all)
            RUN_ALL=true
            shift
            ;;
        -c|--core)
            RUN_CORE=true
            shift
            ;;
        -u|--users)
            RUN_USERS=true
            shift
            ;;
        -s|--students)
            RUN_STUDENTS=true
            shift
            ;;
        -co|--companies)
            RUN_COMPANIES=true
            shift
            ;;
        -p|--placements)
            RUN_PLACEMENTS=true
            shift
            ;;
        -ap|--applications)
            RUN_APPLICATIONS=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        -*)
            print_color "Unknown option: $1" "$RED"
            show_usage
            exit 1
            ;;
        *)
            APPS_TO_TEST+=("$1")
            shift
            ;;
    esac
done

# Determine which apps to test
if [ ${#APPS_TO_TEST[@]} -gt 0 ]; then
    # Use explicitly provided app names
    TEST_APPS=("${APPS_TO_TEST[@]}")
elif [ "$RUN_ALL" = true ]; then
    TEST_APPS=("apps.core" "apps.users" "apps.students" "apps.companies" "apps.placements" "apps.applications")
elif [ "$RUN_CORE" = true ]; then
    TEST_APPS=("apps.core")
elif [ "$RUN_USERS" = true ]; then
    TEST_APPS=("apps.users")
elif [ "$RUN_STUDENTS" = true ]; then
    TEST_APPS=("apps.students")
elif [ "$RUN_COMPANIES" = true ]; then
    TEST_APPS=("apps.companies")
elif [ "$RUN_PLACEMENTS" = true ]; then
    TEST_APPS=("apps.placements")
elif [ "$RUN_APPLICATIONS" = true ]; then
    TEST_APPS=("apps.applications")
else
    # Default: run core tests only
    TEST_APPS=("apps.core")
fi

# Banner
print_color "===================================================" "$PURPLE"
print_color "PLACEMATE TEST SUITE" "$PURPLE"
print_color "===================================================" "$PURPLE"
echo ""

# Setup environment
setup_test_environment

# Test execution
print_color "TEST EXECUTION PHASE" "$BLUE"
echo "==================================================="

OVERALL_RESULT=0
PASSED_APPS=0
FAILED_APPS=0

# Run tests for each app
for app in "${TEST_APPS[@]}"; do
    display_name=$(get_display_name "$app")
    
    if run_app_tests "$app" "$display_name"; then
        ((PASSED_APPS++))
    else
        ((FAILED_APPS++))
        OVERALL_RESULT=1
    fi
    echo ""
done

# Final summary
print_color "FINAL RESULTS SUMMARY" "$BLUE"
echo "==================================================="

if [ $OVERALL_RESULT -eq 0 ]; then
    print_color "ALL TESTS PASSED! $PASSED_APPS app(s) completed successfully." "$GREEN"
else
    print_color "TEST SUITE COMPLETED WITH FAILURES" "$RED"
    print_color "   Passed: $PASSED_APPS app(s)" "$GREEN"
    print_color "   Failed: $FAILED_APPS app(s)" "$RED"
fi

# Next steps suggestion
echo ""
print_color "📍 NEXT STEPS:" "$CYAN"
if [ $OVERALL_RESULT -eq 0 ]; then
    if [ "$RUN_ALL" = true ] || [ ${#TEST_APPS[@]} -eq 6 ]; then
        print_color "   All app tests completed! Ready for deployment." "$GREEN"
    else
        remaining_apps=()
        for app in "apps.core" "apps.users" "apps.students" "apps.companies" "apps.placements" "apps.applications"; do
            if [[ ! " ${TEST_APPS[@]} " =~ " ${app} " ]]; then
                remaining_apps+=("$app")
            fi
        done
        if [ ${#remaining_apps[@]} -gt 0 ]; then
            print_color "   Run remaining tests: ./run_tests.sh --all" "$YELLOW"
            for app in "${remaining_apps[@]}"; do
                print_color "     - $app" "$YELLOW"
            done
        fi
    fi
else
    print_color "   Fix failing tests and run again:" "$YELLOW"
    for app in "${TEST_APPS[@]}"; do
        # Quick check if app has failing tests
        if python manage.py test "$app" --verbosity=0 --failfast --keepdb >/dev/null 2>&1; then
            : # App passes
        else
            print_color "     - ./run_tests.sh $app" "$YELLOW"
        fi
    done
fi

exit $OVERALL_RESULT
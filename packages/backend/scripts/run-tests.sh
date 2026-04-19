#!/bin/bash
# Ganitel Backend - Run Tests Script
# Executes the test suite in Docker environment with test database

set -e

COMPOSE_FILE="docker-compose.local.yml"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Parse arguments
TEST_PATH="${1:-.}"
TEST_TYPE="${2:-all}"
COVERAGE="true"

echo -e "${BLUE}╔════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          GANITEL TEST SUITE                        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if test database is running
echo -e "${YELLOW}[1/4] Checking test database...${NC}"
if ! docker-compose -f $COMPOSE_FILE ps db-test 2>/dev/null | grep -q "Up"; then
    echo "Starting test database..."
    docker-compose -f $COMPOSE_FILE --profile test up -d db-test
    echo "Waiting for database to be ready..."
    sleep 5
fi
echo -e "${GREEN}✅ Test database ready${NC}"
echo ""

# Build test command
echo -e "${YELLOW}[2/4] Preparing test environment...${NC}"
TEST_CMD="pytest"

# Add test path
if [ "$TEST_PATH" != "." ]; then
    TEST_CMD="$TEST_CMD $TEST_PATH"
fi

# Add markers based on test type
case $TEST_TYPE in
    "unit")
        TEST_CMD="$TEST_CMD -m unit"
        echo "Running unit tests only"
        ;;
    "integration")
        TEST_CMD="$TEST_CMD -m integration"
        echo "Running integration tests only"
        ;;
    "e2e")
        TEST_CMD="$TEST_CMD -m e2e"
        echo "Running end-to-end tests only"
        ;;
    "auth")
        TEST_CMD="$TEST_CMD -m auth"
        echo "Running authentication tests only"
        ;;
    "booking")
        TEST_CMD="$TEST_CMD -m booking"
        echo "Running booking tests only"
        ;;
    "service")
        TEST_CMD="$TEST_CMD -m service"
        echo "Running service tests only"
        ;;
    "fast")
        TEST_CMD="$TEST_CMD -m 'not slow'"
        echo "Running fast tests only (excluding slow tests)"
        ;;
    "all")
        echo "Running all tests"
        ;;
    *)
        echo "Unknown test type: $TEST_TYPE"
        echo "Available types: unit, integration, e2e, auth, booking, service, fast, all"
        exit 1
        ;;
esac

# Always add coverage
TEST_CMD="$TEST_CMD --cov=app --cov-report=term-missing --cov-report=html"
echo "Coverage reporting enabled (always-on)"

echo -e "${GREEN}✅ Test environment ready${NC}"
echo ""

# Run tests
echo -e "${YELLOW}[3/4] Running tests...${NC}"
echo -e "${BLUE}Command: $TEST_CMD${NC}"
echo ""

# Set environment variable to indicate we're in test mode
export DOCKER_ENV=true
export ENVIRONMENT=test

# Run tests in Docker container with test database
if docker-compose -f $COMPOSE_FILE run --rm \
    --entrypoint "" \
    -e DOCKER_ENV=true \
    -e ENVIRONMENT=test \
    -e TEST_DATABASE_URL="postgresql://ganitel_user:ganitel_local_password_2024@db-test:5432/ganitel_test_db" \
    --no-deps \
    app $TEST_CMD; then
    
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║          ✅  ALL TESTS PASSED  ✅                  ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    echo -e "${BLUE}📊 Coverage report generated in htmlcov/index.html${NC}"
    echo ""
    
    TEST_RESULT=0
else
    echo ""
    echo -e "${RED}╔════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║          ❌  SOME TESTS FAILED  ❌                 ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════╝${NC}"
    echo ""
    TEST_RESULT=1
fi

# Summary
echo -e "${YELLOW}[4/4] Test summary:${NC}"
echo "  • Test database: db-test (port 5433)"
echo "  • Test type: $TEST_TYPE"
echo "  • Coverage: always-on"
echo ""

if [ $TEST_RESULT -eq 0 ]; then
    echo -e "${BLUE}💡 Next steps:${NC}"
    echo "  • View coverage: open htmlcov/index.html"
    echo "  • Run specific tests: ./scripts/run-tests.sh tests/test_auth.py"
    echo "  • Coverage is always enabled"
    echo ""
fi

exit $TEST_RESULT

#!/bin/bash
# Script to run Force Quiz Selenium tests

echo "========================================="
echo "Force Quiz Selenium Test Automation"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if virtual environment is activated
if [[ -z "$VIRTUAL_ENV" ]]; then
    echo -e "${YELLOW}Warning: Virtual environment not activated${NC}"
    echo "Consider running: source venv/bin/activate"
    echo ""
fi

# Parse command line arguments
TEST_TYPE=${1:-"all"}
BROWSER=${2:-"chrome"}

echo "Test Type: $TEST_TYPE"
echo "Browser: $BROWSER"
echo ""

# Set environment variables
export BROWSER=$BROWSER

# Run tests based on type
case $TEST_TYPE in
    "smoke")
        echo -e "${GREEN}Running smoke tests...${NC}"
        pytest -m smoke -v
        ;;
    "regression")
        echo -e "${GREEN}Running regression tests...${NC}"
        pytest -m regression -v
        ;;
    "intro")
        echo -e "${GREEN}Running intro section tests...${NC}"
        pytest tests/test_intro_section.py -v
        ;;
    "questions")
        echo -e "${GREEN}Running question tests...${NC}"
        pytest tests/test_questions.py -v
        ;;
    "comprehensive")
        echo -e "${GREEN}Running comprehensive tests...${NC}"
        pytest tests/test_all_questions.py -v
        ;;
    "scoring")
        echo -e "${GREEN}Running scoring tests...${NC}"
        pytest tests/test_scoring.py -v
        ;;
    "ui")
        echo -e "${GREEN}Running UI tests...${NC}"
        pytest tests/test_ui_elements.py -v
        ;;
    "parallel")
        echo -e "${GREEN}Running all tests in parallel...${NC}"
        pytest -n auto -v
        ;;
    "report")
        echo -e "${GREEN}Running tests with HTML report...${NC}"
        pytest --html=reports/report.html --self-contained-html -v
        ;;
    "all")
        echo -e "${GREEN}Running all tests...${NC}"
        pytest -v
        ;;
    *)
        echo "Unknown test type: $TEST_TYPE"
        echo ""
        echo "Usage: ./run_tests.sh [test_type] [browser]"
        echo ""
        echo "Test types:"
        echo "  all          - Run all tests (default)"
        echo "  smoke        - Run smoke tests"
        echo "  regression   - Run regression tests"
        echo "  intro        - Run intro section tests"
        echo "  questions    - Run question tests"
        echo "  comprehensive - Run comprehensive tests"
        echo "  scoring      - Run scoring tests"
        echo "  ui           - Run UI tests"
        echo "  parallel     - Run all tests in parallel"
        echo "  report       - Run with HTML report"
        echo ""
        echo "Browsers: chrome (default), firefox, edge"
        echo ""
        echo "Examples:"
        echo "  ./run_tests.sh smoke"
        echo "  ./run_tests.sh all firefox"
        echo "  ./run_tests.sh parallel chrome"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}Test execution completed!${NC}"
echo "Check reports/ directory for logs and screenshots/ for any failure screenshots"

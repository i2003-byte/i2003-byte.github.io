@echo off
REM Script to run Force Quiz Selenium tests on Windows

echo =========================================
echo Force Quiz Selenium Test Automation
echo =========================================
echo.

REM Parse command line arguments
set TEST_TYPE=%1
set BROWSER=%2

if "%TEST_TYPE%"=="" set TEST_TYPE=all
if "%BROWSER%"=="" set BROWSER=chrome

echo Test Type: %TEST_TYPE%
echo Browser: %BROWSER%
echo.

REM Set environment variables
set BROWSER=%BROWSER%

REM Run tests based on type
if "%TEST_TYPE%"=="smoke" (
    echo Running smoke tests...
    pytest -m smoke -v
) else if "%TEST_TYPE%"=="regression" (
    echo Running regression tests...
    pytest -m regression -v
) else if "%TEST_TYPE%"=="intro" (
    echo Running intro section tests...
    pytest tests/test_intro_section.py -v
) else if "%TEST_TYPE%"=="questions" (
    echo Running question tests...
    pytest tests/test_questions.py -v
) else if "%TEST_TYPE%"=="comprehensive" (
    echo Running comprehensive tests...
    pytest tests/test_all_questions.py -v
) else if "%TEST_TYPE%"=="scoring" (
    echo Running scoring tests...
    pytest tests/test_scoring.py -v
) else if "%TEST_TYPE%"=="ui" (
    echo Running UI tests...
    pytest tests/test_ui_elements.py -v
) else if "%TEST_TYPE%"=="parallel" (
    echo Running all tests in parallel...
    pytest -n auto -v
) else if "%TEST_TYPE%"=="report" (
    echo Running tests with HTML report...
    pytest --html=reports/report.html --self-contained-html -v
) else if "%TEST_TYPE%"=="all" (
    echo Running all tests...
    pytest -v
) else (
    echo Unknown test type: %TEST_TYPE%
    echo.
    echo Usage: run_tests.bat [test_type] [browser]
    echo.
    echo Test types:
    echo   all          - Run all tests (default)
    echo   smoke        - Run smoke tests
    echo   regression   - Run regression tests
    echo   intro        - Run intro section tests
    echo   questions    - Run question tests
    echo   comprehensive - Run comprehensive tests
    echo   scoring      - Run scoring tests
    echo   ui           - Run UI tests
    echo   parallel     - Run all tests in parallel
    echo   report       - Run with HTML report
    echo.
    echo Browsers: chrome (default), firefox, edge
    echo.
    echo Examples:
    echo   run_tests.bat smoke
    echo   run_tests.bat all firefox
    echo   run_tests.bat parallel chrome
    exit /b 1
)

echo.
echo Test execution completed!
echo Check reports/ directory for logs and screenshots/ for any failure screenshots

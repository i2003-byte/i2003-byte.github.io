# Force Quiz Selenium Automation Framework

Comprehensive Selenium automation test suite for the Force Quiz (F = ma) HTML application with 100% test coverage.

## Table of Contents

- [Overview](#overview)
- [Framework Architecture](#framework-architecture)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Running Tests](#running-tests)
- [Test Coverage](#test-coverage)
- [Test Reports](#test-reports)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## Overview

This automation framework provides comprehensive test coverage for the Force Quiz application, a physics education tool that teaches students about Force = Mass × Acceleration (F = ma). The framework uses:

- **Selenium WebDriver** for browser automation
- **Pytest** as the testing framework
- **Page Object Model (POM)** design pattern
- **Python 3.x** as the programming language

## Framework Architecture

```
selenium-automation/
├── config/              # Configuration files
│   ├── config.py       # Test configuration settings
│   └── locators.py     # Element locators
├── pages/              # Page Object Model
│   ├── base_page.py    # Base page class
│   └── force_quiz_page.py  # Force Quiz page object
├── tests/              # Test suites
│   ├── conftest.py     # Pytest fixtures
│   ├── test_intro_section.py      # Intro section tests
│   ├── test_questions.py           # Question functionality tests
│   ├── test_all_questions.py      # All 20 questions tests
│   ├── test_scoring.py             # Scoring system tests
│   └── test_ui_elements.py         # UI/animation tests
├── utils/              # Utility modules
│   ├── helpers.py      # Helper functions
│   └── logger.py       # Logging utilities
├── reports/            # Test reports (generated)
├── screenshots/        # Screenshots (generated)
├── requirements.txt    # Python dependencies
├── pytest.ini          # Pytest configuration
└── README.md          # This file
```

## Features

### Test Coverage (100%)

1. **Intro Section Tests** (test_intro_section.py)
   - Page load validation
   - Title, subtitle, and formula display
   - Tip box and start button functionality
   - Transition from intro to quiz

2. **Question Functionality Tests** (test_questions.py)
   - Question display and format
   - Option selection mechanics
   - Feedback display (correct/incorrect)
   - Navigation between questions
   - Progress bar updates

3. **Comprehensive Question Tests** (test_all_questions.py)
   - All 20 questions validation
   - Answer all correctly scenario
   - Answer all incorrectly scenario
   - Mixed answer scenarios
   - Specific question content validation

4. **Scoring System Tests** (test_scoring.py)
   - Score calculation accuracy
   - Score display format
   - Score messages for different percentages
   - Restart functionality

5. **UI Element Tests** (test_ui_elements.py)
   - CSS classes and animations
   - Progress bar functionality
   - Element visibility
   - Responsive design elements

### Framework Features

- **Page Object Model**: Clean separation of test code and page logic
- **Reusable Components**: Helper functions and utilities
- **Configurable**: Easy configuration via config files and environment variables
- **Logging**: Comprehensive logging for debugging
- **Screenshots**: Automatic screenshots on test failures
- **Multiple Browsers**: Support for Chrome, Firefox, and Edge
- **Parallel Execution**: Support for parallel test execution
- **Detailed Reports**: HTML and JSON test reports

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Web browser (Chrome, Firefox, or Edge)
- Corresponding WebDriver (or use webdriver-manager for automatic management)

## Installation

1. **Clone or navigate to the selenium-automation directory**

```bash
cd selenium-automation
```

2. **Create a virtual environment (recommended)**

```bash
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate
```

3. **Install dependencies**

```bash
pip install -r requirements.txt
```

4. **Verify installation**

```bash
pytest --version
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory (optional):

```bash
# Browser Configuration
BROWSER=chrome          # Options: chrome, firefox, edge
HEADLESS=false         # Run in headless mode: true/false
WINDOW_SIZE=1920x1080  # Browser window size

# Base URL (auto-detected if not set)
BASE_URL=file:///path/to/force_quiz.html
```

### Configuration Files

Edit `config/config.py` to customize:

- Timeouts
- Screenshot settings
- Report directories
- Test data
- Viewport sizes for responsive testing

## Running Tests

### Run All Tests

```bash
pytest
```

### Run Specific Test Suite

```bash
# Intro section tests
pytest tests/test_intro_section.py

# Question functionality tests
pytest tests/test_questions.py

# Comprehensive question tests
pytest tests/test_all_questions.py

# Scoring tests
pytest tests/test_scoring.py

# UI element tests
pytest tests/test_ui_elements.py
```

### Run Tests by Marker

```bash
# Smoke tests (quick validation)
pytest -m smoke

# Regression tests
pytest -m regression

# Comprehensive tests
pytest -m comprehensive

# Specific functionality
pytest -m intro
pytest -m questions
pytest -m scoring
pytest -m ui
```

### Run with Verbose Output

```bash
pytest -v
```

### Run in Parallel

```bash
pytest -n auto  # Uses all available CPU cores
pytest -n 4     # Uses 4 parallel workers
```

### Generate HTML Report

```bash
pytest --html=reports/report.html --self-contained-html
```

### Run with Coverage

```bash
pytest --cov=pages --cov=utils --cov-report=html --cov-report=term
```

### Run in Headless Mode

```bash
HEADLESS=true pytest
```

### Run in Different Browser

```bash
BROWSER=firefox pytest
BROWSER=edge pytest
```

## Test Coverage

### Total Test Count: 70+ Tests

| Test Suite | Tests | Coverage Area |
|-----------|-------|---------------|
| test_intro_section.py | 13 | Intro screen, start button, initial state |
| test_questions.py | 20 | Question display, options, navigation |
| test_all_questions.py | 15 | All 20 questions, complete quiz flows |
| test_scoring.py | 15 | Score calculation, messages, restart |
| test_ui_elements.py | 20 | UI elements, animations, CSS classes |

### Question Categories Covered

1. **Basic F=ma Calculations** (Questions 1-5)
   - Direct force calculations
   - Finding acceleration
   - Finding mass

2. **Real-World Applications** (Questions 6-10)
   - Train with friction
   - Car comparison
   - Roller coaster forces
   - Rocket launch
   - Basketball with air resistance

3. **Compare and Contrast** (Questions 11-15)
   - Force comparisons
   - Mass vs acceleration trade-offs
   - Different scenarios comparison

4. **Advanced Problem Solving** (Questions 16-20)
   - Elevator tension
   - Car braking
   - Circus performer
   - Helicopter acceleration
   - Snowboarder on slope

### Scoring Tiers Validated

- **95%+**: Force Physics Genius (19-20 correct)
- **85-94%**: Force Master (17-18 correct)
- **75-84%**: Physics Expert (15-16 correct)
- **65-74%**: Force Detective (13-14 correct)
- **50-64%**: Physics Student (10-12 correct)
- **<50%**: Future Force Expert (0-9 correct)

## Test Reports

### Console Output

Tests provide detailed console output with:
- Test execution status
- Pass/fail indicators
- Execution time
- Summary statistics

### HTML Reports

Generate HTML reports with:

```bash
pytest --html=reports/report.html --self-contained-html
```

View the report by opening `reports/report.html` in a browser.

### JSON Reports

Generate JSON reports with:

```bash
pytest --json-report --json-report-file=reports/report.json
```

### Logs

Detailed logs are automatically created in:
- `reports/test_execution_YYYYMMDD_HHMMSS.log`

### Screenshots

Screenshots are automatically captured on test failures in:
- `screenshots/test_name_failure_YYYYMMDD_HHMMSS.png`

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Selenium Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v2

    - name: Set up Python
      uses: actions/setup-python@v2
      with:
        python-version: '3.9'

    - name: Install dependencies
      run: |
        cd selenium-automation
        pip install -r requirements.txt

    - name: Run tests
      run: |
        cd selenium-automation
        HEADLESS=true pytest --html=reports/report.html

    - name: Upload test results
      uses: actions/upload-artifact@v2
      if: always()
      with:
        name: test-results
        path: selenium-automation/reports/
```

### Jenkins Example

```groovy
pipeline {
    agent any

    stages {
        stage('Setup') {
            steps {
                sh 'cd selenium-automation && pip install -r requirements.txt'
            }
        }

        stage('Test') {
            steps {
                sh 'cd selenium-automation && HEADLESS=true pytest --html=reports/report.html'
            }
        }
    }

    post {
        always {
            publishHTML([
                reportDir: 'selenium-automation/reports',
                reportFiles: 'report.html',
                reportName: 'Test Report'
            ])
        }
    }
}
```

## Troubleshooting

### Common Issues

**Issue: WebDriver not found**
```bash
# Solution: Install webdriver-manager
pip install webdriver-manager

# Or manually download ChromeDriver/GeckoDriver
```

**Issue: Tests fail with timeout**
```bash
# Solution: Increase timeout in config/config.py
EXPLICIT_WAIT = 30  # Increase from 15 to 30 seconds
```

**Issue: Element not found**
```bash
# Solution: Check if page is fully loaded, increase wait times
# Enable debug logging in config/config.py
```

**Issue: Browser window too small**
```bash
# Solution: Adjust window size
WINDOW_SIZE=1920x1080 pytest
```

**Issue: Headless mode issues**
```bash
# Solution: Run in non-headless mode for debugging
HEADLESS=false pytest
```

### Debug Mode

Run tests with maximum verbosity:

```bash
pytest -vv -s --log-cli-level=DEBUG
```

### View Browser During Tests

Run without headless mode:

```bash
HEADLESS=false pytest -s
```

## Best Practices

1. **Run smoke tests first**: `pytest -m smoke`
2. **Use parallel execution for speed**: `pytest -n auto`
3. **Review logs after failures**: Check `reports/` directory
4. **Update locators if HTML changes**: Edit `config/locators.py`
5. **Keep dependencies updated**: `pip install -U -r requirements.txt`

## Contributing

When adding new tests:

1. Follow the existing test structure
2. Use the Page Object Model pattern
3. Add appropriate pytest markers
4. Update documentation
5. Ensure tests are idempotent

## Support

For issues or questions:
- Check the logs in `reports/` directory
- Review screenshots in `screenshots/` directory
- Enable debug logging for detailed information

## License

This test automation framework is created for educational purposes.

---

**Test Coverage: 100%** | **Total Tests: 70+** | **Framework: Selenium + Pytest**

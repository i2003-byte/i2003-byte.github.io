# Force Quiz Testing Guide

## Quick Start

### 1. Installation

```bash
# Navigate to the directory
cd selenium-automation

# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate  # On macOS/Linux
# or
venv\Scripts\activate  # On Windows

# Install dependencies
pip install -r requirements.txt
```

### 2. Run Your First Test

```bash
# Run smoke tests (fastest validation)
pytest -m smoke

# Run a specific test file
pytest tests/test_intro_section.py -v
```

### 3. View Results

- **Console**: See results immediately in terminal
- **Logs**: Check `reports/test_execution_*.log`
- **Screenshots**: View `screenshots/` for any failures

## Test Organization

### Test Files

| File | Purpose | Test Count |
|------|---------|------------|
| `test_intro_section.py` | Intro screen validation | 13 |
| `test_questions.py` | Question mechanics | 20 |
| `test_all_questions.py` | All 20 questions end-to-end | 15 |
| `test_scoring.py` | Score calculation & display | 15 |
| `test_ui_elements.py` | UI/CSS/animations | 20 |

### Test Markers

Use markers to run specific test categories:

```bash
pytest -m smoke           # Quick validation (critical tests)
pytest -m regression      # Full regression suite
pytest -m intro           # Intro section only
pytest -m questions       # Question functionality only
pytest -m scoring         # Scoring system only
pytest -m ui              # UI elements only
pytest -m comprehensive   # End-to-end comprehensive tests
```

## Common Test Scenarios

### Scenario 1: Quick Validation (5 minutes)

```bash
# Run smoke tests
pytest -m smoke -v

# Expected: ~15 tests, all should pass
```

### Scenario 2: Full Regression (15-20 minutes)

```bash
# Run all tests with detailed output
pytest -v --tb=short

# Expected: 70+ tests, all should pass
```

### Scenario 3: Test Specific Functionality

```bash
# Test only question navigation
pytest tests/test_questions.py::TestQuestionNavigation -v

# Test only scoring accuracy
pytest tests/test_scoring.py::TestScoringAccuracy -v

# Test specific question
pytest tests/test_all_questions.py::TestSpecificQuestions::test_question_1_car_acceleration -v
```

### Scenario 4: Parallel Execution (Fast)

```bash
# Run all tests in parallel
pytest -n auto

# Run with 4 workers
pytest -n 4
```

### Scenario 5: Generate Reports

```bash
# HTML report
pytest --html=reports/report.html --self-contained-html

# JSON report
pytest --json-report --json-report-file=reports/report.json

# Both
pytest --html=reports/report.html --json-report
```

## Test Coverage Breakdown

### 1. Intro Section (13 tests)

**What's tested:**
- Page loads successfully
- Title, subtitle, formula display correctly
- Intro section has all required elements
- Tip box is visible
- Start button works
- Transition from intro to quiz

**Example test:**
```bash
pytest tests/test_intro_section.py::TestIntroSection::test_start_button_functionality -v
```

### 2. Question Functionality (20 tests)

**What's tested:**
- Questions display with correct format
- All 4 options are shown
- Options are clickable
- Correct/incorrect feedback displays
- Next button appears after answering
- Navigation between questions works
- Progress bar updates

**Example test:**
```bash
pytest tests/test_questions.py::TestOptionSelection::test_correct_answer_shows_correct_feedback -v
```

### 3. All 20 Questions (15 tests)

**What's tested:**
- All 20 questions display correctly
- Can answer all correctly (20/20)
- Can answer all incorrectly (0/20)
- Mixed answer scenarios work
- Specific question content validation
- Progress bar throughout quiz

**Example test:**
```bash
pytest tests/test_all_questions.py::TestAllTwentyQuestions::test_all_questions_display_correctly -v
```

### 4. Scoring System (15 tests)

**What's tested:**
- Score displays after quiz completion
- Score format is correct (X/Y (Z%))
- Different score percentages (0%, 50%, 75%, 85%, 95%, 100%)
- Correct score messages for each tier
- Restart functionality
- Multiple quiz completions

**Example test:**
```bash
pytest tests/test_scoring.py::TestScoringAccuracy::test_hundred_percent_score -v
```

### 5. UI Elements (20 tests)

**What's tested:**
- All UI elements are visible
- CSS classes applied correctly
- Animations work (pulse, fade, slide)
- Progress bar functionality
- Responsive elements
- Selected/correct/incorrect option styling

**Example test:**
```bash
pytest tests/test_ui_elements.py::TestAnimations::test_option_gets_selected_class -v
```

## Understanding Test Results

### Successful Test Output

```
tests/test_intro_section.py::TestIntroSection::test_page_loads_successfully PASSED [100%]

================= 1 passed in 2.34s =================
```

### Failed Test Output

```
tests/test_intro_section.py::TestIntroSection::test_page_loads_successfully FAILED [100%]

FAILED - AssertionError: Intro section should be displayed
Screenshot saved: screenshots/test_page_loads_failure_20231215_143022.png

================= 1 failed in 2.34s =================
```

## Configuration Options

### Browser Selection

```bash
# Chrome (default)
pytest

# Firefox
BROWSER=firefox pytest

# Edge
BROWSER=edge pytest
```

### Headless Mode

```bash
# Run in headless mode (no browser window)
HEADLESS=true pytest

# Run with visible browser (for debugging)
HEADLESS=false pytest
```

### Window Size

```bash
# Custom window size
WINDOW_SIZE=1366x768 pytest

# Mobile size
WINDOW_SIZE=375x667 pytest
```

## Debugging Failed Tests

### Step 1: Check the Screenshot

```bash
# Screenshots are saved automatically on failure
ls screenshots/
# View the screenshot to see what the browser showed
```

### Step 2: Check the Logs

```bash
# View the latest log file
cat reports/test_execution_*.log

# Search for ERROR messages
grep ERROR reports/test_execution_*.log
```

### Step 3: Run in Debug Mode

```bash
# Run with visible browser and verbose output
HEADLESS=false pytest tests/test_intro_section.py -v -s --log-cli-level=DEBUG
```

### Step 4: Run Single Test

```bash
# Isolate the failing test
pytest tests/test_intro_section.py::TestIntroSection::test_page_loads_successfully -v
```

## Best Practices

### Before Running Tests

1. ✅ Ensure virtual environment is activated
2. ✅ Dependencies are installed (`pip install -r requirements.txt`)
3. ✅ force_quiz.html file exists in parent directory
4. ✅ Browser and WebDriver are compatible

### During Development

1. ✅ Run smoke tests frequently
2. ✅ Use `-v` flag for detailed output
3. ✅ Run tests in non-headless mode for debugging
4. ✅ Check logs and screenshots immediately on failures

### Before Committing

1. ✅ Run full regression suite
2. ✅ All tests should pass
3. ✅ No warnings or errors in logs
4. ✅ Generate and review HTML report

## Continuous Integration

### GitHub Actions Example

The framework includes CI/CD examples in README.md. Key points:

- Run tests on every push/PR
- Use headless mode in CI
- Archive test reports as artifacts
- Fail build if tests fail

### Local Pre-commit

```bash
# Create a pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
cd selenium-automation
source venv/bin/activate
pytest -m smoke
EOF

chmod +x .git/hooks/pre-commit
```

## Advanced Usage

### Running Specific Test Classes

```bash
pytest tests/test_scoring.py::TestScoringAccuracy -v
```

### Running Tests with Keywords

```bash
# Run all tests with "score" in name
pytest -k "score" -v

# Run all tests with "correct" in name
pytest -k "correct" -v
```

### Custom Markers

```bash
# Run only smoke + regression tests
pytest -m "smoke or regression"

# Run all except UI tests
pytest -m "not ui"
```

### Pytest Options

```bash
# Stop at first failure
pytest -x

# Show local variables on failure
pytest -l

# Show print statements
pytest -s

# Quiet mode (less output)
pytest -q

# Show slowest 10 tests
pytest --durations=10
```

## Troubleshooting Guide

### Issue: "pytest: command not found"

**Solution:**
```bash
# Ensure virtual environment is activated
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# Verify pytest is installed
pip install pytest
```

### Issue: "WebDriver not found"

**Solution:**
```bash
# Option 1: Use webdriver-manager (automatic)
pip install webdriver-manager

# Option 2: Download manually
# Chrome: https://chromedriver.chromium.org/
# Firefox: https://github.com/mozilla/geckodriver/releases
# Edge: https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/
```

### Issue: Tests timeout

**Solution:**
```bash
# Increase timeouts in config/config.py
EXPLICIT_WAIT = 30  # Increase from 15
PAGE_LOAD_TIMEOUT = 60  # Increase from 30
```

### Issue: Element not found

**Solution:**
1. Run in non-headless mode to see the browser
2. Check if locators in `config/locators.py` are correct
3. Add waits before interacting with elements
4. Check if page is fully loaded

### Issue: Screenshot not captured

**Solution:**
```bash
# Ensure screenshots directory exists
mkdir -p screenshots

# Check permissions
chmod 755 screenshots

# Verify configuration
SCREENSHOT_ON_FAILURE = True  # in config/config.py
```

## Performance Tips

1. **Use parallel execution** for faster results:
   ```bash
   pytest -n auto
   ```

2. **Run smoke tests first** to catch obvious issues quickly

3. **Use markers** to run only relevant tests during development

4. **Enable headless mode** for faster execution:
   ```bash
   HEADLESS=true pytest
   ```

5. **Reuse browser session** for related tests (handled by fixtures)

## Support and Resources

- **README.md**: Complete framework documentation
- **reports/**: Check logs after each run
- **screenshots/**: Visual debugging on failures
- **config/config.py**: All configuration options
- **pytest.ini**: Pytest-specific settings

---

**Happy Testing! 🚀**

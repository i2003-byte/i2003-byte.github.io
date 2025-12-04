"""
Pytest configuration and fixtures for Force Quiz tests
"""
import pytest
import sys
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.firefox.options import Options as FirefoxOptions
from selenium.webdriver.edge.options import Options as EdgeOptions

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from config.config import (
    BASE_URL, BROWSER, HEADLESS, WINDOW_SIZE,
    IMPLICIT_WAIT, PAGE_LOAD_TIMEOUT, SCREENSHOT_ON_FAILURE
)
from pages.force_quiz_page import ForceQuizPage
from utils.helpers import take_screenshot
from utils.logger import test_logger


def get_browser_options(browser_name):
    """
    Get browser options based on browser name

    Args:
        browser_name: Name of browser (chrome, firefox, edge)

    Returns:
        Browser options object
    """
    if browser_name.lower() == "chrome":
        options = ChromeOptions()
        if HEADLESS:
            options.add_argument("--headless=new")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument(f"--window-size={WINDOW_SIZE}")
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option("useAutomationExtension", False)
        return options

    elif browser_name.lower() == "firefox":
        options = FirefoxOptions()
        if HEADLESS:
            options.add_argument("--headless")
        width, height = WINDOW_SIZE.split("x")
        options.add_argument(f"--width={width}")
        options.add_argument(f"--height={height}")
        return options

    elif browser_name.lower() == "edge":
        options = EdgeOptions()
        if HEADLESS:
            options.add_argument("--headless")
        options.add_argument(f"--window-size={WINDOW_SIZE}")
        return options

    else:
        raise ValueError(f"Unsupported browser: {browser_name}")


@pytest.fixture(scope="function")
def driver(request):
    """
    Fixture to initialize and teardown WebDriver

    Args:
        request: Pytest request object

    Yields:
        WebDriver instance
    """
    test_logger.info(f"Initializing {BROWSER} WebDriver")

    # Get browser options
    options = get_browser_options(BROWSER)

    # Initialize WebDriver based on browser
    if BROWSER.lower() == "chrome":
        driver = webdriver.Chrome(options=options)
    elif BROWSER.lower() == "firefox":
        driver = webdriver.Firefox(options=options)
    elif BROWSER.lower() == "edge":
        driver = webdriver.Edge(options=options)
    else:
        raise ValueError(f"Unsupported browser: {BROWSER}")

    # Set timeouts
    driver.implicitly_wait(IMPLICIT_WAIT)
    driver.set_page_load_timeout(PAGE_LOAD_TIMEOUT)

    # Maximize window if not headless
    if not HEADLESS:
        driver.maximize_window()

    test_logger.info(f"WebDriver initialized successfully")

    yield driver

    # Teardown
    if request.node.rep_call.failed and SCREENSHOT_ON_FAILURE:
        test_name = request.node.name
        take_screenshot(driver, test_name, "failure")
        test_logger.error(f"Test {test_name} failed - screenshot captured")

    test_logger.info("Closing WebDriver")
    driver.quit()


@pytest.fixture(scope="function")
def quiz_page(driver):
    """
    Fixture to initialize ForceQuizPage

    Args:
        driver: WebDriver instance from driver fixture

    Returns:
        ForceQuizPage instance
    """
    test_logger.info(f"Loading Force Quiz page: {BASE_URL}")
    driver.get(BASE_URL)
    page = ForceQuizPage(driver)
    test_logger.info("Force Quiz page loaded successfully")
    return page


@pytest.fixture(scope="function")
def started_quiz(quiz_page):
    """
    Fixture to start the quiz

    Args:
        quiz_page: ForceQuizPage instance

    Returns:
        ForceQuizPage instance with quiz started
    """
    test_logger.info("Starting quiz from fixture")
    quiz_page.click_start_button()
    return quiz_page


@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """
    Hook to capture test results for screenshot on failure

    Args:
        item: Test item
        call: Test call object
    """
    outcome = yield
    rep = outcome.get_result()
    setattr(item, f"rep_{rep.when}", rep)


def pytest_configure(config):
    """
    Pytest configuration hook

    Args:
        config: Pytest config object
    """
    test_logger.info("=" * 80)
    test_logger.info("FORCE QUIZ SELENIUM TEST SUITE")
    test_logger.info("=" * 80)
    test_logger.info(f"Browser: {BROWSER}")
    test_logger.info(f"Headless: {HEADLESS}")
    test_logger.info(f"Base URL: {BASE_URL}")
    test_logger.info("=" * 80)


def pytest_sessionfinish(session, exitstatus):
    """
    Pytest session finish hook

    Args:
        session: Pytest session object
        exitstatus: Exit status code
    """
    test_logger.info("=" * 80)
    test_logger.info("TEST SUITE EXECUTION COMPLETED")
    test_logger.info(f"Exit Status: {exitstatus}")
    test_logger.info("=" * 80)


# Pytest markers
def pytest_configure(config):
    """Configure custom pytest markers"""
    config.addinivalue_line(
        "markers", "intro: Tests for intro section"
    )
    config.addinivalue_line(
        "markers", "questions: Tests for question functionality"
    )
    config.addinivalue_line(
        "markers", "scoring: Tests for scoring system"
    )
    config.addinivalue_line(
        "markers", "ui: Tests for UI elements and animations"
    )
    config.addinivalue_line(
        "markers", "comprehensive: Comprehensive end-to-end tests"
    )
    config.addinivalue_line(
        "markers", "smoke: Smoke tests for quick validation"
    )
    config.addinivalue_line(
        "markers", "regression: Regression test suite"
    )

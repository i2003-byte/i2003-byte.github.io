"""
Helper utilities for Selenium automation
"""
import time
from datetime import datetime
from pathlib import Path
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from config.config import SCREENSHOTS_DIR, SCREENSHOT_FORMAT
from utils.logger import test_logger


def take_screenshot(driver, test_name, description=""):
    """
    Take a screenshot and save it with timestamp

    Args:
        driver: WebDriver instance
        test_name: Name of the test
        description: Additional description for the screenshot

    Returns:
        Path to saved screenshot
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{test_name}_{description}_{timestamp}.{SCREENSHOT_FORMAT}".replace(" ", "_")
    filepath = SCREENSHOTS_DIR / filename

    try:
        driver.save_screenshot(str(filepath))
        test_logger.info(f"Screenshot saved: {filepath}")
        return filepath
    except Exception as e:
        test_logger.error(f"Failed to take screenshot: {e}")
        return None


def wait_for_element(driver, locator, timeout=15):
    """
    Wait for element to be present and visible

    Args:
        driver: WebDriver instance
        locator: Tuple of (By, locator_string)
        timeout: Maximum wait time in seconds

    Returns:
        WebElement if found, None otherwise
    """
    try:
        element = WebDriverWait(driver, timeout).until(
            EC.visibility_of_element_located(locator)
        )
        return element
    except TimeoutException:
        test_logger.error(f"Element not found within {timeout} seconds: {locator}")
        return None


def wait_for_element_clickable(driver, locator, timeout=15):
    """
    Wait for element to be clickable

    Args:
        driver: WebDriver instance
        locator: Tuple of (By, locator_string)
        timeout: Maximum wait time in seconds

    Returns:
        WebElement if found and clickable, None otherwise
    """
    try:
        element = WebDriverWait(driver, timeout).until(
            EC.element_to_be_clickable(locator)
        )
        return element
    except TimeoutException:
        test_logger.error(f"Element not clickable within {timeout} seconds: {locator}")
        return None


def wait_for_element_invisible(driver, locator, timeout=15):
    """
    Wait for element to become invisible

    Args:
        driver: WebDriver instance
        locator: Tuple of (By, locator_string)
        timeout: Maximum wait time in seconds

    Returns:
        True if element becomes invisible, False otherwise
    """
    try:
        WebDriverWait(driver, timeout).until(
            EC.invisibility_of_element_located(locator)
        )
        return True
    except TimeoutException:
        test_logger.error(f"Element still visible after {timeout} seconds: {locator}")
        return False


def wait_for_text_in_element(driver, locator, expected_text, timeout=15):
    """
    Wait for specific text to appear in element

    Args:
        driver: WebDriver instance
        locator: Tuple of (By, locator_string)
        expected_text: Text to wait for
        timeout: Maximum wait time in seconds

    Returns:
        True if text appears, False otherwise
    """
    try:
        WebDriverWait(driver, timeout).until(
            EC.text_to_be_present_in_element(locator, expected_text)
        )
        return True
    except TimeoutException:
        test_logger.error(f"Text '{expected_text}' not found in element within {timeout} seconds")
        return False


def get_element_css_property(driver, element, property_name):
    """
    Get CSS property value of an element

    Args:
        driver: WebDriver instance
        element: WebElement
        property_name: Name of CSS property

    Returns:
        CSS property value as string
    """
    try:
        return element.value_of_css_property(property_name)
    except Exception as e:
        test_logger.error(f"Failed to get CSS property '{property_name}': {e}")
        return None


def is_element_displayed(driver, locator, timeout=5):
    """
    Check if element is displayed

    Args:
        driver: WebDriver instance
        locator: Tuple of (By, locator_string)
        timeout: Maximum wait time in seconds

    Returns:
        True if displayed, False otherwise
    """
    try:
        element = WebDriverWait(driver, timeout).until(
            EC.visibility_of_element_located(locator)
        )
        return element.is_displayed()
    except (TimeoutException, NoSuchElementException):
        return False


def wait_for_animation(duration=1.0):
    """
    Wait for animation to complete

    Args:
        duration: Wait time in seconds
    """
    time.sleep(duration)


def scroll_to_element(driver, element):
    """
    Scroll to bring element into view

    Args:
        driver: WebDriver instance
        element: WebElement to scroll to
    """
    try:
        driver.execute_script("arguments[0].scrollIntoView(true);", element)
        time.sleep(0.5)  # Wait for scroll to complete
    except Exception as e:
        test_logger.error(f"Failed to scroll to element: {e}")


def get_element_attribute(element, attribute_name):
    """
    Get attribute value of an element

    Args:
        element: WebElement
        attribute_name: Name of attribute

    Returns:
        Attribute value as string
    """
    try:
        return element.get_attribute(attribute_name)
    except Exception as e:
        test_logger.error(f"Failed to get attribute '{attribute_name}': {e}")
        return None


def highlight_element(driver, element, duration=2):
    """
    Highlight an element for visual debugging

    Args:
        driver: WebDriver instance
        element: WebElement to highlight
        duration: Highlight duration in seconds
    """
    original_style = element.get_attribute('style')
    driver.execute_script(
        "arguments[0].setAttribute('style', arguments[1]);",
        element,
        "border: 3px solid red; background-color: yellow;"
    )
    time.sleep(duration)
    driver.execute_script(
        "arguments[0].setAttribute('style', arguments[1]);",
        element,
        original_style
    )


def parse_progress_percentage(progress_element):
    """
    Parse progress bar percentage from width style

    Args:
        progress_element: Progress bar WebElement

    Returns:
        Progress percentage as float
    """
    try:
        width_style = progress_element.get_attribute('style')
        # Extract percentage from 'width: 50%;' format
        if 'width' in width_style:
            width_value = width_style.split('width:')[1].split(';')[0].strip()
            return float(width_value.replace('%', ''))
        return 0.0
    except Exception as e:
        test_logger.error(f"Failed to parse progress percentage: {e}")
        return 0.0


def calculate_expected_score_message(score, total_questions):
    """
    Calculate expected score message based on percentage

    Args:
        score: Number of correct answers
        total_questions: Total number of questions

    Returns:
        Expected score message keyword
    """
    percentage = (score / total_questions) * 100

    if percentage >= 95:
        return "FORCE PHYSICS GENIUS"
    elif percentage >= 85:
        return "FORCE MASTER"
    elif percentage >= 75:
        return "PHYSICS EXPERT"
    elif percentage >= 65:
        return "FORCE DETECTIVE"
    elif percentage >= 50:
        return "PHYSICS STUDENT"
    else:
        return "FUTURE FORCE EXPERT"

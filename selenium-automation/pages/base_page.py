"""
Base Page class for all page objects
"""
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
from config.config import EXPLICIT_WAIT, ANIMATION_SHORT
from utils.helpers import wait_for_element, wait_for_animation, take_screenshot
from utils.logger import test_logger


class BasePage:
    """Base class for all page objects"""

    def __init__(self, driver):
        """
        Initialize BasePage

        Args:
            driver: WebDriver instance
        """
        self.driver = driver
        self.wait = WebDriverWait(driver, EXPLICIT_WAIT)

    def find_element(self, locator, timeout=EXPLICIT_WAIT):
        """
        Find a single element

        Args:
            locator: Tuple of (By, locator_string)
            timeout: Maximum wait time

        Returns:
            WebElement if found
        """
        return wait_for_element(self.driver, locator, timeout)

    def find_elements(self, locator, timeout=EXPLICIT_WAIT):
        """
        Find multiple elements

        Args:
            locator: Tuple of (By, locator_string)
            timeout: Maximum wait time

        Returns:
            List of WebElements
        """
        try:
            self.wait_for_element_visible(locator, timeout)
            return self.driver.find_elements(*locator)
        except TimeoutException:
            test_logger.error(f"Elements not found: {locator}")
            return []

    def click(self, locator, timeout=EXPLICIT_WAIT):
        """
        Click on an element

        Args:
            locator: Tuple of (By, locator_string)
            timeout: Maximum wait time
        """
        element = self.wait_for_element_clickable(locator, timeout)
        if element:
            element.click()
            wait_for_animation(ANIMATION_SHORT)
            test_logger.info(f"Clicked element: {locator}")
        else:
            raise Exception(f"Element not clickable: {locator}")

    def get_text(self, locator, timeout=EXPLICIT_WAIT):
        """
        Get text from an element

        Args:
            locator: Tuple of (By, locator_string)
            timeout: Maximum wait time

        Returns:
            Text content of element
        """
        element = self.find_element(locator, timeout)
        if element:
            return element.text
        return ""

    def get_attribute(self, locator, attribute_name, timeout=EXPLICIT_WAIT):
        """
        Get attribute value from an element

        Args:
            locator: Tuple of (By, locator_string)
            attribute_name: Name of attribute
            timeout: Maximum wait time

        Returns:
            Attribute value
        """
        element = self.find_element(locator, timeout)
        if element:
            return element.get_attribute(attribute_name)
        return None

    def is_element_displayed(self, locator, timeout=5):
        """
        Check if element is displayed

        Args:
            locator: Tuple of (By, locator_string)
            timeout: Maximum wait time

        Returns:
            True if displayed, False otherwise
        """
        try:
            element = self.wait.until(
                EC.visibility_of_element_located(locator),
                timeout
            )
            return element.is_displayed()
        except TimeoutException:
            return False

    def is_element_present(self, locator, timeout=5):
        """
        Check if element is present in DOM

        Args:
            locator: Tuple of (By, locator_string)
            timeout: Maximum wait time

        Returns:
            True if present, False otherwise
        """
        try:
            self.driver.implicitly_wait(timeout)
            elements = self.driver.find_elements(*locator)
            return len(elements) > 0
        except Exception:
            return False

    def wait_for_element_visible(self, locator, timeout=EXPLICIT_WAIT):
        """
        Wait for element to be visible

        Args:
            locator: Tuple of (By, locator_string)
            timeout: Maximum wait time

        Returns:
            WebElement if visible
        """
        return self.wait.until(
            EC.visibility_of_element_located(locator),
            message=f"Element not visible: {locator}"
        )

    def wait_for_element_clickable(self, locator, timeout=EXPLICIT_WAIT):
        """
        Wait for element to be clickable

        Args:
            locator: Tuple of (By, locator_string)
            timeout: Maximum wait time

        Returns:
            WebElement if clickable
        """
        return self.wait.until(
            EC.element_to_be_clickable(locator),
            message=f"Element not clickable: {locator}"
        )

    def wait_for_element_invisible(self, locator, timeout=EXPLICIT_WAIT):
        """
        Wait for element to become invisible

        Args:
            locator: Tuple of (By, locator_string)
            timeout: Maximum wait time

        Returns:
            True if invisible
        """
        return self.wait.until(
            EC.invisibility_of_element_located(locator),
            message=f"Element still visible: {locator}"
        )

    def get_css_property(self, locator, property_name, timeout=EXPLICIT_WAIT):
        """
        Get CSS property value

        Args:
            locator: Tuple of (By, locator_string)
            property_name: CSS property name
            timeout: Maximum wait time

        Returns:
            CSS property value
        """
        element = self.find_element(locator, timeout)
        if element:
            return element.value_of_css_property(property_name)
        return None

    def has_class(self, locator, class_name, timeout=EXPLICIT_WAIT):
        """
        Check if element has a specific CSS class

        Args:
            locator: Tuple of (By, locator_string)
            class_name: Class name to check
            timeout: Maximum wait time

        Returns:
            True if element has the class, False otherwise
        """
        element = self.find_element(locator, timeout)
        if element:
            classes = element.get_attribute("class")
            return class_name in classes.split() if classes else False
        return False

    def take_screenshot(self, test_name, description=""):
        """
        Take a screenshot

        Args:
            test_name: Name of the test
            description: Additional description
        """
        return take_screenshot(self.driver, test_name, description)

    def execute_script(self, script, *args):
        """
        Execute JavaScript

        Args:
            script: JavaScript code to execute
            *args: Arguments to pass to the script

        Returns:
            Result of script execution
        """
        return self.driver.execute_script(script, *args)

    def scroll_to_element(self, locator, timeout=EXPLICIT_WAIT):
        """
        Scroll to element

        Args:
            locator: Tuple of (By, locator_string)
            timeout: Maximum wait time
        """
        element = self.find_element(locator, timeout)
        if element:
            self.execute_script("arguments[0].scrollIntoView(true);", element)
            wait_for_animation(ANIMATION_SHORT)

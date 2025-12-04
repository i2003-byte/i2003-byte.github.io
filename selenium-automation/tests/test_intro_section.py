"""
Test suite for Force Quiz intro section
"""
import pytest
from utils.logger import test_logger
from config.config import ANIMATION_MEDIUM
from utils.helpers import wait_for_animation


@pytest.mark.intro
@pytest.mark.smoke
class TestIntroSection:
    """Test cases for intro section functionality"""

    def test_page_loads_successfully(self, quiz_page):
        """Test that the page loads successfully"""
        test_logger.info("Testing page load")
        assert quiz_page.is_intro_section_displayed(), "Intro section should be displayed"

    def test_title_displayed(self, quiz_page):
        """Test that main title is displayed"""
        test_logger.info("Testing title display")
        title = quiz_page.get_title_text()
        assert title, "Title should be displayed"
        assert "Force Master Academy" in title, f"Expected 'Force Master Academy' in title, got: {title}"

    def test_subtitle_displayed(self, quiz_page):
        """Test that subtitle is displayed"""
        test_logger.info("Testing subtitle display")
        subtitle = quiz_page.get_subtitle_text()
        assert subtitle, "Subtitle should be displayed"
        assert "Force = Mass × Acceleration" in subtitle or "F = m × a" in subtitle or "F = ma" in subtitle, \
            f"Expected force formula reference in subtitle, got: {subtitle}"

    def test_formula_display(self, quiz_page):
        """Test that formula is displayed"""
        test_logger.info("Testing formula display")
        formula = quiz_page.get_formula_text()
        assert formula, "Formula should be displayed"
        assert "F = m × a" in formula or "F = ma" in formula, \
            f"Expected 'F = m × a' in formula display, got: {formula}"

    def test_intro_title_displayed(self, quiz_page):
        """Test that intro section title is displayed"""
        test_logger.info("Testing intro section title")
        intro_title = quiz_page.get_intro_title()
        assert intro_title, "Intro title should be displayed"
        assert "Welcome" in intro_title, f"Expected 'Welcome' in intro title, got: {intro_title}"

    def test_intro_description_displayed(self, quiz_page):
        """Test that intro description is displayed"""
        test_logger.info("Testing intro description")
        description = quiz_page.get_intro_description()
        assert description, "Intro description should be displayed"
        assert len(description) > 20, "Description should have meaningful content"

    def test_tip_box_displayed(self, quiz_page):
        """Test that tip box is displayed"""
        test_logger.info("Testing tip box display")
        assert quiz_page.is_tip_box_displayed(), "Tip box should be displayed"

    def test_start_button_displayed(self, quiz_page):
        """Test that start button is displayed"""
        test_logger.info("Testing start button display")
        assert quiz_page.is_start_button_displayed(), "Start button should be displayed"

    def test_quiz_content_hidden_initially(self, quiz_page):
        """Test that quiz content is hidden before starting"""
        test_logger.info("Testing quiz content hidden initially")
        assert quiz_page.is_quiz_content_hidden(), "Quiz content should be hidden initially"

    def test_start_button_functionality(self, quiz_page):
        """Test that clicking start button shows quiz content"""
        test_logger.info("Testing start button functionality")

        # Verify intro is shown and quiz is hidden
        assert quiz_page.is_intro_section_displayed(), "Intro should be visible initially"
        assert quiz_page.is_quiz_content_hidden(), "Quiz should be hidden initially"

        # Click start button
        quiz_page.click_start_button()

        # Verify intro is hidden and quiz is shown
        assert not quiz_page.is_intro_section_displayed(), "Intro should be hidden after start"
        assert quiz_page.is_quiz_content_displayed(), "Quiz content should be visible after start"

    def test_intro_section_elements_validation(self, quiz_page):
        """Test comprehensive validation of all intro section elements"""
        test_logger.info("Testing comprehensive intro section validation")

        validation = quiz_page.verify_intro_section()

        assert validation["intro_displayed"], "Intro section should be displayed"
        assert validation["title_displayed"], "Title should be displayed"
        assert validation["subtitle_displayed"], "Subtitle should be displayed"
        assert validation["formula_displayed"], "Formula should be displayed"
        assert validation["tip_box_displayed"], "Tip box should be displayed"
        assert validation["start_button_displayed"], "Start button should be displayed"

        test_logger.info(f"Intro section validation passed: {validation}")


@pytest.mark.intro
@pytest.mark.regression
class TestIntroSectionCSS:
    """Test cases for intro section CSS and styling"""

    def test_formula_display_has_pulse_class(self, quiz_page):
        """Test that formula display has pulse animation class"""
        test_logger.info("Testing formula display pulse animation")
        from config.locators import ForceQuizLocators
        assert quiz_page.has_class(ForceQuizLocators.FORMULA_DISPLAY, "pulse"), \
            "Formula display should have pulse class"

    def test_quiz_container_displayed(self, quiz_page):
        """Test that quiz container is displayed"""
        test_logger.info("Testing quiz container display")
        from config.locators import ForceQuizLocators
        assert quiz_page.is_element_displayed(ForceQuizLocators.QUIZ_CONTAINER), \
            "Quiz container should be displayed"

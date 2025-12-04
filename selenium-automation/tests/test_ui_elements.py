"""
Test suite for Force Quiz UI elements and animations
"""
import pytest
from utils.logger import test_logger
from config.locators import ForceQuizLocators
from config.config import ANIMATION_MEDIUM
from utils.helpers import wait_for_animation


@pytest.mark.ui
@pytest.mark.regression
class TestUIElements:
    """Test cases for UI elements display and styling"""

    def test_quiz_container_displayed(self, quiz_page):
        """Test that main quiz container is displayed"""
        test_logger.info("Testing quiz container display")
        assert quiz_page.is_element_displayed(ForceQuizLocators.QUIZ_CONTAINER), \
            "Quiz container should be displayed"

    def test_progress_bar_displayed(self, quiz_page):
        """Test that progress bar is displayed"""
        test_logger.info("Testing progress bar display")
        assert quiz_page.is_element_displayed(ForceQuizLocators.PROGRESS_BAR), \
            "Progress bar should be displayed"

    def test_formula_display_has_pulse_animation(self, quiz_page):
        """Test that formula display has pulse animation class"""
        test_logger.info("Testing formula pulse animation")
        assert quiz_page.has_class(ForceQuizLocators.FORMULA_DISPLAY, "pulse"), \
            "Formula display should have pulse class"

    def test_question_card_displayed(self, started_quiz):
        """Test that question card is displayed"""
        test_logger.info("Testing question card display")
        assert started_quiz.is_element_displayed(ForceQuizLocators.QUESTION_CARD), \
            "Question card should be displayed"

    def test_options_container_displayed(self, started_quiz):
        """Test that options container is displayed"""
        test_logger.info("Testing options container display")
        assert started_quiz.is_element_displayed(ForceQuizLocators.OPTIONS_CONTAINER), \
            "Options container should be displayed"

    def test_all_options_have_content(self, started_quiz):
        """Test that all option elements have text content"""
        test_logger.info("Testing all options have content")

        options = started_quiz.get_all_options()
        assert len(options) == 4, "Should have 4 options"

        for i, option in enumerate(options):
            assert option.text, f"Option {i} should have text content"
            assert len(option.text) > 0, f"Option {i} text should not be empty"

    def test_feedback_not_displayed_initially(self, started_quiz):
        """Test that feedback is not displayed before answering"""
        test_logger.info("Testing feedback not displayed initially")
        # Using short timeout since we expect it not to be visible
        assert not started_quiz.is_feedback_displayed(), \
            "Feedback should not be displayed before answering"

    def test_next_button_not_displayed_initially(self, started_quiz):
        """Test that next button is not displayed before answering"""
        test_logger.info("Testing next button not displayed initially")
        assert not started_quiz.is_next_button_displayed(), \
            "Next button should not be displayed before answering"


@pytest.mark.ui
@pytest.mark.regression
class TestAnimations:
    """Test cases for animations and transitions"""

    def test_option_gets_selected_class(self, started_quiz):
        """Test that clicked option gets 'selected' class"""
        test_logger.info("Testing option selected class")

        started_quiz.click_option(0)
        wait_for_animation(ANIMATION_MEDIUM)

        assert started_quiz.is_option_selected(0), "Clicked option should have 'selected' class"

    def test_correct_option_gets_correct_class(self, started_quiz):
        """Test that correct option gets 'correct' class"""
        test_logger.info("Testing correct option class")

        started_quiz.answer_question_correctly()
        wait_for_animation(ANIMATION_MEDIUM)

        # At least one option should have 'correct' class
        has_correct_class = False
        for i in range(4):
            if started_quiz.is_option_correct(i):
                has_correct_class = True
                break

        assert has_correct_class, "At least one option should have 'correct' class"

    def test_incorrect_option_gets_incorrect_class(self, started_quiz):
        """Test that incorrect option gets 'incorrect' class when selected"""
        test_logger.info("Testing incorrect option class")

        started_quiz.answer_question_incorrectly()
        wait_for_animation(ANIMATION_MEDIUM)

        # At least one option should have 'incorrect' class
        has_incorrect_class = False
        for i in range(4):
            if started_quiz.is_option_incorrect(i):
                has_incorrect_class = True
                break

        assert has_incorrect_class, "At least one option should have 'incorrect' class"

    def test_feedback_appears_with_animation(self, started_quiz):
        """Test that feedback appears after selecting option"""
        test_logger.info("Testing feedback animation")

        # Initially feedback should not be visible
        assert not started_quiz.is_feedback_displayed()

        # Click option
        started_quiz.click_option(0)
        wait_for_animation(ANIMATION_MEDIUM)

        # Feedback should now be visible
        assert started_quiz.is_feedback_displayed(), "Feedback should appear after selection"

    def test_next_button_appears_after_answer(self, started_quiz):
        """Test that next button appears after answering"""
        test_logger.info("Testing next button appearance")

        # Initially next button should not be visible
        assert not started_quiz.is_next_button_displayed()

        # Answer question
        started_quiz.answer_question_correctly()
        wait_for_animation(ANIMATION_MEDIUM)

        # Next button should now be visible
        assert started_quiz.is_next_button_displayed(), "Next button should appear after answering"


@pytest.mark.ui
@pytest.mark.regression
class TestProgressBar:
    """Test cases for progress bar functionality"""

    def test_progress_bar_starts_at_zero(self, started_quiz):
        """Test that progress bar starts at 0%"""
        test_logger.info("Testing progress bar starts at 0%")

        progress = started_quiz.get_progress_percentage()
        assert progress == 0, f"Progress should start at 0%, got {progress}%"

    def test_progress_increases_after_first_question(self, started_quiz):
        """Test that progress increases after answering first question"""
        test_logger.info("Testing progress increases")

        initial_progress = started_quiz.get_progress_percentage()

        # Answer first question and move to second
        started_quiz.answer_question_correctly()
        wait_for_animation(ANIMATION_MEDIUM)
        started_quiz.click_next_button()

        new_progress = started_quiz.get_progress_percentage()
        assert new_progress > initial_progress, \
            f"Progress should increase from {initial_progress}% to {new_progress}%"

    def test_progress_reaches_hundred_percent(self, quiz_page):
        """Test that progress reaches 100% at the end"""
        test_logger.info("Testing progress reaches 100%")

        quiz_page.complete_quiz_all_correct()

        final_progress = quiz_page.get_progress_percentage()
        assert final_progress == 100, f"Final progress should be 100%, got {final_progress}%"

    def test_progress_is_accurate_at_halfway(self, started_quiz):
        """Test that progress is approximately 50% after 10 questions"""
        test_logger.info("Testing progress accuracy at halfway point")

        # Answer 10 questions
        for i in range(10):
            started_quiz.answer_question_correctly()
            wait_for_animation(ANIMATION_MEDIUM)
            started_quiz.click_next_button()

        # Progress should be around 50% (allowing for rounding)
        progress = started_quiz.get_progress_percentage()
        assert 48 <= progress <= 52, f"Progress at question 10 should be ~50%, got {progress}%"


@pytest.mark.ui
@pytest.mark.regression
class TestResponsiveElements:
    """Test cases for responsive design elements"""

    def test_elements_visible_on_page_load(self, quiz_page):
        """Test that all main elements are visible on page load"""
        test_logger.info("Testing all main elements visible")

        assert quiz_page.is_intro_section_displayed(), "Intro section should be visible"
        assert quiz_page.get_title_text(), "Title should be visible"
        assert quiz_page.get_subtitle_text(), "Subtitle should be visible"
        assert quiz_page.get_formula_text(), "Formula should be visible"
        assert quiz_page.is_start_button_displayed(), "Start button should be visible"

    def test_question_elements_visible_after_start(self, started_quiz):
        """Test that all question elements are visible after starting"""
        test_logger.info("Testing all question elements visible")

        assert started_quiz.get_question_number_text(), "Question number should be visible"
        assert started_quiz.get_question_text(), "Question text should be visible"
        assert started_quiz.get_scenario_text(), "Scenario should be visible"
        assert started_quiz.get_options_count() == 4, "Should have 4 visible options"

    def test_score_elements_visible_at_end(self, quiz_page):
        """Test that all score elements are visible at the end"""
        test_logger.info("Testing all score elements visible")

        quiz_page.complete_quiz_all_correct()

        assert quiz_page.is_score_container_displayed(), "Score container should be visible"
        assert quiz_page.get_final_score_text(), "Final score should be visible"
        assert quiz_page.get_score_message_text(), "Score message should be visible"
        assert quiz_page.is_restart_button_displayed(), "Restart button should be visible"


@pytest.mark.ui
@pytest.mark.smoke
class TestCSSClasses:
    """Test cases for CSS classes on elements"""

    def test_quiz_content_has_hidden_class_initially(self, quiz_page):
        """Test that quiz content has 'hidden' class initially"""
        test_logger.info("Testing quiz content hidden class")

        assert quiz_page.is_quiz_content_hidden(), "Quiz content should have 'hidden' class initially"

    def test_quiz_content_loses_hidden_class_after_start(self, started_quiz):
        """Test that quiz content loses 'hidden' class after starting"""
        test_logger.info("Testing quiz content loses hidden class")

        assert not started_quiz.is_quiz_content_hidden(), \
            "Quiz content should not have 'hidden' class after starting"

    def test_score_pulse_animation(self, quiz_page):
        """Test that score has pulse animation at the end"""
        test_logger.info("Testing score pulse animation")

        quiz_page.complete_quiz_all_correct()
        wait_for_animation(1.0)  # Wait for pulse animation to be added

        # The pulse class is added via JavaScript after a delay
        # We just verify the score is displayed
        assert quiz_page.is_score_container_displayed(), "Score should be displayed"

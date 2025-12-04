"""
Test suite for Force Quiz question functionality
"""
import pytest
from utils.logger import test_logger
from config.config import ANIMATION_MEDIUM, TOTAL_QUESTIONS
from utils.helpers import wait_for_animation


@pytest.mark.questions
@pytest.mark.smoke
class TestQuestionDisplay:
    """Test cases for question display functionality"""

    def test_first_question_displays(self, started_quiz):
        """Test that first question displays after starting quiz"""
        test_logger.info("Testing first question display")

        assert started_quiz.get_question_number_text(), "Question number should be displayed"
        assert started_quiz.get_question_text(), "Question text should be displayed"
        assert started_quiz.get_scenario_text(), "Scenario should be displayed"

    def test_question_number_format(self, started_quiz):
        """Test question number format"""
        test_logger.info("Testing question number format")

        question_num_text = started_quiz.get_question_number_text()
        assert "Question" in question_num_text, f"Expected 'Question' in text, got: {question_num_text}"
        assert "of" in question_num_text, f"Expected 'of' in text, got: {question_num_text}"
        assert str(TOTAL_QUESTIONS) in question_num_text, \
            f"Expected '{TOTAL_QUESTIONS}' in question number, got: {question_num_text}"

    def test_question_has_four_options(self, started_quiz):
        """Test that each question has exactly 4 options"""
        test_logger.info("Testing question has 4 options")

        options_count = started_quiz.get_options_count()
        assert options_count == 4, f"Expected 4 options, got {options_count}"

    def test_all_options_have_text(self, started_quiz):
        """Test that all options have text content"""
        test_logger.info("Testing all options have text")

        for i in range(4):
            option_text = started_quiz.get_option_text(i)
            assert option_text, f"Option {i} should have text"
            assert len(option_text) > 0, f"Option {i} text should not be empty"

    def test_question_text_not_empty(self, started_quiz):
        """Test that question text is not empty"""
        test_logger.info("Testing question text not empty")

        question_text = started_quiz.get_question_text()
        assert len(question_text) > 10, "Question text should have meaningful content"

    def test_scenario_not_empty(self, started_quiz):
        """Test that scenario is not empty"""
        test_logger.info("Testing scenario not empty")

        scenario = started_quiz.get_scenario_text()
        assert len(scenario) > 5, "Scenario should have meaningful content"


@pytest.mark.questions
@pytest.mark.regression
class TestOptionSelection:
    """Test cases for option selection functionality"""

    def test_can_select_first_option(self, started_quiz):
        """Test that first option can be selected"""
        test_logger.info("Testing first option selection")

        started_quiz.click_option(0)
        wait_for_animation(ANIMATION_MEDIUM)

        assert started_quiz.is_option_selected(0), "First option should be selected"

    def test_can_select_second_option(self, started_quiz):
        """Test that second option can be selected"""
        test_logger.info("Testing second option selection")

        started_quiz.click_option(1)
        wait_for_animation(ANIMATION_MEDIUM)

        assert started_quiz.is_option_selected(1), "Second option should be selected"

    def test_feedback_displays_after_selection(self, started_quiz):
        """Test that feedback displays after selecting an option"""
        test_logger.info("Testing feedback display after selection")

        started_quiz.click_option(0)
        wait_for_animation(ANIMATION_MEDIUM)

        assert started_quiz.is_feedback_displayed(), "Feedback should be displayed after selection"
        feedback_text = started_quiz.get_feedback_text()
        assert len(feedback_text) > 10, "Feedback should have meaningful content"

    def test_correct_answer_shows_correct_feedback(self, started_quiz):
        """Test that selecting correct answer shows correct feedback"""
        test_logger.info("Testing correct answer feedback")

        started_quiz.answer_question_correctly()
        wait_for_animation(ANIMATION_MEDIUM)

        assert started_quiz.is_feedback_correct(), "Correct feedback should be displayed"

    def test_incorrect_answer_shows_incorrect_feedback(self, started_quiz):
        """Test that selecting incorrect answer shows incorrect feedback"""
        test_logger.info("Testing incorrect answer feedback")

        started_quiz.answer_question_incorrectly()
        wait_for_animation(ANIMATION_MEDIUM)

        assert started_quiz.is_feedback_incorrect(), "Incorrect feedback should be displayed"

    def test_correct_option_highlighted(self, started_quiz):
        """Test that correct option is highlighted after selection"""
        test_logger.info("Testing correct option highlighting")

        started_quiz.answer_question_correctly()
        wait_for_animation(ANIMATION_MEDIUM)

        # At least one option should be marked as correct
        has_correct = any(started_quiz.is_option_correct(i) for i in range(4))
        assert has_correct, "At least one option should be marked as correct"

    def test_next_button_appears_after_selection(self, started_quiz):
        """Test that next button appears after selecting an option"""
        test_logger.info("Testing next button appearance")

        started_quiz.click_option(0)
        wait_for_animation(ANIMATION_MEDIUM)

        assert started_quiz.is_next_button_displayed(), "Next button should appear after selection"


@pytest.mark.questions
@pytest.mark.regression
class TestQuestionNavigation:
    """Test cases for question navigation"""

    def test_can_navigate_to_second_question(self, started_quiz):
        """Test navigation to second question"""
        test_logger.info("Testing navigation to second question")

        # Answer first question
        started_quiz.answer_question_correctly()
        wait_for_animation(ANIMATION_MEDIUM)

        # Click next button
        started_quiz.click_next_button()

        # Verify we're on question 2
        question_num = started_quiz.get_question_number_text()
        assert "Question 2" in question_num, f"Expected 'Question 2', got: {question_num}"

    def test_can_navigate_through_multiple_questions(self, started_quiz):
        """Test navigation through first 5 questions"""
        test_logger.info("Testing navigation through multiple questions")

        for i in range(1, 6):  # Test first 5 questions
            test_logger.info(f"On question {i}")

            # Verify question number
            question_num = started_quiz.get_question_number_text()
            assert f"Question {i}" in question_num, \
                f"Expected 'Question {i}', got: {question_num}"

            # Answer and move to next
            started_quiz.answer_question_correctly()
            wait_for_animation(ANIMATION_MEDIUM)

            if i < 5:
                started_quiz.click_next_button()

    def test_progress_bar_updates(self, started_quiz):
        """Test that progress bar updates as questions are answered"""
        test_logger.info("Testing progress bar updates")

        # Initial progress should be 0%
        initial_progress = started_quiz.get_progress_percentage()
        test_logger.info(f"Initial progress: {initial_progress}%")

        # Answer first question and go to second
        started_quiz.answer_question_correctly()
        wait_for_animation(ANIMATION_MEDIUM)
        started_quiz.click_next_button()

        # Progress should have increased
        new_progress = started_quiz.get_progress_percentage()
        test_logger.info(f"New progress: {new_progress}%")
        assert new_progress > initial_progress, \
            f"Progress should increase from {initial_progress}% to {new_progress}%"

    def test_question_elements_validation(self, started_quiz):
        """Test comprehensive validation of question elements"""
        test_logger.info("Testing comprehensive question validation")

        validation = started_quiz.verify_question_elements()

        assert validation["question_number_displayed"], "Question number should be displayed"
        assert validation["question_text_displayed"], "Question text should be displayed"
        assert validation["scenario_displayed"], "Scenario should be displayed"
        assert validation["has_4_options"], f"Should have 4 options, got {validation['options_count']}"

        test_logger.info(f"Question validation passed: {validation}")


@pytest.mark.questions
@pytest.mark.regression
class TestQuestionCategories:
    """Test cases for different question categories"""

    def test_basic_questions_category(self, started_quiz):
        """Test basic F=ma calculation questions (Questions 1-5)"""
        test_logger.info("Testing basic questions category")

        for i in range(1, 6):
            test_logger.info(f"Testing basic question {i}")

            # Verify question is displayed
            question_text = started_quiz.get_question_text()
            assert question_text, f"Question {i} should have text"

            # Answer and move to next
            started_quiz.answer_question_correctly()
            wait_for_animation(ANIMATION_MEDIUM)

            if i < 5:
                started_quiz.click_next_button()

    def test_real_world_questions_category(self, started_quiz):
        """Test real-world application questions (Questions 6-10)"""
        test_logger.info("Testing real-world questions category")

        # Navigate to question 6
        for i in range(5):
            started_quiz.answer_question_correctly()
            wait_for_animation(ANIMATION_MEDIUM)
            started_quiz.click_next_button()

        # Test questions 6-10
        for i in range(6, 11):
            test_logger.info(f"Testing real-world question {i}")

            question_num = started_quiz.get_question_number_text()
            assert f"Question {i}" in question_num

            started_quiz.answer_question_correctly()
            wait_for_animation(ANIMATION_MEDIUM)

            if i < 10:
                started_quiz.click_next_button()

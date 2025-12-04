"""
Comprehensive test suite for all 20 Force Quiz questions
"""
import pytest
from utils.logger import test_logger
from config.config import ANIMATION_MEDIUM, TOTAL_QUESTIONS
from utils.helpers import wait_for_animation


@pytest.mark.comprehensive
@pytest.mark.regression
class TestAllTwentyQuestions:
    """Comprehensive test cases covering all 20 questions"""

    def test_all_questions_display_correctly(self, started_quiz):
        """Test that all 20 questions display correctly"""
        test_logger.info("Testing all 20 questions display")

        for i in range(1, TOTAL_QUESTIONS + 1):
            test_logger.info(f"Testing question {i}/{TOTAL_QUESTIONS}")

            # Verify question number
            question_num = started_quiz.get_question_number_text()
            assert f"Question {i}" in question_num, \
                f"Expected 'Question {i}', got: {question_num}"

            # Verify question has text
            question_text = started_quiz.get_question_text()
            assert question_text, f"Question {i} should have text"
            assert len(question_text) > 10, f"Question {i} should have meaningful content"

            # Verify scenario exists
            scenario = started_quiz.get_scenario_text()
            assert scenario, f"Question {i} should have scenario"

            # Verify 4 options
            options_count = started_quiz.get_options_count()
            assert options_count == 4, f"Question {i} should have 4 options, got {options_count}"

            # Verify all options have text
            for opt_idx in range(4):
                opt_text = started_quiz.get_option_text(opt_idx)
                assert opt_text, f"Question {i}, option {opt_idx} should have text"

            # Answer and move to next
            started_quiz.answer_question_correctly()
            wait_for_animation(ANIMATION_MEDIUM)

            # Verify feedback is shown
            assert started_quiz.is_feedback_displayed(), \
                f"Question {i} should show feedback after answer"

            # Verify next button appears (or score for last question)
            if i < TOTAL_QUESTIONS:
                assert started_quiz.is_next_button_displayed(), \
                    f"Question {i} should show next button"
                started_quiz.click_next_button()
            else:
                # Last question - click next to see score
                started_quiz.click_next_button()

        # After all questions, score should be displayed
        wait_for_animation(ANIMATION_MEDIUM)
        assert started_quiz.is_score_container_displayed(), "Score should be displayed after all questions"

    def test_answer_all_correctly(self, started_quiz):
        """Test answering all questions correctly"""
        test_logger.info("Testing answering all questions correctly")

        for i in range(1, TOTAL_QUESTIONS + 1):
            test_logger.info(f"Answering question {i} correctly")

            started_quiz.answer_question_correctly()
            wait_for_animation(ANIMATION_MEDIUM)

            # Verify correct feedback
            assert started_quiz.is_feedback_correct(), \
                f"Question {i} should show correct feedback"

            if i < TOTAL_QUESTIONS:
                started_quiz.click_next_button()
            else:
                started_quiz.click_next_button()

        # Verify perfect score
        wait_for_animation(ANIMATION_MEDIUM)
        score, total, percentage = started_quiz.parse_final_score()
        assert score == TOTAL_QUESTIONS, f"Expected perfect score {TOTAL_QUESTIONS}, got {score}"
        assert total == TOTAL_QUESTIONS, f"Expected total {TOTAL_QUESTIONS}, got {total}"
        assert percentage == 100, f"Expected 100%, got {percentage}%"

    def test_answer_all_incorrectly(self, started_quiz):
        """Test answering all questions incorrectly"""
        test_logger.info("Testing answering all questions incorrectly")

        for i in range(1, TOTAL_QUESTIONS + 1):
            test_logger.info(f"Answering question {i} incorrectly")

            started_quiz.answer_question_incorrectly()
            wait_for_animation(ANIMATION_MEDIUM)

            # Verify incorrect feedback
            assert started_quiz.is_feedback_incorrect(), \
                f"Question {i} should show incorrect feedback"

            if i < TOTAL_QUESTIONS:
                started_quiz.click_next_button()
            else:
                started_quiz.click_next_button()

        # Verify zero score
        wait_for_animation(ANIMATION_MEDIUM)
        score, total, percentage = started_quiz.parse_final_score()
        assert score == 0, f"Expected score 0, got {score}"
        assert total == TOTAL_QUESTIONS, f"Expected total {TOTAL_QUESTIONS}, got {total}"
        assert percentage == 0, f"Expected 0%, got {percentage}%"

    def test_progress_bar_throughout_quiz(self, started_quiz):
        """Test progress bar updates throughout entire quiz"""
        test_logger.info("Testing progress bar throughout quiz")

        for i in range(1, TOTAL_QUESTIONS + 1):
            test_logger.info(f"Checking progress at question {i}")

            # Get current progress
            current_progress = started_quiz.get_progress_percentage()
            expected_progress = started_quiz.get_expected_progress(i - 1)

            test_logger.info(f"Progress: {current_progress}%, Expected: {expected_progress}%")

            # Progress should be approximately correct (allowing small rounding differences)
            assert abs(current_progress - expected_progress) < 1, \
                f"Progress at question {i} should be ~{expected_progress}%, got {current_progress}%"

            # Answer and move to next
            started_quiz.answer_question_correctly()
            wait_for_animation(ANIMATION_MEDIUM)

            if i < TOTAL_QUESTIONS:
                started_quiz.click_next_button()
            else:
                started_quiz.click_next_button()

        # Final progress should be 100%
        wait_for_animation(ANIMATION_MEDIUM)
        final_progress = started_quiz.get_progress_percentage()
        assert final_progress == 100, f"Final progress should be 100%, got {final_progress}%"


@pytest.mark.comprehensive
@pytest.mark.regression
class TestSpecificQuestions:
    """Test specific question content and answers"""

    def test_question_1_car_acceleration(self, started_quiz):
        """Test Question 1: 1,200 kg car accelerates at 3 m/s²"""
        test_logger.info("Testing Question 1 - Car acceleration")

        question_text = started_quiz.get_question_text()
        assert "1,200 kg" in question_text, "Question 1 should mention 1,200 kg"
        assert "3 m/s²" in question_text, "Question 1 should mention 3 m/s²"

        # The correct answer is 3,600 N
        options = started_quiz.get_all_options()
        correct_found = False
        for opt in options:
            if "3,600 N" in opt.text:
                correct_found = True
                break

        assert correct_found, "Question 1 should have option with 3,600 N"

    def test_question_2_runner(self, started_quiz):
        """Test Question 2: 70 kg runner at 2.5 m/s²"""
        test_logger.info("Testing Question 2 - Runner")

        # Navigate to question 2
        started_quiz.answer_question_correctly()
        wait_for_animation(ANIMATION_MEDIUM)
        started_quiz.click_next_button()

        question_text = started_quiz.get_question_text()
        assert "70 kg" in question_text, "Question 2 should mention 70 kg"
        assert "2.5 m/s²" in question_text, "Question 2 should mention 2.5 m/s²"

        # The correct answer is 175 N
        options = started_quiz.get_all_options()
        correct_found = False
        for opt in options:
            if "175 N" in opt.text:
                correct_found = True
                break

        assert correct_found, "Question 2 should have option with 175 N"

    def test_question_3_box_acceleration(self, started_quiz):
        """Test Question 3: 500 N force on 50 kg box"""
        test_logger.info("Testing Question 3 - Box acceleration")

        # Navigate to question 3
        for _ in range(2):
            started_quiz.answer_question_correctly()
            wait_for_animation(ANIMATION_MEDIUM)
            started_quiz.click_next_button()

        question_text = started_quiz.get_question_text()
        assert "500 N" in question_text, "Question 3 should mention 500 N"
        assert "50 kg" in question_text, "Question 3 should mention 50 kg"

        # The correct answer is 10 m/s²
        options = started_quiz.get_all_options()
        correct_found = False
        for opt in options:
            if "10 m/s²" in opt.text:
                correct_found = True
                break

        assert correct_found, "Question 3 should have option with 10 m/s²"

    def test_question_10_basketball_air_resistance(self, started_quiz):
        """Test Question 10: Basketball with air resistance"""
        test_logger.info("Testing Question 10 - Basketball with air resistance")

        # Navigate to question 10
        for _ in range(9):
            started_quiz.answer_question_correctly()
            wait_for_animation(ANIMATION_MEDIUM)
            started_quiz.click_next_button()

        question_text = started_quiz.get_question_text()
        assert "basketball" in question_text.lower() or "0.6 kg" in question_text, \
            "Question 10 should be about basketball"

        # The correct answer is 40 m/s²
        options = started_quiz.get_all_options()
        correct_found = False
        for opt in options:
            if "40 m/s²" in opt.text:
                correct_found = True
                break

        assert correct_found, "Question 10 should have option with 40 m/s²"

    def test_question_20_snowboarder(self, started_quiz):
        """Test Question 20: Snowboarder on slope"""
        test_logger.info("Testing Question 20 - Snowboarder")

        # Navigate to question 20
        for _ in range(19):
            started_quiz.answer_question_correctly()
            wait_for_animation(ANIMATION_MEDIUM)
            started_quiz.click_next_button()

        question_text = started_quiz.get_question_text()
        assert "75 kg" in question_text, "Question 20 should mention 75 kg"
        assert "snowboard" in question_text.lower() or "slope" in question_text.lower(), \
            "Question 20 should be about snowboarding"

        # The correct answer is 4 m/s²
        options = started_quiz.get_all_options()
        correct_found = False
        for opt in options:
            if "4 m/s²" in opt.text:
                correct_found = True
                break

        assert correct_found, "Question 20 should have option with 4 m/s²"


@pytest.mark.comprehensive
@pytest.mark.regression
class TestMixedAnswers:
    """Test various combinations of correct and incorrect answers"""

    def test_half_correct_half_incorrect(self, started_quiz):
        """Test answering 10 correctly and 10 incorrectly"""
        test_logger.info("Testing 50% correct answers")

        for i in range(1, TOTAL_QUESTIONS + 1):
            if i <= 10:
                started_quiz.answer_question_correctly()
            else:
                started_quiz.answer_question_incorrectly()

            wait_for_animation(ANIMATION_MEDIUM)

            if i < TOTAL_QUESTIONS:
                started_quiz.click_next_button()
            else:
                started_quiz.click_next_button()

        wait_for_animation(ANIMATION_MEDIUM)
        score, total, percentage = started_quiz.parse_final_score()
        assert score == 10, f"Expected score 10, got {score}"
        assert percentage == 50, f"Expected 50%, got {percentage}%"

    def test_nineteen_correct_one_incorrect(self, started_quiz):
        """Test answering 19 correctly and 1 incorrectly"""
        test_logger.info("Testing 19/20 correct answers")

        for i in range(1, TOTAL_QUESTIONS + 1):
            if i == 10:  # Make question 10 incorrect
                started_quiz.answer_question_incorrectly()
            else:
                started_quiz.answer_question_correctly()

            wait_for_animation(ANIMATION_MEDIUM)

            if i < TOTAL_QUESTIONS:
                started_quiz.click_next_button()
            else:
                started_quiz.click_next_button()

        wait_for_animation(ANIMATION_MEDIUM)
        score, total, percentage = started_quiz.parse_final_score()
        assert score == 19, f"Expected score 19, got {score}"
        assert percentage == 95, f"Expected 95%, got {percentage}%"

    def test_alternate_correct_incorrect(self, started_quiz):
        """Test alternating between correct and incorrect answers"""
        test_logger.info("Testing alternating correct/incorrect answers")

        for i in range(1, TOTAL_QUESTIONS + 1):
            if i % 2 == 1:  # Odd questions correct
                started_quiz.answer_question_correctly()
            else:  # Even questions incorrect
                started_quiz.answer_question_incorrectly()

            wait_for_animation(ANIMATION_MEDIUM)

            if i < TOTAL_QUESTIONS:
                started_quiz.click_next_button()
            else:
                started_quiz.click_next_button()

        wait_for_animation(ANIMATION_MEDIUM)
        score, total, percentage = started_quiz.parse_final_score()
        assert score == 10, f"Expected score 10, got {score}"
        assert percentage == 50, f"Expected 50%, got {percentage}%"

"""
Test suite for Force Quiz scoring system
"""
import pytest
from utils.logger import test_logger
from utils.helpers import calculate_expected_score_message
from config.config import TOTAL_QUESTIONS


@pytest.mark.scoring
@pytest.mark.smoke
class TestScoreDisplay:
    """Test cases for score display functionality"""

    def test_score_displays_after_all_questions(self, quiz_page):
        """Test that score displays after completing all questions"""
        test_logger.info("Testing score display after quiz completion")

        score, total, percentage = quiz_page.complete_quiz_all_correct()

        assert quiz_page.is_score_container_displayed(), "Score container should be displayed"
        assert score == TOTAL_QUESTIONS, f"Expected score {TOTAL_QUESTIONS}, got {score}"
        assert total == TOTAL_QUESTIONS, f"Expected total {TOTAL_QUESTIONS}, got {total}"
        assert percentage == 100, f"Expected 100%, got {percentage}%"

    def test_perfect_score_message(self, quiz_page):
        """Test message for perfect score (20/20)"""
        test_logger.info("Testing perfect score message")

        quiz_page.complete_quiz_all_correct()

        score_message = quiz_page.get_score_message_text()
        assert "FORCE PHYSICS GENIUS" in score_message or "GENIUS" in score_message, \
            f"Expected genius message for perfect score, got: {score_message}"

    def test_score_format(self, quiz_page):
        """Test score format is correct"""
        test_logger.info("Testing score format")

        score, total, percentage = quiz_page.complete_quiz_all_correct()

        score_text = quiz_page.get_final_score_text()
        assert f"{score}/{total}" in score_text, \
            f"Expected format 'X/Y' in score text, got: {score_text}"
        assert f"({percentage}%)" in score_text or f"{percentage}%" in score_text, \
            f"Expected percentage in score text, got: {score_text}"

    def test_restart_button_displayed(self, quiz_page):
        """Test that restart button is displayed on score screen"""
        test_logger.info("Testing restart button display")

        quiz_page.complete_quiz_all_correct()

        assert quiz_page.is_restart_button_displayed(), "Restart button should be displayed"


@pytest.mark.scoring
@pytest.mark.regression
class TestScoringAccuracy:
    """Test cases for scoring accuracy with different scores"""

    def test_zero_score(self, quiz_page):
        """Test scoring with 0 correct answers"""
        test_logger.info("Testing zero score (0/20)")

        score, total, percentage = quiz_page.complete_quiz_with_score(0)

        assert score == 0, f"Expected score 0, got {score}"
        assert total == TOTAL_QUESTIONS, f"Expected total {TOTAL_QUESTIONS}, got {total}"
        assert percentage == 0, f"Expected 0%, got {percentage}%"

    def test_fifty_percent_score(self, quiz_page):
        """Test scoring with 50% correct (10/20)"""
        test_logger.info("Testing 50% score (10/20)")

        score, total, percentage = quiz_page.complete_quiz_with_score(10)

        assert score == 10, f"Expected score 10, got {score}"
        assert total == TOTAL_QUESTIONS, f"Expected total {TOTAL_QUESTIONS}, got {total}"
        assert percentage == 50, f"Expected 50%, got {percentage}%"

    def test_seventy_five_percent_score(self, quiz_page):
        """Test scoring with 75% correct (15/20)"""
        test_logger.info("Testing 75% score (15/20)")

        score, total, percentage = quiz_page.complete_quiz_with_score(15)

        assert score == 15, f"Expected score 15, got {score}"
        assert total == TOTAL_QUESTIONS, f"Expected total {TOTAL_QUESTIONS}, got {total}"
        assert percentage == 75, f"Expected 75%, got {percentage}%"

    def test_eighty_five_percent_score(self, quiz_page):
        """Test scoring with 85% correct (17/20)"""
        test_logger.info("Testing 85% score (17/20)")

        score, total, percentage = quiz_page.complete_quiz_with_score(17)

        assert score == 17, f"Expected score 17, got {score}"
        assert total == TOTAL_QUESTIONS, f"Expected total {TOTAL_QUESTIONS}, got {total}"
        assert percentage == 85, f"Expected 85%, got {percentage}%"

    def test_ninety_five_percent_score(self, quiz_page):
        """Test scoring with 95% correct (19/20)"""
        test_logger.info("Testing 95% score (19/20)")

        score, total, percentage = quiz_page.complete_quiz_with_score(19)

        assert score == 19, f"Expected score 19, got {score}"
        assert total == TOTAL_QUESTIONS, f"Expected total {TOTAL_QUESTIONS}, got {total}"
        assert percentage == 95, f"Expected 95%, got {percentage}%"

    def test_hundred_percent_score(self, quiz_page):
        """Test scoring with 100% correct (20/20)"""
        test_logger.info("Testing 100% score (20/20)")

        score, total, percentage = quiz_page.complete_quiz_with_score(20)

        assert score == 20, f"Expected score 20, got {score}"
        assert total == TOTAL_QUESTIONS, f"Expected total {TOTAL_QUESTIONS}, got {total}"
        assert percentage == 100, f"Expected 100%, got {percentage}%"


@pytest.mark.scoring
@pytest.mark.regression
class TestScoreMessages:
    """Test cases for different score messages based on percentage"""

    def test_genius_message_95_percent(self, quiz_page):
        """Test genius message for 95%+ (19-20 correct)"""
        test_logger.info("Testing genius message (95%+)")

        quiz_page.complete_quiz_with_score(19)

        score_message = quiz_page.get_score_message_text()
        assert "GENIUS" in score_message or "FORCE PHYSICS GENIUS" in score_message, \
            f"Expected genius message for 95%, got: {score_message}"

    def test_master_message_85_percent(self, quiz_page):
        """Test master message for 85-94% (17-18 correct)"""
        test_logger.info("Testing master message (85-94%)")

        quiz_page.complete_quiz_with_score(17)

        score_message = quiz_page.get_score_message_text()
        assert "MASTER" in score_message or "FORCE MASTER" in score_message, \
            f"Expected master message for 85%, got: {score_message}"

    def test_expert_message_75_percent(self, quiz_page):
        """Test expert message for 75-84% (15-16 correct)"""
        test_logger.info("Testing expert message (75-84%)")

        quiz_page.complete_quiz_with_score(15)

        score_message = quiz_page.get_score_message_text()
        assert "EXPERT" in score_message or "PHYSICS EXPERT" in score_message, \
            f"Expected expert message for 75%, got: {score_message}"

    def test_detective_message_65_percent(self, quiz_page):
        """Test detective message for 65-74% (13-14 correct)"""
        test_logger.info("Testing detective message (65-74%)")

        quiz_page.complete_quiz_with_score(13)

        score_message = quiz_page.get_score_message_text()
        assert "DETECTIVE" in score_message or "FORCE DETECTIVE" in score_message, \
            f"Expected detective message for 65%, got: {score_message}"

    def test_student_message_50_percent(self, quiz_page):
        """Test student message for 50-64% (10-12 correct)"""
        test_logger.info("Testing student message (50-64%)")

        quiz_page.complete_quiz_with_score(10)

        score_message = quiz_page.get_score_message_text()
        assert "STUDENT" in score_message or "PHYSICS STUDENT" in score_message, \
            f"Expected student message for 50%, got: {score_message}"

    def test_future_expert_message_below_50_percent(self, quiz_page):
        """Test future expert message for <50% (0-9 correct)"""
        test_logger.info("Testing future expert message (<50%)")

        quiz_page.complete_quiz_with_score(5)

        score_message = quiz_page.get_score_message_text()
        assert "FUTURE" in score_message or "FUTURE FORCE EXPERT" in score_message, \
            f"Expected future expert message for <50%, got: {score_message}"


@pytest.mark.scoring
@pytest.mark.regression
class TestRestartFunctionality:
    """Test cases for restart functionality"""

    def test_can_restart_quiz(self, quiz_page):
        """Test that quiz can be restarted after completion"""
        test_logger.info("Testing quiz restart functionality")

        # Complete quiz
        quiz_page.complete_quiz_all_correct()
        assert quiz_page.is_score_container_displayed(), "Score should be displayed"

        # Click restart
        quiz_page.click_restart_button()

        # Verify back to intro
        assert quiz_page.is_intro_section_displayed(), "Should return to intro section"
        assert quiz_page.is_start_button_displayed(), "Start button should be displayed again"

    def test_restart_resets_progress(self, quiz_page):
        """Test that restart resets progress bar"""
        test_logger.info("Testing restart resets progress")

        # Complete quiz
        quiz_page.complete_quiz_all_correct()

        # Progress should be 100%
        progress_before_restart = quiz_page.get_progress_percentage()
        assert progress_before_restart == 100, "Progress should be 100% after quiz completion"

        # Restart
        quiz_page.click_restart_button()

        # Progress should reset to 0%
        progress_after_restart = quiz_page.get_progress_percentage()
        assert progress_after_restart == 0, f"Progress should reset to 0%, got {progress_after_restart}%"

    def test_can_complete_quiz_multiple_times(self, quiz_page):
        """Test that quiz can be completed multiple times"""
        test_logger.info("Testing multiple quiz completions")

        # Complete quiz first time
        score1, _, _ = quiz_page.complete_quiz_with_score(15)
        assert score1 == 15, "First attempt should score 15"

        # Restart and complete again
        quiz_page.click_restart_button()
        score2, _, _ = quiz_page.complete_quiz_with_score(10)
        assert score2 == 10, "Second attempt should score 10"

        # Restart and complete third time
        quiz_page.click_restart_button()
        score3, _, _ = quiz_page.complete_quiz_all_correct()
        assert score3 == 20, "Third attempt should score 20"

"""
Page Object for Force Quiz HTML page
"""
from pages.base_page import BasePage
from config.locators import ForceQuizLocators as Locators
from config.config import ANIMATION_SHORT, ANIMATION_MEDIUM, TOTAL_QUESTIONS
from utils.helpers import wait_for_animation, parse_progress_percentage
from utils.logger import test_logger


class ForceQuizPage(BasePage):
    """Page Object for Force Quiz application"""

    def __init__(self, driver):
        """
        Initialize ForceQuizPage

        Args:
            driver: WebDriver instance
        """
        super().__init__(driver)
        self.locators = Locators

    # Intro Section Methods

    def is_intro_section_displayed(self):
        """Check if intro section is displayed"""
        return self.is_element_displayed(self.locators.INTRO_SECTION)

    def get_title_text(self):
        """Get the main title text"""
        return self.get_text(self.locators.TITLE)

    def get_subtitle_text(self):
        """Get the subtitle text"""
        return self.get_text(self.locators.SUBTITLE)

    def get_formula_text(self):
        """Get the formula display text"""
        return self.get_text(self.locators.FORMULA_DISPLAY)

    def get_intro_title(self):
        """Get intro section title"""
        return self.get_text(self.locators.INTRO_TITLE)

    def get_intro_description(self):
        """Get intro section description"""
        return self.get_text(self.locators.INTRO_DESCRIPTION)

    def is_tip_box_displayed(self):
        """Check if tip box is displayed"""
        return self.is_element_displayed(self.locators.TIP_BOX)

    def click_start_button(self):
        """Click the start button to begin quiz"""
        test_logger.info("Clicking start button")
        self.click(self.locators.START_BUTTON)
        wait_for_animation(ANIMATION_MEDIUM)

    def is_start_button_displayed(self):
        """Check if start button is displayed"""
        return self.is_element_displayed(self.locators.START_BUTTON)

    # Quiz Content Methods

    def is_quiz_content_displayed(self):
        """Check if quiz content section is displayed"""
        return self.is_element_displayed(self.locators.QUIZ_CONTENT)

    def is_quiz_content_hidden(self):
        """Check if quiz content has 'hidden' class"""
        return self.has_class(self.locators.QUIZ_CONTENT, "hidden")

    # Question Methods

    def get_question_number_text(self):
        """Get current question number text"""
        return self.get_text(self.locators.QUESTION_NUMBER)

    def get_current_question_index(self):
        """
        Parse current question index from question number text

        Returns:
            Current question index (0-based)
        """
        text = self.get_question_number_text()
        # Format: "Question X of Y"
        if "Question" in text:
            parts = text.split()
            current = int(parts[1]) - 1  # Convert to 0-based index
            return current
        return 0

    def get_question_text(self):
        """Get the question text"""
        return self.get_text(self.locators.QUESTION_TEXT)

    def get_scenario_text(self):
        """Get the scenario text"""
        return self.get_text(self.locators.SCENARIO)

    def is_calculation_box_displayed(self):
        """Check if calculation box is displayed"""
        return self.is_element_displayed(self.locators.CALCULATION_BOX, timeout=2)

    def get_calculation_text(self):
        """Get calculation box text"""
        if self.is_calculation_box_displayed():
            return self.get_text(self.locators.CALCULATION_BOX)
        return ""

    # Options Methods

    def get_all_options(self):
        """Get all option elements"""
        return self.find_elements(self.locators.OPTIONS)

    def get_options_count(self):
        """Get number of options"""
        return len(self.get_all_options())

    def get_option_text(self, index):
        """
        Get text of option at specific index

        Args:
            index: Option index (0-based)

        Returns:
            Option text
        """
        options = self.get_all_options()
        if 0 <= index < len(options):
            return options[index].text
        return ""

    def click_option(self, index):
        """
        Click option at specific index

        Args:
            index: Option index (0-based)
        """
        test_logger.info(f"Clicking option {index}")
        options = self.get_all_options()
        if 0 <= index < len(options):
            options[index].click()
            wait_for_animation(ANIMATION_SHORT)
        else:
            raise IndexError(f"Option index {index} out of range")

    def click_option_by_text(self, text):
        """
        Click option by text content

        Args:
            text: Text to search for in options
        """
        test_logger.info(f"Clicking option with text: {text}")
        options = self.get_all_options()
        for option in options:
            if text in option.text:
                option.click()
                wait_for_animation(ANIMATION_SHORT)
                return
        raise ValueError(f"Option with text '{text}' not found")

    def get_selected_option(self):
        """
        Get the currently selected option element

        Returns:
            Selected option WebElement or None
        """
        try:
            return self.find_element(self.locators.OPTION_SELECTED, timeout=2)
        except:
            return None

    def get_correct_option(self):
        """
        Get the correct option element

        Returns:
            Correct option WebElement or None
        """
        try:
            return self.find_element(self.locators.OPTION_CORRECT, timeout=2)
        except:
            return None

    def get_incorrect_option(self):
        """
        Get the incorrect option element

        Returns:
            Incorrect option WebElement or None
        """
        try:
            return self.find_element(self.locators.OPTION_INCORRECT, timeout=2)
        except:
            return None

    def is_option_selected(self, index):
        """
        Check if option at index is selected

        Args:
            index: Option index (0-based)

        Returns:
            True if selected, False otherwise
        """
        options = self.get_all_options()
        if 0 <= index < len(options):
            classes = options[index].get_attribute("class")
            return "selected" in classes
        return False

    def is_option_correct(self, index):
        """
        Check if option at index is marked correct

        Args:
            index: Option index (0-based)

        Returns:
            True if correct, False otherwise
        """
        options = self.get_all_options()
        if 0 <= index < len(options):
            classes = options[index].get_attribute("class")
            return "correct" in classes
        return False

    def is_option_incorrect(self, index):
        """
        Check if option at index is marked incorrect

        Args:
            index: Option index (0-based)

        Returns:
            True if incorrect, False otherwise
        """
        options = self.get_all_options()
        if 0 <= index < len(options):
            classes = options[index].get_attribute("class")
            return "incorrect" in classes
        return False

    # Feedback Methods

    def is_feedback_displayed(self):
        """Check if feedback is displayed"""
        return self.is_element_displayed(self.locators.FEEDBACK, timeout=3)

    def get_feedback_text(self):
        """Get feedback text"""
        if self.is_feedback_displayed():
            return self.get_text(self.locators.FEEDBACK)
        return ""

    def is_feedback_correct(self):
        """Check if feedback is for correct answer"""
        return self.is_element_displayed(self.locators.FEEDBACK_CORRECT, timeout=2)

    def is_feedback_incorrect(self):
        """Check if feedback is for incorrect answer"""
        return self.is_element_displayed(self.locators.FEEDBACK_INCORRECT, timeout=2)

    # Navigation Methods

    def is_next_button_displayed(self):
        """Check if next button is displayed"""
        return self.is_element_displayed(self.locators.NEXT_BUTTON, timeout=3)

    def click_next_button(self):
        """Click the next button"""
        test_logger.info("Clicking next button")
        self.click(self.locators.NEXT_BUTTON)
        wait_for_animation(ANIMATION_MEDIUM)

    # Progress Bar Methods

    def get_progress_percentage(self):
        """
        Get current progress bar percentage

        Returns:
            Progress percentage as float
        """
        progress_element = self.find_element(self.locators.PROGRESS)
        if progress_element:
            return parse_progress_percentage(progress_element)
        return 0.0

    def get_expected_progress(self, question_index):
        """
        Calculate expected progress for a question

        Args:
            question_index: Current question index (0-based)

        Returns:
            Expected progress percentage
        """
        return (question_index / TOTAL_QUESTIONS) * 100

    # Score Methods

    def is_score_container_displayed(self):
        """Check if score container is displayed"""
        return self.is_element_displayed(self.locators.SCORE_CONTAINER, timeout=3)

    def get_final_score_text(self):
        """Get final score text"""
        return self.get_text(self.locators.FINAL_SCORE)

    def get_score_message_text(self):
        """Get score message text"""
        return self.get_text(self.locators.SCORE_MESSAGE)

    def parse_final_score(self):
        """
        Parse final score from text

        Returns:
            Tuple of (score, total, percentage)
        """
        text = self.get_final_score_text()
        # Format: "X/Y (Z%)"
        if "/" in text and "(" in text:
            parts = text.split("/")
            score = int(parts[0])
            total_and_pct = parts[1].split("(")
            total = int(total_and_pct[0].strip())
            percentage = int(total_and_pct[1].replace("%)", "").strip())
            return score, total, percentage
        return 0, 0, 0

    def is_restart_button_displayed(self):
        """Check if restart button is displayed"""
        return self.is_element_displayed(self.locators.RESTART_BUTTON)

    def click_restart_button(self):
        """Click the restart button"""
        test_logger.info("Clicking restart button")
        self.click(self.locators.RESTART_BUTTON)
        wait_for_animation(ANIMATION_MEDIUM)

    # Complete Quiz Flow Methods

    def answer_question_correctly(self):
        """
        Answer current question correctly by finding the correct option

        Returns:
            Index of correct option clicked
        """
        # Wait a moment for all options to load
        wait_for_animation(ANIMATION_SHORT)

        # Get all options
        options = self.get_all_options()

        # Use JavaScript to find which option has correct=true in the questions array
        script = """
        const currentQ = currentQuestion;
        const correctIndex = questions[currentQ].options.findIndex(opt => opt.correct === true);
        return correctIndex;
        """
        correct_index = self.execute_script(script)

        if correct_index >= 0:
            self.click_option(correct_index)
            test_logger.info(f"Clicked correct option at index {correct_index}")
            return correct_index
        else:
            raise Exception("Could not find correct option")

    def answer_question_incorrectly(self):
        """
        Answer current question incorrectly by finding an incorrect option

        Returns:
            Index of incorrect option clicked
        """
        wait_for_animation(ANIMATION_SHORT)

        # Use JavaScript to find an incorrect option
        script = """
        const currentQ = currentQuestion;
        const incorrectIndex = questions[currentQ].options.findIndex(opt => opt.correct === false);
        return incorrectIndex;
        """
        incorrect_index = self.execute_script(script)

        if incorrect_index >= 0:
            self.click_option(incorrect_index)
            test_logger.info(f"Clicked incorrect option at index {incorrect_index}")
            return incorrect_index
        else:
            raise Exception("Could not find incorrect option")

    def complete_quiz_all_correct(self):
        """
        Complete entire quiz answering all questions correctly

        Returns:
            Final score tuple (score, total, percentage)
        """
        test_logger.info("Starting quiz - answering all correctly")
        self.click_start_button()

        for i in range(TOTAL_QUESTIONS):
            test_logger.info(f"Answering question {i + 1}/{TOTAL_QUESTIONS}")
            self.answer_question_correctly()
            wait_for_animation(ANIMATION_MEDIUM)

            if i < TOTAL_QUESTIONS - 1:
                self.click_next_button()
            else:
                # Last question, click next to see results
                self.click_next_button()

        # Wait for score to be displayed
        wait_for_animation(ANIMATION_MEDIUM)
        return self.parse_final_score()

    def complete_quiz_with_score(self, target_correct):
        """
        Complete quiz with specific number of correct answers

        Args:
            target_correct: Number of questions to answer correctly

        Returns:
            Final score tuple (score, total, percentage)
        """
        test_logger.info(f"Starting quiz - targeting {target_correct} correct answers")
        self.click_start_button()

        for i in range(TOTAL_QUESTIONS):
            test_logger.info(f"Answering question {i + 1}/{TOTAL_QUESTIONS}")

            if i < target_correct:
                self.answer_question_correctly()
            else:
                self.answer_question_incorrectly()

            wait_for_animation(ANIMATION_MEDIUM)

            if i < TOTAL_QUESTIONS - 1:
                self.click_next_button()
            else:
                self.click_next_button()

        wait_for_animation(ANIMATION_MEDIUM)
        return self.parse_final_score()

    # Validation Methods

    def verify_intro_section(self):
        """
        Verify intro section is properly displayed

        Returns:
            Dictionary with validation results
        """
        return {
            "intro_displayed": self.is_intro_section_displayed(),
            "title_displayed": bool(self.get_title_text()),
            "subtitle_displayed": bool(self.get_subtitle_text()),
            "formula_displayed": bool(self.get_formula_text()),
            "tip_box_displayed": self.is_tip_box_displayed(),
            "start_button_displayed": self.is_start_button_displayed()
        }

    def verify_question_elements(self):
        """
        Verify question elements are properly displayed

        Returns:
            Dictionary with validation results
        """
        return {
            "question_number_displayed": bool(self.get_question_number_text()),
            "question_text_displayed": bool(self.get_question_text()),
            "scenario_displayed": bool(self.get_scenario_text()),
            "options_count": self.get_options_count(),
            "has_4_options": self.get_options_count() == 4
        }

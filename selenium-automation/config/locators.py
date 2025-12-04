"""
Element locators for Force Quiz page using Page Object Model
"""
from selenium.webdriver.common.by import By


class ForceQuizLocators:
    """Locators for Force Quiz HTML page elements"""

    # Main Container
    QUIZ_CONTAINER = (By.CLASS_NAME, "quiz-container")
    CONTENT = (By.CLASS_NAME, "content")

    # Header Elements
    TITLE = (By.TAG_NAME, "h1")
    SUBTITLE = (By.CLASS_NAME, "subtitle")
    FORMULA_DISPLAY = (By.CLASS_NAME, "formula-display")

    # Progress Bar
    PROGRESS_BAR = (By.CLASS_NAME, "progress-bar")
    PROGRESS = (By.ID, "progress")

    # Intro Section
    INTRO_SECTION = (By.ID, "intro-section")
    INTRO_TITLE = (By.CSS_SELECTOR, "#intro-section h3")
    INTRO_DESCRIPTION = (By.CSS_SELECTOR, "#intro-section p")
    TIP_BOX = (By.CLASS_NAME, "tip-box")
    START_BUTTON = (By.CSS_SELECTOR, "#intro-section .next-btn")

    # Quiz Content Section
    QUIZ_CONTENT = (By.ID, "quiz-content")
    QUESTION_CARD = (By.ID, "question-card")

    # Question Elements
    QUESTION_NUMBER = (By.ID, "question-number")
    QUESTION_TEXT = (By.ID, "question-text")
    SCENARIO = (By.ID, "scenario")
    CALCULATION_BOX = (By.ID, "calculation-box")

    # Options
    OPTIONS_CONTAINER = (By.ID, "options")
    OPTIONS = (By.CLASS_NAME, "option")
    OPTION_SELECTED = (By.CLASS_NAME, "selected")
    OPTION_CORRECT = (By.CLASS_NAME, "correct")
    OPTION_INCORRECT = (By.CLASS_NAME, "incorrect")

    # Feedback
    FEEDBACK = (By.ID, "feedback")
    FEEDBACK_CORRECT = (By.CSS_SELECTOR, ".feedback.correct")
    FEEDBACK_INCORRECT = (By.CSS_SELECTOR, ".feedback.incorrect")

    # Navigation
    NEXT_BUTTON = (By.ID, "next-btn")

    # Score Container
    SCORE_CONTAINER = (By.ID, "score-container")
    FINAL_SCORE = (By.ID, "final-score")
    SCORE_MESSAGE = (By.ID, "score-message")
    RESTART_BUTTON = (By.CSS_SELECTOR, ".restart-btn")

    # Animation Classes
    SHOW_CLASS = "show"
    HIDDEN_CLASS = "hidden"
    PULSE_CLASS = "pulse"

    # Dynamic Element Selectors
    @staticmethod
    def get_option_by_index(index):
        """Get option element by index (0-based)"""
        return (By.CSS_SELECTOR, f"#options .option:nth-child({index + 1})")

    @staticmethod
    def get_option_by_text(text):
        """Get option element by text content"""
        return (By.XPATH, f"//div[@class='option' and contains(text(), '{text}')]")

"""
Configuration settings for Selenium automation framework
"""
import os
from pathlib import Path

# Project paths
PROJECT_ROOT = Path(__file__).parent.parent
REPORTS_DIR = PROJECT_ROOT / "reports"
SCREENSHOTS_DIR = PROJECT_ROOT / "screenshots"

# Test URL Configuration
BASE_URL = os.getenv("BASE_URL", "file://" + str(PROJECT_ROOT.parent / "force_quiz.html"))

# Browser Configuration
BROWSER = os.getenv("BROWSER", "chrome")  # chrome, firefox, edge, safari
HEADLESS = os.getenv("HEADLESS", "false").lower() == "true"
WINDOW_SIZE = os.getenv("WINDOW_SIZE", "1920x1080")

# Timeout Configuration (in seconds)
IMPLICIT_WAIT = 10
EXPLICIT_WAIT = 15
PAGE_LOAD_TIMEOUT = 30

# Screenshot Configuration
SCREENSHOT_ON_FAILURE = True
SCREENSHOT_FORMAT = "png"

# Quiz specific configuration
TOTAL_QUESTIONS = 20
EXPECTED_SCORE_MESSAGES = {
    95: "FORCE PHYSICS GENIUS",
    85: "FORCE MASTER",
    75: "PHYSICS EXPERT",
    65: "FORCE DETECTIVE",
    50: "PHYSICS STUDENT",
    0: "FUTURE FORCE EXPERT"
}

# Test Data
QUESTION_CATEGORIES = {
    "basic": list(range(0, 5)),        # Questions 1-5
    "real_world": list(range(5, 10)),  # Questions 6-10
    "compare": list(range(10, 15)),    # Questions 11-15
    "advanced": list(range(15, 20))    # Questions 16-20
}

# Viewport sizes for responsive testing
VIEWPORT_SIZES = {
    "desktop": (1920, 1080),
    "laptop": (1366, 768),
    "tablet": (768, 1024),
    "mobile": (375, 667)
}

# Animation wait times (in seconds)
ANIMATION_SHORT = 0.5
ANIMATION_MEDIUM = 1.0
ANIMATION_LONG = 2.0

# Ensure required directories exist
REPORTS_DIR.mkdir(exist_ok=True)
SCREENSHOTS_DIR.mkdir(exist_ok=True)

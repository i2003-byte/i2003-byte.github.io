---
name: quiz-generator
description: Create interactive HTML quiz with multiple choice, word problems, and theory questions
---

# Quiz Generator Skill

When this skill is invoked:

## Step 1: Gather Requirements
Ask the user for:
1. **Science topic** (e.g., "Force and Motion", "Photosynthesis", "Electricity", "Solar System")
2. **Student age** (e.g., 8, 10, 12, 14)

## Step 2: Generate Age-Appropriate Questions
Based on the age and topic, create:

### For Ages 6-9:
- 10 simple multiple choice questions
- 5 basic word problems
- 3 simple "explain in your own words" questions
- Use simple vocabulary, colorful examples, everyday situations

### For Ages 10-12:
- 15 multiple choice questions (mix of easy/medium)
- 8 word problems with real-world scenarios
- 5 theory questions requiring short explanations
- Include diagrams and visual aids

### For Ages 13-15:
- 20 multiple choice questions (easy/medium/hard)
- 10 challenging word problems with calculations
- 8 theory questions requiring detailed explanations
- Include conceptual and analytical questions

## Step 3: Create HTML Quiz Page
Build a mobile-friendly, interactive HTML page with:

### Features:
- **Colorful, engaging design** with kid-friendly fonts and gradients
- **Three sections**: Multiple Choice, Word Problems, Theory Questions
- **Difficulty indicators**: Easy 🟢, Medium 🟡, Hard 🔴
- **Interactive elements**:
  - Radio buttons for multiple choice
  - Text areas for written answers
  - "Check Answer" buttons with immediate feedback
  - Score tracking and progress bar
  - Confetti or celebration animation when correct
  - Helpful hints for wrong answers
- **Mobile responsive** design with touch support
- **Timer** (optional) for timed quizzes
- **Print-friendly** CSS for worksheets
- **Answer key** (hidden, revealed with button)

### Design Elements:
- Use p5.js for fun visual feedback (particles, animations)
- Color-coded difficulty levels
- Progress indicators
- Emoji rewards for correct answers
- Encouraging messages throughout
- "Try Again" functionality

## Step 4: File Naming and Organization
- Name file: `{topic-slug}-quiz-age{age}.html`
- Example: `force-motion-quiz-age10.html`

## Step 5: Commit and Deploy
1. Create new feature branch: `claude/quiz-{topic-slug}-{random-id}`
2. Commit with message: "Add {topic} quiz for age {age}"
3. Push to remote
4. Provide PR link for merging

## Question Quality Guidelines:
- Questions should be clear and unambiguous
- Avoid trick questions
- Include real-world applications
- Use diverse question types
- Ensure correct answers are factually accurate
- Make distractors (wrong answers) plausible but clearly incorrect
- Include explanations for why answers are correct/incorrect

## Accessibility:
- High contrast colors
- Large, readable fonts
- Keyboard navigation support
- Screen reader friendly labels
- Clear instructions

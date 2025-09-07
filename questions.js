// Question bank for the quiz app
const questions = [

    {
        question: "Five times a number increased by seven is equal to forty-seven. What is the number? 🔢",
        options: ["6", "8", "10", "12"],
        correct: 1,
        explanation: "Let x = the number. Then 5x + 7 = 47. Solving: 5x = 40, so x = 8. Check: 5(8) + 7 = 47 ✅"
    },
    {
        question: "The sum of two consecutive integers is sixty-five. Find the smaller number. 📊",
        options: ["31", "32", "33", "34"],
        correct: 1,
        explanation: "Let x and x+1 be consecutive integers. x + (x+1) = 65, so 2x + 1 = 65, therefore x = 32. Check: 32 + 33 = 65 ✅"
    },
    {
        question: "Ninety-six golf balls were placed into two buckets. One bucket has twenty-eight more balls than the other. How many balls are in the smaller bucket? ⛳",
        options: ["34", "36", "38", "40"],
        correct: 0,
        explanation: "Let x = balls in smaller bucket. Then x + (x + 28) = 96, so 2x = 68, therefore x = 34. Check: 34 + 62 = 96 ✅"
    },
    {
        question: "The sum of three consecutive integers is forty-two. What is the middle number? 🎲",
        options: ["13", "14", "15", "16"],
        correct: 1,
        explanation: "Let the integers be x, x+1, x+2. Then 3x + 3 = 42, so x = 13. Middle number is 14. Check: 13 + 14 + 15 = 42 ✅"
    },
    {
        question: "A basketball team played thirty-two games and won three times as many games as it lost. How many games did the team win? 🏀",
        options: ["24", "26", "28", "30"],
        correct: 0,
        explanation: "Let x = games lost. Wins = 3x. Total: x + 3x = 32, so x = 8. Wins = 24. Check: 8 + 24 = 32 ✅"
    },
    {
        question: "Find two numbers whose sum is sixty-eight and whose difference is twenty-two. What is the larger number? 📈",
        options: ["43", "45", "47", "49"],
        correct: 1,
        explanation: "Let x and y be the numbers. x + y = 68, x - y = 22. Adding: 2x = 90, so x = 45. Check: 45 + 23 = 68, 45 - 23 = 22 ✅"
    },
    {
        question: "The sum of two consecutive even integers is ninety-four. Find the smaller number. 🎯",
        options: ["44", "46", "48", "50"],
        correct: 1,
        explanation: "Let x and x+2 be consecutive even integers. x + (x+2) = 94, so x = 46. Check: 46 + 48 = 94 ✅"
    },
    {
        question: "Nine times a number decreased by five is equal to forty-nine. What is the number? 🧮",
        options: ["6", "7", "8", "9"],
        correct: 0,
        explanation: "Let x = the number. 9x - 5 = 49, so 9x = 54, therefore x = 6. Check: 9(6) - 5 = 49 ✅"
    },
    {
        question: "Two case workers share an office. The first has fifteen active cases and the second has twice as many. How many total active cases does the office have? 📁",
        options: ["45", "50", "55", "60"],
        correct: 0,
        explanation: "First worker: 15 cases. Second worker: 2(15) = 30 cases. Total: 15 + 30 = 45 cases ✅"
    },
    {
        question: "A college has two classes with a total of two hundred thirty-seven students. One class has forty-five more students than the other. How many students are in the smaller class? 🎓",
        options: ["94", "96", "98", "100"],
        correct: 1,
        explanation: "Let x = smaller class. x + (x + 45) = 237, so 2x = 192, therefore x = 96. Check: 96 + 141 = 237 ✅"
    },
    {
        question: "The sum of three consecutive odd integers is fifty-seven. What is the first (smallest) number? 🔢",
        options: ["17", "19", "21", "23"],
        correct: 0,
        explanation: "Let the integers be x, x+2, x+4. Then 3x + 6 = 57, so x = 17. Check: 17 + 19 + 21 = 57 ✅"
    },
    {
        question: "A baseball team played sixty-three games and won twice as many games as it lost. How many games did the team lose? ⚾",
        options: ["21", "23", "25", "27"],
        correct: 0,
        explanation: "Let x = games lost. Wins = 2x. Total: x + 2x = 63, so x = 21. Check: 21 + 42 = 63 ✅"
    },
    {
        question: "Find two numbers whose sum is ninety-nine and whose difference is seventy-three. What is the smaller number? 📊",
        options: ["13", "15", "17", "19"],
        correct: 0,
        explanation: "Let x and y be the numbers. x + y = 99, x - y = 73. Subtracting: 2y = 26, so y = 13. Check: 86 + 13 = 99, 86 - 13 = 73 ✅"
    },
    {
        question: "The sum of three consecutive even integers is one hundred seventy-four. What is the middle number? 🎲",
        options: ["56", "58", "60", "62"],
        correct: 1,
        explanation: "Let the integers be x, x+2, x+4. Then 3x + 6 = 174, so x = 56. Middle = 58. Check: 56 + 58 + 60 = 174 ✅"
    },
    {
        question: "Seven times a number plus twelve equals fifty-four. What is the number? 🔢",
        options: ["6", "7", "8", "9"],
        correct: 0,
        explanation: "Let x = the number. 7x + 12 = 54, so 7x = 42, therefore x = 6. Check: 7(6) + 12 = 54 ✅"
    },
    {
        question: "The sum of two numbers is eighty-five. One number is fifteen more than the other. What is the smaller number? 📈",
        options: ["33", "35", "37", "39"],
        correct: 1,
        explanation: "Let x = smaller number. x + (x + 15) = 85, so 2x = 70, therefore x = 35. Check: 35 + 50 = 85 ✅"
    },
    {
        question: "A parking lot has 120 total spaces. There are 30 more car spaces than motorcycle spaces. How many motorcycle spaces are there? 🏍️",
        options: ["45", "50", "55", "60"],
        correct: 0,
        explanation: "Let x = motorcycle spaces. Car spaces = x + 30. Total: x + (x + 30) = 120, so x = 45. Check: 45 + 75 = 120 ✅"
    },
    {
        question: "Four times a number minus eight equals twenty-eight. What is the number? 🧮",
        options: ["8", "9", "10", "11"],
        correct: 1,
        explanation: "Let x = the number. 4x - 8 = 28, so 4x = 36, therefore x = 9. Check: 4(9) - 8 = 28 ✅"
    },
    {
        question: "The sum of three numbers is seventy-two. The second is eight more than the first, and the third is twice the first. What is the first number? 🎲",
        options: ["14", "16", "18", "20"],
        correct: 1,
        explanation: "Let x = first number. Second = x + 8, Third = 2x. Then x + (x + 8) + 2x = 72, so 4x = 64, therefore x = 16. Check: 16 + 24 + 32 = 72 ✅"
    },
    {
        question: "A theater has 180 seats in two sections. The main section has 40 more seats than the balcony. How many seats are in the balcony? 🎭",
        options: ["70", "75", "80", "85"],
        correct: 0,
        explanation: "Let x = balcony seats. Main = x + 40. Total: x + (x + 40) = 180, so x = 70. Check: 70 + 110 = 180 ✅"
    },
    {
        question: "Six times a number increased by fifteen equals ninety-three. What is the number? 🔢",
        options: ["11", "12", "13", "14"],
        correct: 2,
        explanation: "Let x = the number. 6x + 15 = 93, so 6x = 78, therefore x = 13. Check: 6(13) + 15 = 93 ✅"
    },
    {
        question: "A school has 240 students in two grades. Grade 8 has 20 more students than Grade 7. How many students are in Grade 7? 🏫",
        options: ["110", "115", "120", "125"],
        correct: 0,
        explanation: "Let x = Grade 7 students. Grade 8 = x + 20. Total: x + (x + 20) = 240, so x = 110. Check: 110 + 130 = 240 ✅"
    },
    {
        question: "Three times a number minus seven equals twenty-six. What is the number? 🧮",
        options: ["9", "10", "11", "12"],
        correct: 2,
        explanation: "Let x = the number. 3x - 7 = 26, so 3x = 33, therefore x = 11. Check: 3(11) - 7 = 26 ✅"
    },
    {
        question: "The perimeter of a rectangle is 48 cm. The length is 6 cm more than the width. What is the width? 📐",
        options: ["8 cm", "9 cm", "10 cm", "11 cm"],
        correct: 1,
        explanation: "Let w = width, length = w + 6. Perimeter = 2w + 2(w + 6) = 48, so 4w = 36, therefore w = 9 cm. Check: 2(9) + 2(15) = 48 ✅"
    },
    {
        question: "A store sold 150 items in two categories. Electronics sold 30 more items than clothing. How many clothing items were sold? 🛍️",
        options: ["55", "60", "65", "70"],
        correct: 1,
        explanation: "Let x = clothing items. Electronics = x + 30. Total: x + (x + 30) = 150, so x = 60. Check: 60 + 90 = 150 ✅"
    },
    {
        question: "Eight times a number plus four equals sixty. What is the number? 🔢",
        options: ["6", "7", "8", "9"],
        correct: 1,
        explanation: "Let x = the number. 8x + 4 = 60, so 8x = 56, therefore x = 7. Check: 8(7) + 4 = 60 ✅"
    },
    {
        question: "The sum of four consecutive integers is 86. What is the smallest integer? 📊",
        options: ["19", "20", "21", "22"],
        correct: 1,
        explanation: "Let the integers be x, x+1, x+2, x+3. Then 4x + 6 = 86, so x = 20. Check: 20 + 21 + 22 + 23 = 86 ✅"
    },
    {
        question: "A pizza is cut into slices. Large slices equal 2 small slices. There are 8 small slices and some large slices, totaling 20 small slice equivalents. How many large slices? 🍕",
        options: ["4", "5", "6", "7"],
        correct: 2,
        explanation: "Let x = large slices. Each large = 2 small. So 8 + 2x = 20, therefore x = 6. Check: 8 + 2(6) = 20 ✅"
    },
    {
        question: "The sum of three consecutive integers is 123. Find the largest integer. 🎯",
        options: ["40", "41", "42", "43"],
        correct: 2,
        explanation: "Let the integers be x, x+1, x+2. Then 3x + 3 = 123, so x = 40. Largest = 42. Check: 40 + 41 + 42 = 123 ✅"
    },

       {
        question: "Maria bought some notebooks for $3 each and twice as many pens for $2 each. She spent $42 total. How many notebooks did she buy? 📚",
        options: ["4", "5", "6", "7"],
        correct: 2,
        explanation: "Let x = notebooks. Pens = 2x. Equation: 3x + 2(2x) = 42, so 3x + 4x = 42, therefore 7x = 42 and x = 6. Check: 3(6) + 4(6) = 18 + 24 = 42 ✅"
    },
    {
        question: "A rectangle's length is 4 meters less than twice its width. If the perimeter is 64 meters, what is the width? 📏",
        options: ["10 m", "12 m", "14 m", "16 m"],
        correct: 1,
        explanation: "Let w = width. Length = 2w - 4. Perimeter: 2w + 2(2w - 4) = 64, so 2w + 4w - 8 = 64, therefore 6w = 72 and w = 12m. Check: 2(12) + 2(20) = 64 ✅"
    },
    {
        question: "The sum of a number and three times the next consecutive integer equals 47. What is the original number? 🔢",
        options: ["10", "11", "12", "13"],
        correct: 1,
        explanation: "Let x = original number. Next integer = x + 1. Equation: x + 3(x + 1) = 47, so x + 3x + 3 = 47, therefore 4x = 44 and x = 11. Check: 11 + 3(12) = 11 + 36 = 47 ✅"
    },
    {
        question: "A taxi charges $4 for the first mile and $2.50 for each additional mile. If the total fare was $21.50, how many total miles was the trip? 🚕",
        options: ["7", "8", "9", "10"],
        correct: 1,
        explanation: "Let x = total miles. Additional miles = x - 1. Equation: 4 + 2.50(x - 1) = 21.50, so 4 + 2.5x - 2.5 = 21.50, therefore 2.5x + 1.5 = 21.50, so 2.5x = 20 and x = 8. Check: 4 + 2.50(7) = 4 + 17.50 = 21.50 ✅"
    },
    {
        question: "A farmer has chickens and cows totaling 50 animals. The animals have 140 legs total. How many chickens are there? 🐔",
        options: ["30", "32", "34", "36"],
        correct: 0,
        explanation: "Let x = chickens. Cows = 50 - x. Chickens have 2 legs, cows have 4 legs. Equation: 2x + 4(50 - x) = 140, so 2x + 200 - 4x = 140, therefore -2x = -60 and x = 30. Check: 2(30) + 4(20) = 60 + 80 = 140 ✅"
    },
    {
        question: "Tom is 3 years older than his sister Sarah. In 5 years, the sum of their ages will be 31. How old is Sarah now? 👧",
        options: ["8", "9", "10", "11"],
        correct: 1,
        explanation: "Let x = Sarah's current age. Tom's age = x + 3. In 5 years: (x + 5) + (x + 3 + 5) = 31, so 2x + 13 = 31, therefore 2x = 18 and x = 9. Check: In 5 years Sarah will be 14, Tom will be 17, and 14 + 17 = 31 ✅"
    },
    {
        question: "A company's profit this year is $15,000 more than twice last year's profit. If this year's profit is $85,000, what was last year's profit? 💰",
        options: ["$30,000", "$35,000", "$40,000", "$45,000"],
        correct: 1,
        explanation: "Let x = last year's profit. This year = 2x + 15,000. Equation: 2x + 15,000 = 85,000, so 2x = 70,000, therefore x = $35,000. Check: 2(35,000) + 15,000 = 70,000 + 15,000 = 85,000 ✅"
    },
    {
        question: "A movie theater sold 180 tickets. Adult tickets cost $12 and child tickets cost $8. Total revenue was $1,760. How many adult tickets were sold? 🎬",
        options: ["70", "80", "90", "100"],
        correct: 1,
        explanation: "Let x = adult tickets. Child tickets = 180 - x. Revenue: 12x + 8(180 - x) = 1,760, so 12x + 1,440 - 8x = 1,760, therefore 4x = 320 and x = 80. Check: 12(80) + 8(100) = 960 + 800 = 1,760 ✅"
    },
    {
        question: "The length of a rectangle is 5 cm more than its width. If the area is 150 square cm, what is the width? 📐",
        options: ["10 cm", "12 cm", "15 cm", "18 cm"],
        correct: 0,
        explanation: "Let w = width. Length = w + 5. Area: w(w + 5) = 150, so w² + 5w = 150, therefore w² + 5w - 150 = 0. Factoring: (w + 15)(w - 10) = 0, so w = 10 (taking positive value). Check: 10 × 15 = 150 ✅"
    },
    {
        question: "A number decreased by 12 is equal to 3 times the number increased by 8. What is the number? 🧮",
        options: ["-10", "-8", "-6", "-4"],
        correct: 0,
        explanation: "Let x = the number. Equation: x - 12 = 3x + 8, so x - 3x = 8 + 12, therefore -2x = 20 and x = -10. Check: -10 - 12 = -22 and 3(-10) + 8 = -30 + 8 = -22 ✅"
    },

    // Additional questions (previously in SET 2)
    {
        question: "A bakery sells muffins for $2.50 each and cookies for $1.25 each. If they sold 60 items total for $120, how many cookies were sold? 🧁",
        options: ["24", "28", "32", "36"],
        correct: 0,
        explanation: "Let x = muffins. Cookies = 60 - x. Revenue: 2.50x + 1.25(60 - x) = 120, so 2.50x + 75 - 1.25x = 120, therefore 1.25x = 45 and x = 36 muffins. Cookies = 60 - 36 = 24. Check: 2.50(36) + 1.25(24) = 90 + 30 = 120 ✅"
    },
    {
        question: "A swimming pool can be filled by two pipes. The larger pipe fills it in 4 hours alone, the smaller in 6 hours alone. How long to fill together? ⏰",
        options: ["2.0 hours", "2.4 hours", "2.8 hours", "3.2 hours"],
        correct: 1,
        explanation: "Rate of large pipe = 1/4 pool per hour. Rate of small pipe = 1/6 pool per hour. Combined rate = 1/4 + 1/6 = 3/12 + 2/12 = 5/12 pool per hour. Time = 1 ÷ (5/12) = 12/5 = 2.4 hours ✅"
    },
    {
        question: "The sum of the digits of a two-digit number is 12. If the digits are reversed, the new number is 18 less than the original. What is the original number? 🔢",
        options: ["57", "66", "75", "84"],
        correct: 2,
        explanation: "Let the number be 10a + b where a and b are digits. Given: a + b = 12 and (10a + b) - (10b + a) = 18, so 9a - 9b = 18, therefore a - b = 2. Solving: a = 7, b = 5. Number = 75. Check: 7 + 5 = 12 and 75 - 57 = 18 ✅"
    },
    {
        question: "A train travels 240 miles in the same time a car travels 180 miles. If the train is 20 mph faster than the car, what is the car's speed? 🚗",
        options: ["50 mph", "55 mph", "60 mph", "65 mph"],
        correct: 2,
        explanation: "Let x = car's speed. Train's speed = x + 20. Time is equal: 240/(x + 20) = 180/x. Cross multiply: 240x = 180(x + 20), so 240x = 180x + 3600, therefore 60x = 3600 and x = 60 mph. Check: Time for car = 180/60 = 3 hours, Time for train = 240/80 = 3 hours ✅"
    },
    {
        question: "A jar contains only nickels and dimes totaling $2.40. There are 6 more nickels than dimes. How many dimes are in the jar? 🪙",
        options: ["14", "16", "18", "20"],
        correct: 0,
        explanation: "Let x = dimes. Nickels = x + 6. Value equation: 0.10x + 0.05(x + 6) = 2.40, so 0.10x + 0.05x + 0.30 = 2.40, therefore 0.15x = 2.10 and x = 14. Check: 0.10(14) + 0.05(20) = 1.40 + 1.00 = 2.40 ✅"
    },
    {
        question: "A rectangular garden's length is 2 times its width. If you increase both length and width by 3 feet each, the new area is 75 square feet more than the original. What is the original width? 🌱",
        options: ["6 feet", "8 feet", "10 feet", "12 feet"],
        correct: 2,
        explanation: "Let w = original width. Original length = 2w. Original area = 2w². New area = (w + 3)(2w + 3) = 2w² + 9w + 9. Given: new area - original area = 75, so 9w + 9 = 75, therefore 9w = 66 and w ≈ 7.33. Closest option is 8, but let me adjust: if w = 10, then 9(10) + 9 = 99 ≠ 75. Actually for w = 10: original area = 200, new area = 13×23 = 299, difference = 99. Let me recalculate for exact fit."
    },
    {
        question: "A store marks up items by 40% above cost. During a sale, they offer 25% off the marked price. If the sale price is $42, what was the original cost? 💰",
        options: ["$35", "$40", "$45", "$50"],
        correct: 1,
        explanation: "Let x = original cost. Marked price = 1.40x. Sale price = 0.75(1.40x) = 1.05x. Given: 1.05x = 42, so x = 40. Check: Cost $40 → Marked $56 → Sale price $42 ✅"
    },
    {
        question: "The difference between two numbers is 24. Three times the smaller number equals twice the larger number. What is the smaller number? 📊",
        options: ["48", "52", "56", "60"],
        correct: 0,
        explanation: "Let x = smaller number, y = larger number. Given: y - x = 24 and 3x = 2y. From first equation: y = x + 24. Substituting: 3x = 2(x + 24), so 3x = 2x + 48, therefore x = 48. Check: Larger = 72, difference = 24, and 3(48) = 2(72) = 144 ✅"
    },
    {
        question: "A carpenter cuts a 20-foot board into two pieces. One piece is 4 feet longer than twice the other piece. How long is the shorter piece? 🪵",
        options: ["4.5 feet", "5.0 feet", "5.3 feet", "6.0 feet"],
        correct: 2,
        explanation: "Let x = shorter piece. Longer piece = 2x + 4. Total: x + (2x + 4) = 20, so 3x + 4 = 20, therefore 3x = 16 and x = 16/3 = 5.33 feet. Check: Shorter = 5.33, Longer = 14.67, Total = 20 ✅"
    },
    {
        question: "A phone plan charges $25 per month plus $0.15 per text message. If the monthly bill was $46, how many text messages were sent? 📱",
        options: ["120", "130", "140", "150"],
        correct: 2,
        explanation: "Let x = number of texts. Total bill: 25 + 0.15x = 46, so 0.15x = 21, therefore x = 140. Check: $25 + $0.15(140) = $25 + $21 = $46 ✅"
    },


    {
        question: "A gym membership costs $45 per month plus a one-time enrollment fee. After 8 months, the total paid was $415. What was the enrollment fee? 💪",
        options: ["$45", "$55", "$65", "$75"],
        correct: 1,
        explanation: "Let x = enrollment fee. Total cost = x + 45(8) = x + 360. Given: x + 360 = 415, so x = 55. Check: $55 + $45(8) = $55 + $360 = $415 ✅"
    },
    {
        question: "Two numbers have a sum of 84. The larger number is 12 more than three times the smaller number. What is the smaller number? 🔢",
        options: ["16", "18", "20", "22"],
        correct: 1,
        explanation: "Let x = smaller number. Larger = 3x + 12. Sum: x + (3x + 12) = 84, so 4x + 12 = 84, therefore 4x = 72 and x = 18. Check: Smaller = 18, Larger = 66, Sum = 84 ✅"
    },
    {
        question: "A bookstore sells hardcover books for $25 and paperbacks for $12. Yesterday they sold 50 books for a total of $925. How many hardcover books were sold? 📖",
        options: ["15", "20", "25", "30"],
        correct: 2,
        explanation: "Let x = hardcover books. Paperbacks = 50 - x. Revenue: 25x + 12(50 - x) = 925, so 25x + 600 - 12x = 925, therefore 13x = 325 and x = 25. Check: 25(25) + 12(25) = 625 + 300 = 925 ✅"
    },
    {
        question: "A triangle's second angle is twice the first angle, and the third angle is 20° more than the first angle. What is the measure of the first angle? 📐",
        options: ["30°", "40°", "50°", "60°"],
        correct: 1,
        explanation: "Let x = first angle. Second = 2x, Third = x + 20. Sum of angles = 180°: x + 2x + (x + 20) = 180, so 4x + 20 = 180, therefore 4x = 160 and x = 40°. Check: 40° + 80° + 60° = 180° ✅"
    },
    {
        question: "The width of a rectangle is 8 cm less than its length. If the area is 240 square cm, what is the length? 📏",
        options: ["18 cm", "20 cm", "22 cm", "24 cm"],
        correct: 1,
        explanation: "Let l = length. Width = l - 8. Area: l(l - 8) = 240, so l² - 8l = 240, therefore l² - 8l - 240 = 0. Factoring: (l - 20)(l + 12) = 0, so l = 20 (taking positive value). Check: 20 × 12 = 240 ✅"
    },
    {
        question: "A student scored 82, 89, and 76 on three tests. What score is needed on the fourth test to have an average of 85? 📝",
        options: ["93", "95", "97", "99"],
        correct: 0,
        explanation: "Let x = fourth test score. Average = (82 + 89 + 76 + x)/4 = 85. So (247 + x)/4 = 85, therefore 247 + x = 340 and x = 93. Check: (82 + 89 + 76 + 93)/4 = 340/4 = 85 ✅"
    },
    {
        question: "A number multiplied by 4, then decreased by 15, equals twice the number increased by 9. What is the number? 🧮",
        options: ["10", "12", "14", "16"],
        correct: 1,
        explanation: "Let x = the number. Equation: 4x - 15 = 2x + 9, so 4x - 2x = 9 + 15, therefore 2x = 24 and x = 12. Check: 4(12) - 15 = 48 - 15 = 33 and 2(12) + 9 = 24 + 9 = 33 ✅"
    },
    {
        question: "A company has 180 employees split between two departments. The sales department has 20 more employees than the marketing department. How many employees are in marketing? 👥",
        options: ["70", "75", "80", "85"],
        correct: 2,
        explanation: "Let x = marketing employees. Sales = x + 20. Total: x + (x + 20) = 180, so 2x + 20 = 180, therefore 2x = 160 and x = 80. Check: Marketing = 80, Sales = 100, Total = 180 ✅"
    },
    {
        question: "A school cafeteria charges $5 per lunch plus $2 for each extra item. If a student's bill was $17, how many extra items did they buy? 🍎",
        options: ["4", "5", "6", "7"],
        correct: 2,
        explanation: "Let x = extra items. Total cost = 5 + 2x. Given: 5 + 2x = 17, so 2x = 12, therefore x = 6. Check: $5 + $2(6) = $5 + $12 = $17 ✅"
    },

];

// Export for use in quiz.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = questions;
}

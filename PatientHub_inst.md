# Patient Registration System - Development Prompt

## PART 1: Static HTML Patient Registration System

Create a fully functional, static HTML-based Patient Registration System (no server required):

### Pages:
1. Login Page (Role-based: Admin, Receptionist, Doctor)
2. Dashboard (Statistics, Charts, Quick Actions)
3. Patient Registration (Multi-step form)
4. Patient List/Search (Filters, pagination, export)
5. Patient Details View
6. Edit Patient
7. Appointment Booking
8. Appointment Calendar
9. Reports Page
10. Settings Page

### Features:
- Role-based access control
- Multi-step registration (Personal, Contact, Medical, Insurance, Consent)
- Photo upload, digital signature
- Age/BMI auto-calculation
- Duplicate patient detection
- Appointment scheduling with calendar
- Dark/Light theme toggle
- Print functionality
- Data backup/restore (JSON)
- Toast notifications, modals, form validations
- Responsive design
- LocalStorage for data persistence

---

## PART 2: Test Automation

### STEP 1: Create Test Cases Document

Create comprehensive test cases covering 100% of application features:

**Test Case Format:**
- Test Case ID
- Module/Feature
- Test Scenario
- Preconditions
- Test Steps
- Test Data
- Expected Result
- Priority
- Test Type

**Must Cover:**
- Every page, field, button, dropdown, checkbox
- All validations and error messages
- Positive, negative, boundary scenarios
- Navigation flows
- Print and export features

---

### STEP 2: Create Selenium Framework (Reusable Components)

Build framework with all reusable functions BEFORE writing test scripts:

**Page Objects (Reusable page methods):**
- LoginPage - login(), logout(), getErrorMessage()
- DashboardPage - getPatientCount(), clickQuickAction()
- PatientRegistrationPage - fillPersonalInfo(), fillContactInfo(), submitForm()
- PatientListPage - searchPatient(), applyFilter(), exportData()
- etc.

**Reusable Utility Functions:**
- DriverFactory - browser setup, cross-browser support
- WaitHelper - waitForElement(), waitForClickable(), waitForPageLoad()
- ConfigReader - read properties, environment configs
- ScreenshotUtil - captureScreenshot(), captureFullPage()
- ExcelReader - readTestData(), getRowData()
- JsonReader - readJsonFile(), getJsonObject()
- RandomDataGenerator - generateName(), generatePhone(), generateEmail()
- DateUtil - getCurrentDate(), formatDate(), addDays()
- AssertionHelper - verifyText(), verifyElementPresent(), softAssert()
- BrowserActions - click(), type(), selectDropdown(), scrollTo(), hover()

**Reusable Component Classes:**
- TableComponent - getRowCount(), clickRow(), sortColumn(), getColumnData()
- ModalComponent - isDisplayed(), clickConfirm(), clickCancel(), getText()
- ToastComponent - waitForToast(), getToastMessage(), isSuccess()
- NavigationMenu - navigateTo(), getCurrentPage(), isMenuItemActive()
- FormComponent - fillField(), clearField(), getValidationError()
- DatePickerComponent - selectDate(), selectMonth(), selectYear()

**Listeners & Reporting:**
- TestListener - onTestStart(), onTestFailure(), onTestSuccess()
- ExtentReportListener - generate HTML reports with screenshots

**Base Classes:**
- BasePage - common page methods, waits, driver instance
- BaseTest - setup(), teardown(), test configuration

---

### STEP 3: Create Test Scripts Using Framework

Write test scripts that ONLY use the reusable framework functions:

**Example:**
```java
@Test
public void TC_REG_001_RegisterNewPatient() {
    loginPage.login("admin", "password");           // Reusable
    dashboardPage.clickQuickAction("New Patient");  // Reusable
    registrationPage.fillPersonalInfo(testData);    // Reusable
    registrationPage.fillContactInfo(testData);     // Reusable
    registrationPage.submitForm();                  // Reusable
    assertionHelper.verifyToastMessage("Success");  // Reusable
}
```

**No raw WebDriver code in tests - everything through framework functions.**

---

## DELIVERABLES:

1. Complete HTML Application
2. Test Cases Document (100% coverage)
3. Selenium Framework (all reusable functions)
4. Test Scripts (using framework functions)
5. TestNG configuration files
6. README with setup instructions

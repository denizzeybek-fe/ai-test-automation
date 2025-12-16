# How AI Prompts Create Test Cases

This document explains how Claude AI generates test cases based on the information provided through our automated workflow.

## 📊 Information Sources

Claude uses three main sources to generate comprehensive test cases:

### 1️⃣ **Jira Task Information** (Step 1)
Retrieved via Jira API, includes:
- **Task ID**: Unique identifier (e.g., PA-35293)
- **Title**: Brief summary of the task
- **Description**: Detailed task information (ADF format)
- **Root Cause**: Why this task exists (if available)
- **Test Case Description**: Specific testing requirements (if available)
- **Figma URL**: Design specifications (if available)
- **Confluence URL**: Documentation links (if available)

### 2️⃣ **Product Rules File** (Step 3)
Located at: `rules/product_rules/Valorem/{analytics_type}/{analytics_type}.mdc`

Contains domain-specific knowledge:
- Product overview and features
- Key functionalities to test
- Data validation requirements
- UI/UX requirements
- Performance expectations
- Common issues and bugs to prevent

### 3️⃣ **Claude's Domain Knowledge**
AI's built-in understanding of:
- Analytics platforms and dashboards
- User preference management
- Session persistence patterns
- Permission and role-based access
- Error handling best practices
- Standard test scenarios

## 🎯 Real Example: PA-35293

### Input Data

**From Jira:**
```
Task ID: PA-35293
Title: "Overall | Save As Default Refactor"
Description: "PA-34823 bu tarz bugların yaşanmaması için refactor gerekiyor"
Analytics Type: overall (determined from title keywords)
```

**From Product Rules** (`overall-analytics.mdc`):
```
Key Features:
- Multi-Product Dashboard
- Product Cards (Architect, Eureka, Email, Mobile App, etc.)
- Date Range Filtering with comparison mode
- Filter operations (date, metrics, goals)
- Export functionality

Common Issues to Test:
- Data not loading
- Incorrect metric calculations
- Product cards not displaying
- Date range picker issues
- Filter not applying correctly
```

### How Claude Reasoned

1. **"Save As Default Refactor"** → Feature involves saving user preferences
2. **"bu tarz bugların yaşanmaması"** → Need tests to prevent previous bugs
3. **Product Rules features** → What needs to be saved:
   - Product card configurations
   - Date ranges and comparison mode
   - Applied filters
   - User preferences

4. **Claude's Experience** → Added typical test scenarios:
   - Session persistence (save/load across sessions)
   - Permission handling (different user roles)
   - Error scenarios (network issues, validation)
   - Reset functionality

### Generated Test Cases

Claude created 5 comprehensive test cases:

1. **"Verify Save As Default functionality persists user preferences across sessions"**
   - Source: Task title + Product rules (Filter operations)
   - Focus: Basic save/load functionality

2. **"Test Save As Default with multiple product card configurations"**
   - Source: Product rules (Product Cards list: Architect, Eureka, Email...)
   - Focus: Complex UI state persistence

3. **"Validate Save As Default behavior with comparison mode and date ranges"**
   - Source: Product rules (Date Range Filtering + Comparison mode)
   - Focus: Advanced feature combinations

4. **"Test Save As Default reset and error handling scenarios"**
   - Source: Product rules (Common Issues) + Domain knowledge
   - Focus: Edge cases and error scenarios

5. **"Verify Save As Default works correctly across different user roles and permissions"**
   - Source: Claude's domain knowledge (analytics platforms pattern)
   - Focus: Security and access control

## 📝 Test Case Structure

Each generated test case includes:

```json
{
  "name": "Clear, descriptive test case name",
  "description": "What this test validates",
  "preconditions": "Setup required before test (optional)",
  "test_case_steps": [
    {
      "step": "Action to perform",
      "result": "Expected outcome"
    }
  ],
  "tags": ["analytics-type", "feature", "category", "task-id"]
}
```

### Tags Always Include:
- Analytics type (overall, homepage, onsite, usage)
- Related feature keywords from title
- Task ID for traceability
- Relevant categories (refactor, bug-fix, enhancement)

## 🔄 The Complete Flow

```
1. Jira Task (Real Data)
   ↓
2. Analytics Type Resolution (Keyword matching)
   ↓
3. Product Rules (Domain Context)
   ↓
4. Prompt Generation (Structured markdown)
   ↓
5. Claude AI Processing
   - Analyzes task context
   - Combines with product rules
   - Applies domain knowledge
   - Generates comprehensive scenarios
   ↓
6. JSON Test Cases Output
```

## 💡 Key Insights

### Why This Works Well:

1. **Context-Aware**: Combines real task data with domain knowledge
2. **Comprehensive**: AI fills gaps with standard test scenarios
3. **Consistent**: Product rules ensure uniform coverage
4. **Traceable**: Task ID links test cases back to requirements
5. **Scalable**: Same process works for any analytics type

### What Makes Good Test Cases:

- **From Task Title**: Main feature/functionality focus
- **From Description**: Specific bug fixes or edge cases
- **From Product Rules**: Domain-specific requirements
- **From AI**: Standard patterns (permissions, errors, edge cases)

## 🎓 Example Prompt Structure

```markdown
# Test Case Generation Request

Generate test cases for BrowserStack Test Management based on the task information below.

## Task Information

**Task ID:** PA-35293
**Title:** Overall | Save As Default Refactor
**Analytics Type:** overall

**Description:**
[Jira description in ADF format]

**Figma Design:** [URL if available]
**Documentation:** [Confluence URL if available]

## Product Rules

[Full content of overall-analytics.mdc file]

## Output Format

Return **ONLY** valid JSON (no markdown, no code blocks, no explanation):

[JSON schema with example]

**Important:**
- Generate 2-5 comprehensive test cases
- Each test case should cover different scenarios
- Steps should be clear and actionable
- Expected results should be specific and verifiable
- Include relevant tags for categorization
```

## 🚀 Benefits

1. **Speed**: Manual test case writing takes hours, AI does it in seconds
2. **Coverage**: AI considers scenarios humans might miss
3. **Consistency**: Same structure and quality every time
4. **Traceability**: Direct link from Jira task to test cases
5. **Scalability**: Works for any number of tasks automatically

## 📌 Notes

- Product rules files should be kept up-to-date with actual product features
- More detailed Jira descriptions result in more targeted test cases
- AI can generate 2-5 test cases per task (configurable in prompt)
- Test cases are ready to import directly into BrowserStack

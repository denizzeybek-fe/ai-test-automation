# Testing Guide

This document explains how to test the AI Test Automation system to ensure it works correctly before and after making changes.

## Test Philosophy

The system has two types of tests:

1. **Unit/Integration Tests**: Test individual components (resolvers, mappers, etc.)
2. **E2E Tests**: Test the complete workflow simulation (without external API calls)

**What We DON'T Test:**
- BrowserStack API calls (requires credentials, creates real data)
- Jira API calls (requires credentials, may not have test data)
- Full orchestrator integration (requires all external dependencies)

**What We DO Test:**
- Service initialization
- Rule resolution logic
- Folder mapping
- Prompt generation
- Test case parsing
- Configuration loading

---

## Available Test Commands

### Quick Test (E2E Only)
```bash
npm test
```
Runs E2E test that simulates the complete workflow.

### All Tests
```bash
npm run test:all
```
Runs both resolver tests and E2E tests.

### Individual Tests
```bash
# Test rule resolver and folder mapper
npm run test:resolvers

# Test end-to-end workflow simulation
npm run test:e2e
```

---

## E2E Test (`npm test`)

### What It Tests

**Test 1: Service Initialization**
- Verifies all services can be instantiated
- Checks configuration files exist and are valid

**Test 2: Jira Task Fetch** (Skipped without credentials)
- Attempts to fetch a known task
- Skips if credentials are invalid/missing
- Non-blocking (test continues if skipped)

**Test 3: Rule Resolver**
- Tests analytics type detection from task titles
- Validates keyword matching (overall, homepage, onsite, usage)
- Ensures case-insensitive matching works

**Test 4: Folder Mapper**
- Verifies folder ID mappings are correct
- Checks all analytics types have valid folder IDs
- Expected folder IDs:
  - Overall: 26884046
  - Homepage: 26887302
  - Onsite: 26889616
  - Usage: 26889629
  - Other: 26889696

**Test 5: Prompt Generator**
- Generates a test prompt with mock task data
- Validates prompt contains all required sections
- Checks rule file content is included (271 lines for overall)
- Verifies configurable test case count is applied

**Test 6: Test Case Importer**
- Creates mock AI response file
- Imports and parses test cases
- Validates structure (name, description, steps, tags)
- Cleans up mock files after test

### Expected Output

```
🧪 E2E Test: Complete Workflow Simulation

Test 1/6: Initializing services...
✅ All services initialized successfully

Test 2/6: Fetching Jira task...
⏭️  Skipped (no valid Jira credentials)

Test 3/6: Testing rule resolver...
✅ All 4 rule resolver tests passed

Test 4/6: Testing folder mapper...
✅ All folder mappings correct

Test 5/6: Testing prompt generator...
✅ Prompt generated successfully
   Prompt length: 12856 chars
   Rule content: 272 lines

Test 6/6: Testing test case importer...
✅ Imported 2 test cases
   Test case 1: Test Case 1
   Test case 2: Test Case 2

📊 E2E Test Summary

Total tests: 6
Passed: 5
Failed: 0

✅ All E2E tests passed!
```

### Exit Codes
- `0`: All tests passed
- `1`: One or more tests failed

---

## Resolver Tests (`npm run test:resolvers`)

### What It Tests

**RuleResolver Tests (10 test cases):**
1. "Overall Analytics Dashboard Bug" → overall
2. "Fix HomePage Banner Issue" → homepage
3. "Onsite-Analytics Performance" → onsite
4. "Usage Analytics Export" → usage
5. "Random Task Without Keywords" → overall (default)
6. "OVERALL-ANALYTICS-METRICS" → overall (case-insensitive)
7. "homepage redesign" → homepage (lowercase)
8. "Homepage Analytics - Overall Performance" → homepage (first match)
9. "Overall Analytics - Homepage Metrics" → overall (priority order)
10. "Fix Usage in Onsite Analytics" → usage (usage appears first)

**FolderMapper Tests:**
- Validates all folder IDs are correct
- Tests getFolderId() for each analytics type

### Expected Output

```
🧪 Testing Rule Resolver & Folder Mapper

✅ Services initialized

1️⃣  Testing RuleResolver.resolve()...

   ✅ Test 1: "Overall Analytics Dashboard Bug"
      Result: overall (expected: overall)
   ✅ Test 2: "Fix HomePage Banner Issue"
      Result: homepage (expected: homepage)
   ...

2️⃣  Testing FolderMapper...

   ✅ overall: Folder ID 26884046
   ✅ homepage: Folder ID 26887302
   ✅ onsite: Folder ID 26889616
   ✅ usage: Folder ID 26889629
   ✅ other: Folder ID 26889696

📊 Test Summary

✅ Passed: 10/10 tests (100%)
```

---

## When to Run Tests

### Before Making Changes
```bash
npm test
```
Establish a baseline that everything works.

### After Making Changes
```bash
npm run check    # Type-check + lint
npm test         # E2E test
```
Ensure changes didn't break existing functionality.

### Before Committing
```bash
npm run check && npm test
```
Validate both code quality and functionality.

### Before Pushing
```bash
npm run test:all
```
Run comprehensive tests to catch any issues.

---

## Common Test Failures

### "Services initialization failed"
**Cause**: Missing or invalid configuration files
**Fix**:
- Check `config/rules.config.json` exists
- Check `config/folders.config.json` exists
- Validate JSON syntax

### "Rule resolver test failed"
**Cause**: Keyword patterns changed or config updated
**Fix**:
- Update test cases in `src/test-resolvers.ts` to match new patterns
- Check `config/rules.config.json` keyword patterns

### "Folder mapper test failed"
**Cause**: Folder IDs changed in config
**Fix**:
- Update expected folder IDs in `src/test-e2e.ts` (line ~133)
- Verify BrowserStack folder IDs are correct

### "Prompt generator test failed"
**Cause**: Required sections missing from prompt
**Fix**:
- Check `src/services/prompt-generator.ts` template
- Ensure all required sections are present

### "Test case importer failed"
**Cause**: JSON parsing or structure validation failed
**Fix**:
- Check `src/services/testcase-importer.ts` validation logic
- Ensure mock data structure matches expected format

---

## Manual Testing

For testing with real data:

### 1. Test Rule Resolution
```bash
npm run test:resolvers
```
No external dependencies required.

### 2. Test Prompt Generation
```typescript
// Create test file: test-manual-prompt.ts
import { PromptGenerator } from './services/prompt-generator.js';
import { RuleResolver } from './resolvers/rule-resolver.js';

const promptGenerator = new PromptGenerator();
const ruleResolver = new RuleResolver('config/rules.config.json');

const mockTask = {
  id: 'MANUAL-TEST',
  title: 'Overall Analytics - Manual Test',
  description: 'Testing prompt generation',
};

const analyticsType = ruleResolver.resolve(mockTask.title);
const ruleFilePath = ruleResolver.getRuleFilePath(analyticsType);
const ruleContent = promptGenerator.readRuleFile(ruleFilePath);
const prompt = promptGenerator.generateSinglePrompt(mockTask, analyticsType, ruleContent);

console.log(prompt);
```

### 3. Test with Real Jira Task
```bash
# Set valid Jira credentials in .env
npm run dev run -- --tasks PA-12345
```
This will run the full workflow with a real task.

---

## Test Coverage

### What's Covered ✅
- Service initialization
- Configuration loading
- Rule resolution logic (10 test cases)
- Folder mapping (5 analytics types)
- Prompt generation (structure validation)
- Test case parsing (JSON validation)

### What's NOT Covered ❌
- BrowserStack API calls (requires credentials + creates real data)
- Jira API calls (requires credentials + test data availability)
- Full orchestrator integration (requires all external services)
- Interactive user prompts (requires stdin interaction)
- Error retry logic (would require mocking failures)

### Why Some Things Aren't Tested
- **BrowserStack/Jira APIs**: Would create real data, pollute systems
- **Full Integration**: Too many external dependencies
- **User Interaction**: Difficult to automate stdin/stdout
- **Retry Logic**: Complex to mock failures reliably

**Trade-off**: We test the core logic extensively while avoiding external dependencies and side effects.

---

## Adding New Tests

### Add E2E Test Case

Edit `src/test-e2e.ts`:

```typescript
// Add new test in runE2ETest()
console.log(chalk.yellow('Test 7/7: Testing new feature...'));
try {
  // Your test code here

  if (testPassed) {
    console.log(chalk.green(`✅ New feature works\n`));
    testsPassed++;
  } else {
    testsFailed++;
  }
  testsRun++;
} catch (error) {
  console.log(chalk.red(`❌ New feature error: ${error.message}\n`));
  testsRun++;
  testsFailed++;
}
```

### Add Resolver Test Case

Edit `src/test-resolvers.ts`:

```typescript
const testCases = [
  // Existing test cases...
  {
    title: 'Your New Test Case Title',
    expected: AnalyticsType.Overall,
  },
];
```

---

## CI/CD Integration

For automated testing in CI/CD pipelines:

```yaml
# .github/workflows/test.yml (example)
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run check
      - run: npm test
```

**Note**: Tests run without credentials (Jira test is skipped), making them safe for CI/CD.

---

## Debugging Tests

### Verbose Output
Tests already include detailed output with:
- Test numbers (1/6, 2/6, etc.)
- Success/failure indicators (✅/❌)
- Gray text for additional details
- Summary at the end

### Debug Single Component

```bash
# Test only prompt generation
npx tsx -e "
import { PromptGenerator } from './src/services/prompt-generator.js';
const gen = new PromptGenerator();
console.log('Min:', gen.minTestCases, 'Max:', gen.maxTestCases);
"
```

### Check Configuration

```bash
# Validate config files
cat config/rules.config.json | jq .
cat config/folders.config.json | jq .
```

---

## Best Practices

1. **Run tests before committing**
   ```bash
   npm run check && npm test
   ```

2. **Update tests when changing logic**
   - Changed keyword patterns? Update `test-resolvers.ts`
   - Changed folder IDs? Update `test-e2e.ts`
   - Added new analytics type? Add test cases

3. **Keep tests fast**
   - No external API calls
   - No file system side effects (cleanup after)
   - No long-running operations

4. **Make tests deterministic**
   - Use fixed mock data
   - Don't depend on external state
   - Clean up after tests

5. **Document test failures**
   - Clear error messages
   - Show expected vs actual
   - Suggest fixes

---

## Summary

| Command | Purpose | Duration | External Deps |
|---------|---------|----------|---------------|
| `npm test` | Quick E2E test | ~2s | None (Jira skipped) |
| `npm run test:resolvers` | Test resolvers | ~1s | None |
| `npm run test:e2e` | Full E2E simulation | ~2s | None (Jira skipped) |
| `npm run test:all` | All tests | ~3s | None |

**Quick Check Before Commit:**
```bash
npm run check && npm test
```

**Comprehensive Validation:**
```bash
npm run check && npm run test:all
```

The testing strategy ensures:
- ✅ Core logic is validated
- ✅ Fast feedback (<3 seconds)
- ✅ No external dependencies required
- ✅ Safe for CI/CD pipelines
- ✅ Easy to debug and extend

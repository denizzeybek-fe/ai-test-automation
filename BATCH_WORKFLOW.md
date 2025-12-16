# Batch Processing Workflow

## Single Task (Şu Anki Durum)

```bash
npm run dev run -- --tasks PA-34858
```

**Akış:**
1. ✅ Fetch task from Jira
2. ✅ Resolve analytics type
3. ✅ Create subfolder
4. ✅ Generate prompt → `output/prompts/prompt-PA-34858-timestamp.md`
5. ✅ Create empty response file → `output/responses/response-PA-34858.json`
6. ⏸️ **USER:** Copy prompt → Claude Desktop → Paste response
7. ✅ Import test cases
8. ✅ Create test cases in BrowserStack
9. ✅ Link to test run

---

## Multiple Tasks (Gelecek - Phase 6)

### Senaryo 1: Sequential Processing (Şu Anki İmplementasyon)

```bash
npm run dev run -- --tasks PA-34858,PA-34859,PA-34860
```

**Akış:**
```
FOR EACH task:
  1. Generate prompt
  2. Create empty response file
  3. ⏸️ Wait for user
  4. Import & Create test cases
  5. Link to test run
```

**Artılar:**
- ✅ Basit implementasyon
- ✅ Her task için anında feedback

**Eksiler:**
- ❌ Her task için ayrı ayrı beklemek gerekiyor
- ❌ Yavaş (50 task = 50 defa bekle)

---

### Senaryo 2: Batch Processing (Önerilen - Phase 6)

```bash
npm run dev run -- --tasks PA-34858,PA-34859,PA-34860
```

**Akış:**

#### Phase 1: Prompt Generation (Otomatik)
```
FOR EACH task:
  1. Fetch from Jira
  2. Resolve type
  3. Generate prompt → output/prompts/prompt-{task_id}.md
  4. Create empty response → output/responses/response-{task_id}.json
```

**Output:**
```
📦 Generated prompts for 3 tasks:
  1. output/prompts/prompt-PA-34858.md → output/responses/response-PA-34858.json
  2. output/prompts/prompt-PA-34859.md → output/responses/response-PA-34859.json
  3. output/prompts/prompt-PA-34860.md → output/responses/response-PA-34860.json

⏸️  MANUAL STEP:
  - Open each prompt file
  - Copy to Claude Desktop
  - Paste JSON response to corresponding response file
  - All files are pre-created and waiting!

Press Enter when ALL responses are ready...
```

#### Phase 2: Batch Import & Create (Otomatik)
```
User presses Enter

FOR EACH task:
  1. Validate response file has content
  2. Import test cases
  3. Create subfolder
  4. Create test cases in BrowserStack
  5. Link to test run

📊 Progress: 1/3 tasks completed...
📊 Progress: 2/3 tasks completed...
📊 Progress: 3/3 tasks completed...

✅ Batch complete!
```

**Artılar:**
- ✅ Tek seferde tüm promptlar üretiliyor
- ✅ User istediği sırada Claude'a verebilir
- ✅ Hızlı (50 task = 1 defa bekle)
- ✅ Paralel çalışma imkanı (user 10 Claude tab açabilir)

**Eksiler:**
- ⚠️ Tüm response'lar hazır olana kadar devam edilemiyor

---

## Önerilen Implementasyon

### Option A: Tam Batch (Best for 10+ tasks)

```typescript
async processBatchTasks(taskIds: string[]): Promise<number> {
  // Phase 1: Generate all prompts
  for (const taskId of taskIds) {
    await generatePromptAndCreateEmptyResponse(taskId);
  }

  // Wait for user
  console.log('⏸️  Paste all responses and press Enter...');
  await waitForUserInput();

  // Phase 2: Import and create all
  for (const taskId of taskIds) {
    await importAndCreateTestCases(taskId);
  }
}
```

### Option B: Hybrid (Best for 3-10 tasks)

```typescript
async processBatchTasks(taskIds: string[], batchSize = 5): Promise<number> {
  const batches = chunk(taskIds, batchSize);

  for (const batch of batches) {
    console.log(`📦 Batch ${i}/${batches.length} (${batch.length} tasks)`);

    // Phase 1: Generate batch prompts
    for (const taskId of batch) {
      await generatePromptAndCreateEmptyResponse(taskId);
    }

    // Wait for user
    console.log(`⏸️  Paste ${batch.length} responses and press Enter...`);
    await waitForUserInput();

    // Phase 2: Import batch
    for (const taskId of batch) {
      await importAndCreateTestCases(taskId);
    }
  }
}
```

**Batch Size:**
- 1-2 tasks → Sequential (current)
- 3-10 tasks → Hybrid (batches of 5)
- 10+ tasks → Full batch (all at once)

---

## Recommendation

**Şu an için Sequential yeterli** (zaten çalışıyor)

**Phase 6'da eklenecek:**
- Hybrid batch processing
- Configurable batch size (.env: BATCH_SIZE=5)
- Progress tracking
- Better error handling (hangi task fail oldu?)

**Kullanım:**

```bash
# Sequential (current - works)
npm run dev run -- --tasks PA-34858

# Batch (Phase 6)
npm run dev run -- --tasks PA-34858,PA-34859,PA-34860
# Generates 3 prompts → Wait → Process all 3

# Large batch (Phase 6)
npm run dev run -- --tasks PA-34858,...,PA-34900  # 50 tasks
# Generates 50 prompts → Wait → Process all 50
# OR
# Batch 1 (5 tasks) → Wait → Process
# Batch 2 (5 tasks) → Wait → Process
# ...
```

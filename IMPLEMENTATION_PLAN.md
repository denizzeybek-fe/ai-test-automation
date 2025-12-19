# 📋 GÜNCELLENMİŞ PLAN: Claude CLI Otomatik Entegrasyonu

## 🎯 Temel Mantık (DEĞİŞTİ!)

**Claude CLI** kullanarak otomatik test case generation:
- User Claude CLI kurmuş ve login olmuş (tek seferlik)
- Sistem prompt'u generate edip direkt **Claude CLI**'ye gönderir (child process)
- Response otomatik işlenir ve BrowserStack'e kaydedilir
- Manuel mod fallback olarak kalır
- **Anthropic API kullanmıyoruz** (OAuth token çalışmıyor, ekstra cost)

## 🔧 ENV Değişkeni

```env
# Claude CLI Integration
# CLAUDE CLI KULLANILIR - API KEY DEĞİL!
# Setup: User claude login yapmış olmalı (tek seferlik)
# Check: which claude (CLI kurulu mu?)
```

## 🚦 Mod Seçimi

### 1. **Otomatik Mod** (Default):
**Koşul**: Claude CLI kurulu VE user login olmuş
- **CLI**: Normal çalışır, child process ile Claude'u çağırır
- **UI** (default path `/`): Prompt göstermez, direkt işler, sadece sonuç gösterir

### 2. **Manuel Mod** (Fallback):
**Koşul**: Claude CLI yok VEYA user zorluyor
- **CLI**: `--manual` flag'i ile
- **UI**: `?manual=true` query parameter ile
- Eski akış: Prompt göster → User copy-paste → Response yapıştır

---

## 📊 Workflow Karşılaştırma

### Manuel Mod (Eski):
1. User: PA-12345 girer
2. Sistem: Prompt generate eder, dosyaya kaydet
3. User: Dosyayı açar, promptu kopyalar
4. User: Claude Desktop'a yapıştırır
5. Claude: Response verir
6. User: Response'u kopyalar, dosyaya yapıştırır
7. User: CLI'da Enter'a basar
8. Sistem: Test case'leri oluşturur ✅

### Otomatik Mod (Yeni - Claude CLI):
1. User: PA-12345 girer
2. Sistem: Prompt generate eder
3. Sistem: `claude -p "prompt"` çalıştırır (child process)
4. Claude CLI: Response döner (JSON)
5. Sistem: Test case'leri oluşturur ✅
6. User: Sadece sonucu görür

**Zaman Tasarrufu**: ~2-3 dakika → ~10 saniye ⚡

---

## Phase 1: Backend Core ✅ (TAMAMLANDI)

### 1.1. ClaudeCliService ✅
```typescript
// src/services/claude-cli.service.ts
export class ClaudeCliService {
  async isAvailable(): Promise<boolean> {
    // which claude kontrolü
  }

  async generateTestCases(prompt: string): Promise<string> {
    // Child process: echo 'prompt' | claude -p "$(cat)"
    // JSON extraction (markdown code block içindeyse çıkar)
  }
}
```

### 1.2. Orchestrator Güncelleme (YAPILACAK)
```typescript
async processBatchTasks(taskIds: string[], manualMode = false) {
  const prompt = await this.generatePrompt(taskIds);

  // Check Claude CLI availability
  const cliAvailable = await claudeCliService.isAvailable();

  if (manualMode || !cliAvailable) {
    // Manuel mod: Prompt'u dosyaya kaydet, user'a göster
    return this.manualWorkflow(prompt);
  }

  // Otomatik mod: Claude CLI'yi çağır
  const response = await claudeCliService.generateTestCases(prompt);
  return this.processResponse(response, taskIds);
}
```

### 1.3. CLI Güncelleme (YAPILACAK)
```typescript
.option('-m, --manual', 'Force manual mode (copy-paste workflow)')
.action(async (options) => {
  const cliAvailable = await claudeCliService.isAvailable();
  const manualMode = options.manual || !cliAvailable;

  if (manualMode && !options.manual) {
    console.log(chalk.yellow('⚠️  Claude CLI not found or not authenticated'));
    console.log(chalk.yellow('   Using manual mode (copy-paste workflow)'));
    console.log(chalk.gray('   Install: npm install -g @anthropics/claude-code\n'));
  } else if (!manualMode) {
    console.log(chalk.green('🤖 Automatic mode (using Claude CLI)\n'));
  }

  await orchestrator.processBatchTasks(taskIds, manualMode);
});
```

### 1.4. .env.example Güncelleme (YAPILACAK)
```env
# ===========================================
# Claude CLI Integration (Optional - Recommended!)
# ===========================================
#
# Enables automatic test case generation (no manual copy-paste)
# Uses your existing Claude subscription (no extra API cost)
#
# Setup (one-time, 2 minutes):
# 1. Install Claude CLI: npm install -g @anthropics/claude-code
# 2. Login: claude login
# 3. That's it! System will automatically use Claude CLI
#
# Check if installed: which claude
# Check if logged in: claude whoami
#
# Without Claude CLI: Manual mode still works perfectly!
#
# NO ENV VARIABLE NEEDED - System auto-detects Claude CLI
```

---

## Phase 2: Frontend Integration (YAPILACAK)

### 2.1. API Route Güncelleme
```typescript
// src/api/routes/prompts.route.ts
router.post('/generate', async (req, res) => {
  const manualMode = req.query.manual === 'true';
  const cliAvailable = await claudeCliService.isAvailable();

  const prompt = generatePrompt(taskId);

  if (manualMode || !cliAvailable) {
    return res.json({
      success: true,
      prompt,
      mode: 'manual',
      reason: manualMode ? 'User requested manual mode' : 'Claude CLI not available'
    });
  }

  // Otomatik mod: Claude CLI'yi çağır
  const response = await claudeCliService.generateTestCases(prompt);
  return res.json({
    success: true,
    prompt,
    response,
    mode: 'automatic'
  });
});
```

### 2.2. Mode Detection API
```typescript
// src/api/routes/mode.route.ts (NEW)
router.get('/mode', async (req, res) => {
  const available = await claudeCliService.isAvailable();
  const statusMessage = await claudeCliService.getStatusMessage();

  return res.json({
    available,
    mode: available ? 'automatic' : 'manual',
    message: statusMessage
  });
});
```

### 2.3. Frontend Mode Detection
```typescript
// src/composables/useTaskGeneration.ts
const mode = ref<'automatic' | 'manual'>('manual');

const detectMode = async () => {
  const params = new URLSearchParams(window.location.search);
  const forcedManual = params.get('manual') === 'true';

  if (forcedManual) {
    mode.value = 'manual';
    return;
  }

  // Backend'den mod bilgisini al
  const response = await fetch(`${API_URL}/api/mode`);
  const { available } = await response.json();
  mode.value = available ? 'automatic' : 'manual';
};

onMounted(() => detectMode());
```

### 2.4. UI Component: ModeBadge.vue
```vue
<!-- src/components/ds/ModeBadge.vue -->
<template>
  <div :class="badgeClass">
    <component :is="icon" class="w-4 h-4" />
    <span>{{ modeText }}</span>
    <a :href="toggleUrl" class="ml-2 underline text-sm">
      Switch to {{ mode === 'automatic' ? 'Manual' : 'Automatic' }}
    </a>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{ mode: 'automatic' | 'manual' }>();

const badgeClass = computed(() =>
  props.mode === 'automatic'
    ? 'flex items-center gap-2 px-3 py-2 bg-green-100 text-green-800 rounded-lg'
    : 'flex items-center gap-2 px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg'
);

const icon = computed(() =>
  props.mode === 'automatic' ? 'RobotIcon' : 'HandIcon'
);

const modeText = computed(() =>
  props.mode === 'automatic'
    ? '🤖 Automatic Mode (Claude CLI)'
    : '✋ Manual Mode'
);

const toggleUrl = computed(() =>
  props.mode === 'automatic' ? '/?manual=true' : '/'
);
</script>
```

### 2.5. Dashboard Workflow
```vue
<!-- src/views/Dashboard.vue -->
<template>
  <div>
    <!-- Mode Badge -->
    <ModeBadge :mode="mode" />

    <!-- Automatic Mode -->
    <div v-if="mode === 'automatic' && autoResponse">
      <h3>✅ Test cases generated automatically</h3>
      <p>Review and submit:</p>
      <textarea v-model="autoResponse" readonly />
      <Button @click="handleSubmit">Create Test Cases</Button>
    </div>

    <!-- Manual Mode -->
    <div v-else>
      <!-- Existing 3-step workflow -->
    </div>
  </div>
</template>
```

---

## Phase 3: Documentation (YAPILACAK)

### 3.1. README Updates

#### Quick Start
```markdown
## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Jira account with API access
- BrowserStack account
- **Claude CLI** (Recommended for automatic mode)

### Installation

```bash
# 1. Install dependencies
cd ai-test-api && npm install
cd ../ai-test-ui && npm install

# 2. Install Claude CLI (Recommended - for automatic mode)
npm install -g @anthropics/claude-code
claude login  # One-time setup

# 3. Configure environment
cd ai-test-api
cp .env.example .env
# Edit .env with your credentials
```

### Configuration

No special configuration needed for Claude CLI!
System auto-detects if Claude CLI is installed and authenticated.

**To force manual mode:**
- CLI: `npm run dev:cli -- run --tasks PA-123 --manual`
- UI: Navigate to `http://localhost:5173/?manual=true`
```

### 3.2. Usage Guide
```markdown
## 💻 Usage Modes

### 🤖 Automatic Mode (Recommended)
**Requirements**: Claude CLI installed + logged in

**CLI:**
```bash
npm run dev:cli -- run --tasks PA-12345
# → Generates prompt
# → Calls Claude CLI automatically
# → Creates test cases
# → Done in 10 seconds!
```

**UI:**
1. Navigate to `http://localhost:5173`
2. Enter task ID
3. Click "Generate"
4. Review auto-generated response
5. Click "Submit"
6. ✅ Done!

### ✋ Manual Mode (Fallback)
**Requirements**: None (always works)

**CLI:**
```bash
npm run dev:cli -- run --tasks PA-12345 --manual
# → Generates prompt to file
# → You copy-paste to Claude Desktop
# → You paste response to file
# → Press Enter
# → Creates test cases
```

**UI:**
1. Navigate to `http://localhost:5173/?manual=true`
2. Enter task ID
3. Click "Generate"
4. Copy prompt
5. Paste to Claude Desktop
6. Copy Claude's response
7. Paste response back
8. Click "Submit"
9. ✅ Done!
```

### 3.3. Troubleshooting
```markdown
## 🐛 Troubleshooting

### "Claude CLI not found"
**Solution:**
```bash
# Install Claude CLI
npm install -g @anthropics/claude-code

# Verify installation
which claude  # Should show path

# Login
claude login
```

### "Using manual mode automatically"
**Cause**: Claude CLI not installed or not authenticated
**Solutions:**
1. Install Claude CLI (see above)
2. Or use manual mode: `--manual` flag or `?manual=true`

### "Want to use manual mode even with CLI"
**Solution:**
- CLI: Add `--manual` flag
- UI: Add `?manual=true` to URL
```

---

## 🎯 Implementation Checklist

### ✅ Phase 1A: Backend Core (TAMAMLANDI)
- [x] Create `ClaudeCliService`
- [x] Test Claude CLI integration
- [x] Verify JSON parsing works

### 🔄 Phase 1B: Backend Integration (DEVAM EDİYOR)
- [ ] Update Orchestrator to use Claude CLI
- [ ] Update CLI command with mode detection
- [ ] Update .env.example documentation
- [ ] Remove Anthropic API references
- [ ] Test CLI automatic mode
- [ ] Test CLI manual mode
- [ ] Run type-check and lint

### ⏳ Phase 2: Frontend Integration (BEKLEMEDE)
- [ ] Create `/api/mode` endpoint
- [ ] Add `?manual` query param support to `/generate`
- [ ] Create `ModeBadge` component
- [ ] Add mode detection in UI
- [ ] Handle auto-response flow
- [ ] Test UI automatic mode
- [ ] Test UI manual mode

### ⏳ Phase 3: Documentation (BEKLEMEDE)
- [ ] Update main README
- [ ] Update API README
- [ ] Update UI README
- [ ] Add troubleshooting guide
- [ ] Add setup video/screenshots

---

## 📊 Karşılaştırma

| Feature | Manuel Mod | Otomatik Mod (Claude CLI) | ~~Anthropic API~~ |
|---------|------------|---------------------------|-------------------|
| **Setup** | Yok | `claude login` (1x) | ~~API key al~~ |
| **Cost** | Yok | Yok (subscription dahil) | ~~$$ per token~~ |
| **Hız** | ~2-3 dk | ~10 sn | ~~-~~ |
| **UX** | 9 adım | 3 adım | ~~-~~ |
| **Gereksinim** | Hiç | Claude CLI | ~~API key~~ |

**Seçilen**: 🤖 **Claude CLI** (child process)

---

## 🔄 Değişiklik Özeti

### Kaldırılanlar:
- ❌ `ClaudeAPIService` (Anthropic API)
- ❌ `ANTHROPIC_API_KEY` env variable
- ❌ API key based authentication

### Eklenenler:
- ✅ `ClaudeCliService` (Claude CLI child process)
- ✅ Auto-detection of Claude CLI
- ✅ Markdown code block JSON extraction
- ✅ `--manual` flag for CLI
- ✅ `?manual=true` query param for UI

### Değiştirilmeyenler:
- ✅ Manuel mod akışı (backward compatible)
- ✅ Orchestrator temel yapısı
- ✅ Frontend 3-step workflow
- ✅ Error handling structure
- ✅ BrowserStack integration

---

## 🚀 Next Steps

1. **Orchestrator'ı güncelle** → Claude CLI kullan
2. **CLI mod tespitini ekle** → Auto-detect + `--manual` flag
3. **Type-check & lint** → Hataları düzelt
4. **Test et** → Gerçek task ile dene
5. **Frontend'e geç** → API endpoint + UI badge

**ETA**: ~2-3 saat (Backend tamamlanır)

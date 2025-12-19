<script setup>
import { computed, reactive, watch } from "vue";

const props = defineProps({
  open: { type: Boolean, default: false },
  providers: { type: Array, default: () => [] },
  promptPresets: { type: Array, default: () => [] },
  currentSettings: { type: Object, required: true },
});

const emit = defineEmits(["close", "save"]);

const draft = reactive({
  providerId: "",
  modelId: "",
  temperature: 0.7,
  topP: 0.9,
  maxOutputTokens: 1024,
  presencePenalty: 0,
  frequencyPenalty: 0,
  stream: true,
  enableWebSearch: false,
  systemPromptPresetId: "default",
  systemPrompt: "",
});

function applyFromCurrentSettings() {
  const source = props.currentSettings || {};
  const defaultProviderId = props.providers[0]?.id || "";
  const providerId = source.providerId || defaultProviderId;
  const provider = props.providers.find((p) => p.id === providerId) || props.providers[0];
  const defaultModelId = provider?.models?.[0]?.id || "";
  const modelId = source.modelId || defaultModelId;

  draft.providerId = providerId;
  draft.modelId = modelId;
  draft.temperature = Number.isFinite(source.temperature) ? source.temperature : 0.7;
  draft.topP = Number.isFinite(source.topP) ? source.topP : 0.9;
  draft.maxOutputTokens = Number.isFinite(source.maxOutputTokens) ? source.maxOutputTokens : 1024;
  draft.presencePenalty = Number.isFinite(source.presencePenalty) ? source.presencePenalty : 0;
  draft.frequencyPenalty = Number.isFinite(source.frequencyPenalty) ? source.frequencyPenalty : 0;
  draft.stream = Boolean(source.stream);
  draft.enableWebSearch = Boolean(source.enableWebSearch);
  draft.systemPromptPresetId = source.systemPromptPresetId || "default";
  draft.systemPrompt = source.systemPrompt || "";
}

const selectedProvider = computed(() => props.providers.find((p) => p.id === draft.providerId) || null);
const modelsForSelectedProvider = computed(() => selectedProvider.value?.models || []);

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    applyFromCurrentSettings();
  }
);

watch(
  () => draft.providerId,
  () => {
    const models = modelsForSelectedProvider.value;
    if (!models.some((m) => m.id === draft.modelId)) {
      draft.modelId = models[0]?.id || "";
    }
  }
);

watch(
  () => draft.systemPromptPresetId,
  (presetId) => {
    const preset = props.promptPresets.find((p) => p.id === presetId);
    if (!preset) return;
    draft.systemPrompt = preset.systemPrompt || "";
  }
);

watch(
  () => props.open,
  (open, _previous, onCleanup) => {
    if (!open) return;
    const onKeydown = (event) => {
      if (event.key !== "Escape") return;
      emit("close");
    };
    window.addEventListener("keydown", onKeydown);
    onCleanup(() => window.removeEventListener("keydown", onKeydown));
  }
);

function close() {
  emit("close");
}

function save() {
  emit("save", { ...draft });
}
</script>

<template>
  <transition name="chat-dialog-fade">
    <div v-if="open" class="modal-overlay" @click.self="close" role="dialog" aria-modal="true">
      <div class="modal">
        <header class="modal-header">
          <div class="header-left">
            <h3 class="modal-title">设置</h3>
            <p class="modal-subtitle">选择模型与参数（仅 UI 演示，后续可对接 Grok / DeepSeek API）。</p>
          </div>

          <button class="icon-button" type="button" @click="close" aria-label="关闭">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12l-4.9 4.89a1 1 0 1 0 1.41 1.42L12 13.41l4.89 4.9a1 1 0 0 0 1.42-1.41L13.41 12l4.9-4.89a1 1 0 0 0-.01-1.4Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </header>

        <div class="modal-body">
          <section class="section">
            <h4 class="section-title">提供方与模型</h4>
            <div class="grid">
              <label class="field">
                <span class="label">Provider</span>
                <select v-model="draft.providerId" class="control">
                  <option v-for="p in providers" :key="p.id" :value="p.id">{{ p.name }}</option>
                </select>
              </label>

              <label class="field">
                <span class="label">Model</span>
                <select v-model="draft.modelId" class="control">
                  <option v-for="m in modelsForSelectedProvider" :key="m.id" :value="m.id">{{ m.name }}</option>
                </select>
              </label>
            </div>
          </section>

          <section class="section">
            <h4 class="section-title">生成参数</h4>
            <div class="grid">
              <label class="field">
                <span class="label">Temperature <span class="value">{{ draft.temperature.toFixed(1) }}</span></span>
                <input v-model.number="draft.temperature" class="range" type="range" min="0" max="2" step="0.1" />
              </label>

              <label class="field">
                <span class="label">Top P <span class="value">{{ draft.topP.toFixed(2) }}</span></span>
                <input v-model.number="draft.topP" class="range" type="range" min="0" max="1" step="0.05" />
              </label>

              <label class="field">
                <span class="label">Max Output Tokens</span>
                <input v-model.number="draft.maxOutputTokens" class="control" type="number" min="128" max="8192" step="64" />
              </label>

              <label class="field">
                <span class="label">Presence Penalty <span class="value">{{ draft.presencePenalty.toFixed(1) }}</span></span>
                <input v-model.number="draft.presencePenalty" class="range" type="range" min="-2" max="2" step="0.1" />
              </label>

              <label class="field">
                <span class="label">Frequency Penalty <span class="value">{{ draft.frequencyPenalty.toFixed(1) }}</span></span>
                <input v-model.number="draft.frequencyPenalty" class="range" type="range" min="-2" max="2" step="0.1" />
              </label>

              <div class="field toggles">
                <label class="toggle">
                  <input v-model="draft.stream" type="checkbox" />
                  <span>Streaming</span>
                </label>
                <label class="toggle">
                  <input v-model="draft.enableWebSearch" type="checkbox" />
                  <span>Web Search（部分提供方）</span>
                </label>
              </div>
            </div>
          </section>

          <section class="section">
            <h4 class="section-title">预设提示词（System Prompt）</h4>
            <div class="grid">
              <label class="field">
                <span class="label">Preset</span>
                <select v-model="draft.systemPromptPresetId" class="control">
                  <option v-for="preset in promptPresets" :key="preset.id" :value="preset.id">
                    {{ preset.name }}
                  </option>
                </select>
              </label>

              <label class="field full">
                <span class="label">System Prompt</span>
                <textarea v-model="draft.systemPrompt" class="control textarea" rows="6" placeholder="写下你希望 AI 遵循的系统级规则"></textarea>
              </label>
            </div>
          </section>
        </div>

        <footer class="modal-footer">
          <button class="button button-secondary" type="button" @click="close">取消</button>
          <button class="button button-primary" type="button" @click="save">保存</button>
        </footer>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.modal-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 22px;
  background: rgba(17, 24, 39, 0.42);
  backdrop-filter: blur(8px);
  z-index: 40;
}

.modal {
  width: min(860px, 100%);
  height: min(720px, 92vh);
  border-radius: var(--chat-radius-lg, 14px);
  background: var(--chat-surface-2, #fff);
  border: 1px solid var(--chat-border, rgba(17, 24, 39, 0.12));
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal,
.modal * {
  box-sizing: border-box;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding: 16px 16px 12px;
  border-bottom: 1px solid var(--chat-border, rgba(17, 24, 39, 0.12));
}

.modal-title {
  margin: 0;
  font-size: 1.05rem;
  color: var(--chat-text, #111827);
}

.modal-subtitle {
  margin: 6px 0 0;
  color: var(--chat-muted, rgba(17, 24, 39, 0.62));
  font-size: 0.88rem;
  line-height: 1.45;
}

.icon-button {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  color: var(--chat-muted, rgba(17, 24, 39, 0.62));
  display: grid;
  place-items: center;
  transition: background-color 0.18s ease, color 0.18s ease;
}

.icon-button:hover {
  background: rgba(17, 24, 39, 0.05);
  color: var(--chat-text, #111827);
}

.modal-body {
  padding: 14px 16px 16px;
  overflow: auto;
  overflow-x: hidden;
}

.section + .section {
  margin-top: 18px;
}

.section-title {
  margin: 0 0 10px;
  font-size: 0.95rem;
  color: var(--chat-text, #111827);
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.field.full {
  grid-column: 1 / -1;
}

.label {
  font-size: 0.82rem;
  color: rgba(17, 24, 39, 0.72);
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}

.value {
  color: rgba(17, 24, 39, 0.5);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.control {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  border-radius: 12px;
  border: 1px solid rgba(17, 24, 39, 0.12);
  padding: 10px 12px;
  font-size: 0.95rem;
  outline: none;
  background: rgba(249, 250, 251, 0.9);
  color: rgba(17, 24, 39, 0.92);
}

.control:focus {
  border-color: rgba(59, 130, 246, 0.65);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.18);
}

.textarea {
  resize: vertical;
  max-width: 100%;
  min-height: 140px;
  line-height: 1.55;
}

.range {
  width: 100%;
  accent-color: var(--chat-accent, #3b82f6);
  margin: 0;
}

.toggles {
  grid-column: 1 / -1;
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px dashed rgba(17, 24, 39, 0.18);
  background: rgba(249, 250, 251, 0.75);
}

.toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  color: rgba(17, 24, 39, 0.82);
  font-size: 0.92rem;
  user-select: none;
  min-width: 220px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 16px 14px;
  border-top: 1px solid var(--chat-border, rgba(17, 24, 39, 0.12));
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
}

.button {
  border: 1px solid transparent;
  border-radius: 999px;
  padding: 10px 14px;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.06s ease;
}

.button:active {
  transform: translateY(1px);
}

.button-secondary {
  background: transparent;
  color: var(--chat-text, #111827);
  border-color: rgba(17, 24, 39, 0.14);
}

.button-secondary:hover {
  background: rgba(17, 24, 39, 0.04);
}

.button-primary {
  background: var(--chat-accent, #3b82f6);
  color: #fff;
}

.button-primary:hover {
  background: var(--chat-accent-strong, #2563eb);
}

.chat-dialog-fade-enter-active,
.chat-dialog-fade-leave-active {
  transition: opacity 0.18s ease;
}

.chat-dialog-fade-enter-from,
.chat-dialog-fade-leave-to {
  opacity: 0;
}

@media (max-width: 900px) {
  .modal-overlay {
    padding: 0;
    align-items: stretch;
  }

  .modal {
    width: 100%;
    height: 100%;
    border-radius: 0;
  }

  .grid {
    grid-template-columns: 1fr;
  }

  .toggles {
    flex-direction: column;
    align-items: flex-start;
  }

  .toggle {
    min-width: 0;
  }
}
</style>

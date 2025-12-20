<script setup>
import { computed, reactive, ref, watch } from "vue";
import { CHAT_DEFAULT_SETTINGS } from "@/config/chat";

const props = defineProps({
  open: { type: Boolean, default: false },
  providers: { type: Array, default: () => [] },
  promptPresets: { type: Array, default: () => [] },
  currentSettings: { type: Object, required: true },
  refreshPresets: { type: Function, default: null },
  createPreset: { type: Function, default: null },
  updatePreset: { type: Function, default: null },
  deletePreset: { type: Function, default: null },
  uploadPresetAvatar: { type: Function, default: null },
});

const emit = defineEmits(["close", "save"]);

const draft = reactive({ ...CHAT_DEFAULT_SETTINGS });
const isSavingSettings = ref(false);

function isValidPresetId(value) {
  return /^[a-zA-Z0-9_-]{1,64}$/.test(String(value || "").trim());
}

const presetEditor = reactive({
  open: false,
  mode: "create", // create | edit
  originalId: "",
  id: "",
  name: "",
  systemPrompt: "",
  avatarUrl: "",
  avatarFile: null,
  avatarObjectUrl: "",
  saving: false,
});

function resetPresetEditor() {
  presetEditor.open = false;
  presetEditor.mode = "create";
  presetEditor.originalId = "";
  presetEditor.id = "";
  presetEditor.name = "";
  presetEditor.systemPrompt = "";
  presetEditor.avatarUrl = "";
  presetEditor.avatarFile = null;
  if (presetEditor.avatarObjectUrl) URL.revokeObjectURL(presetEditor.avatarObjectUrl);
  presetEditor.avatarObjectUrl = "";
  presetEditor.saving = false;
}

function beginCreatePreset() {
  resetPresetEditor();
  presetEditor.open = true;
  presetEditor.mode = "create";
}

function beginEditPreset(preset) {
  if (!preset) return;
  resetPresetEditor();
  presetEditor.open = true;
  presetEditor.mode = "edit";
  presetEditor.originalId = String(preset.id || "");
  presetEditor.id = String(preset.id || "");
  presetEditor.name = String(preset.name || "");
  presetEditor.systemPrompt = String(preset.systemPrompt || "");
  presetEditor.avatarUrl = String(preset.avatarUrl || "");
}

function onAvatarFileChange(event) {
  const file = event?.target?.files?.[0] || null;
  presetEditor.avatarFile = file;
  if (presetEditor.avatarObjectUrl) URL.revokeObjectURL(presetEditor.avatarObjectUrl);
  presetEditor.avatarObjectUrl = file ? URL.createObjectURL(file) : "";
}

const presetAvatarPreviewUrl = computed(() => presetEditor.avatarObjectUrl || presetEditor.avatarUrl || "");

async function savePreset() {
  if (presetEditor.saving) return;
  if (!props.createPreset || !props.updatePreset || !props.refreshPresets) return;

  const id = String(presetEditor.id || "").trim();
  const name = String(presetEditor.name || "").trim();
  const systemPrompt = String(presetEditor.systemPrompt || "");

  if (!isValidPresetId(id)) {
    window.alert("预设ID仅支持字母/数字/下划线/短横线，长度 1-64");
    return;
  }
  if (!name) {
    window.alert("预设名称不能为空");
    return;
  }

  presetEditor.saving = true;

  try {
    let savedPreset;
    if (presetEditor.mode === "create") {
      savedPreset = await props.createPreset({ id, name, systemPrompt });
      if (savedPreset?.id) {
        draft.systemPromptPresetId = savedPreset.id;
        draft.systemPrompt = savedPreset.systemPrompt || "";
      }
    } else {
      const originalId = String(presetEditor.originalId || "").trim();
      if (!originalId) throw new Error("缺少原始预设ID");
      savedPreset = await props.updatePreset(originalId, { id, name, systemPrompt });

      if (draft.systemPromptPresetId === originalId && savedPreset?.id) {
        draft.systemPromptPresetId = savedPreset.id;
      }
      if (draft.systemPromptPresetId === savedPreset?.id) {
        draft.systemPrompt = savedPreset.systemPrompt || "";
      }
    }

    if (savedPreset?.id && presetEditor.avatarFile && props.uploadPresetAvatar) {
      const avatarPresetId = String(savedPreset.id || "").trim();
      await props.uploadPresetAvatar(avatarPresetId, presetEditor.avatarFile);
    }

    await props.refreshPresets();
    resetPresetEditor();
  } catch (error) {
    window.alert(error?.message || "保存预设失败");
  } finally {
    presetEditor.saving = false;
  }
}

async function removePreset(preset) {
  if (!preset?.id || !props.deletePreset || !props.refreshPresets) return;
  const confirmed = window.confirm(`确定要删除预设 “${preset.name || preset.id}” 吗？`);
  if (!confirmed) return;

  try {
    await props.deletePreset(String(preset.id));
    const nextPresets = await props.refreshPresets();

    if (draft.systemPromptPresetId === preset.id) {
      const fallback = nextPresets?.find?.((p) => p.id) || null;
      draft.systemPromptPresetId = fallback?.id || CHAT_DEFAULT_SETTINGS.systemPromptPresetId;
      draft.systemPrompt = fallback?.systemPrompt || CHAT_DEFAULT_SETTINGS.systemPrompt;
    }
  } catch (error) {
    window.alert(error?.message || "删除预设失败");
  }
}

function applyFromCurrentSettings() {
  const source = props.currentSettings || {};
  const defaultProviderId = props.providers[0]?.id || "";
  const providerId = source.providerId || defaultProviderId;
  const provider = props.providers.find((p) => p.id === providerId) || props.providers[0];
  const defaultModelId = provider?.models?.[0]?.id || "";
  const modelId = source.modelId || defaultModelId;

  draft.providerId = providerId;
  draft.modelId = modelId;
  draft.temperature = Number.isFinite(source.temperature) ? source.temperature : CHAT_DEFAULT_SETTINGS.temperature;
  draft.topP = Number.isFinite(source.topP) ? source.topP : CHAT_DEFAULT_SETTINGS.topP;
  draft.maxOutputTokens = Number.isFinite(source.maxOutputTokens)
    ? source.maxOutputTokens
    : CHAT_DEFAULT_SETTINGS.maxOutputTokens;
  draft.presencePenalty = Number.isFinite(source.presencePenalty)
    ? source.presencePenalty
    : CHAT_DEFAULT_SETTINGS.presencePenalty;
  draft.frequencyPenalty = Number.isFinite(source.frequencyPenalty)
    ? source.frequencyPenalty
    : CHAT_DEFAULT_SETTINGS.frequencyPenalty;
  draft.stream = typeof source.stream === "boolean" ? source.stream : CHAT_DEFAULT_SETTINGS.stream;
  draft.enableWebSearch =
    typeof source.enableWebSearch === "boolean" ? source.enableWebSearch : CHAT_DEFAULT_SETTINGS.enableWebSearch;
  draft.systemPromptPresetId = source.systemPromptPresetId || CHAT_DEFAULT_SETTINGS.systemPromptPresetId;
  draft.systemPrompt =
    typeof source.systemPrompt === "string" ? source.systemPrompt : CHAT_DEFAULT_SETTINGS.systemPrompt;
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
  () => props.promptPresets,
  (presets) => {
    if (!props.open) return;
    const preset = (presets || []).find((p) => p.id === draft.systemPromptPresetId);
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
  resetPresetEditor();
  emit("close");
}

async function save() {
  if (isSavingSettings.value) return;
  isSavingSettings.value = true;

  try {
    const preset = props.promptPresets.find((p) => p.id === draft.systemPromptPresetId) || null;
    const presetSystemPrompt = String(preset?.systemPrompt || "");

    if (preset && typeof props.updatePreset === "function" && String(draft.systemPrompt || "") !== presetSystemPrompt) {
      await props.updatePreset(preset.id, { systemPrompt: String(draft.systemPrompt || "") });
      await props.refreshPresets?.();
    }

    emit("save", { ...draft });
  } catch (error) {
    window.alert(error?.message || "保存失败");
  } finally {
    isSavingSettings.value = false;
  }
}
</script>

<template>
  <transition name="chat-dialog-fade">
    <div v-if="open" class="modal-overlay" @click.self="close" role="dialog" aria-modal="true">
      <div class="modal">
        <header class="modal-header">
          <div class="header-left">
            <h3 class="modal-title">设置</h3>
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
                <span class="label"
                  >Temperature <span class="value">{{ draft.temperature.toFixed(1) }}</span></span
                >
                <input v-model.number="draft.temperature" class="range" type="range" min="0" max="2" step="0.1" />
              </label>

              <label class="field">
                <span class="label"
                  >Top P <span class="value">{{ draft.topP.toFixed(2) }}</span></span
                >
                <input v-model.number="draft.topP" class="range" type="range" min="0" max="1" step="0.05" />
              </label>

              <label class="field">
                <span class="label">Max Output Tokens</span>
                <input
                  v-model.number="draft.maxOutputTokens"
                  class="control"
                  type="number"
                  min="128"
                  max="8192"
                  step="64"
                />
              </label>

              <label class="field">
                <span class="label"
                  >Presence Penalty <span class="value">{{ draft.presencePenalty.toFixed(1) }}</span></span
                >
                <input v-model.number="draft.presencePenalty" class="range" type="range" min="-2" max="2" step="0.1" />
              </label>

              <label class="field">
                <span class="label"
                  >Frequency Penalty <span class="value">{{ draft.frequencyPenalty.toFixed(1) }}</span></span
                >
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
                <textarea
                  v-model="draft.systemPrompt"
                  class="control textarea"
                  rows="6"
                  placeholder="写下你希望 AI 遵循的系统级规则"
                ></textarea>
              </label>
            </div>
          </section>

          <section class="section">
            <div class="section-header">
              <h4 class="section-title">预设管理</h4>
              <div class="section-actions">
                <button class="mini-button" type="button" :disabled="!props.refreshPresets" @click="props.refreshPresets?.()">
                  刷新
                </button>
                <button class="mini-button primary" type="button" @click="beginCreatePreset">新建预设</button>
              </div>
            </div>

            <div class="preset-list">
              <div v-if="promptPresets.length === 0" class="preset-empty">暂无预设</div>

              <div v-else class="preset-items">
                <div v-for="preset in promptPresets" :key="preset.id" class="preset-item">
                  <div class="preset-avatar" aria-hidden="true">
                    <img v-if="preset.avatarUrl" :src="preset.avatarUrl" class="preset-avatar-image" alt="" />
                    <div v-else class="preset-avatar-fallback">AI</div>
                  </div>

                  <div class="preset-main">
                    <div class="preset-name">{{ preset.name }}</div>
                    <div class="preset-meta">ID: {{ preset.id }}</div>
                  </div>

                  <div class="preset-actions">
                    <button class="mini-button" type="button" @click="beginEditPreset(preset)">编辑</button>
                    <button class="mini-button danger" type="button" @click="removePreset(preset)">删除</button>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="presetEditor.open" class="preset-editor">
              <h5 class="preset-editor-title">{{ presetEditor.mode === "create" ? "新建预设" : "编辑预设" }}</h5>

              <div class="grid">
                <label class="field">
                  <span class="label">ID</span>
                  <input v-model="presetEditor.id" class="control" placeholder="例如: default" />
                </label>

                <label class="field">
                  <span class="label">Name</span>
                  <input v-model="presetEditor.name" class="control" placeholder="例如: Assistant" />
                </label>

                <label class="field full">
                  <span class="label">System Prompt</span>
                  <textarea
                    v-model="presetEditor.systemPrompt"
                    class="control textarea"
                    rows="6"
                    placeholder="写下该预设的系统提示词"
                  ></textarea>
                </label>

                <label class="field full">
                  <span class="label">Avatar</span>
                  <div class="avatar-uploader">
                    <div class="avatar-preview" aria-hidden="true">
                      <img v-if="presetAvatarPreviewUrl" :src="presetAvatarPreviewUrl" class="avatar-image" alt="" />
                      <div v-else class="avatar-preview-fallback">AI</div>
                    </div>

                    <div class="avatar-controls">
                      <input class="file-input" type="file" accept="image/*" @change="onAvatarFileChange" />
                      <div class="preset-editor-actions">
                        <button class="mini-button" type="button" :disabled="presetEditor.saving" @click="resetPresetEditor">
                          取消
                        </button>
                        <button
                          class="mini-button primary"
                          type="button"
                          :disabled="presetEditor.saving"
                          @click="savePreset"
                        >
                          {{ presetEditor.saving ? "保存中..." : "保存预设" }}
                        </button>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </section>
        </div>

        <footer class="modal-footer">
          <button class="button button-secondary" type="button" @click="close">取消</button>
          <button class="button button-primary" type="button" :disabled="isSavingSettings" @click="save">
            {{ isSavingSettings ? "保存中..." : "保存" }}
          </button>
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
  border-color: rgba(16, 163, 127, 0.65);
  box-shadow: 0 0 0 3px rgba(16, 163, 127, 0.18);
}

.textarea {
  font-family: "Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", Arial, "Segoe UI", system-ui, sans-serif;
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

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.section-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.mini-button {
  border: 1px solid rgba(17, 24, 39, 0.16);
  background: rgba(249, 250, 251, 0.9);
  color: rgba(17, 24, 39, 0.82);
  border-radius: 999px;
  padding: 8px 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.18s ease, border-color 0.18s ease, opacity 0.18s ease;
}

.mini-button:hover:not(:disabled) {
  background: rgba(17, 24, 39, 0.05);
}

.mini-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mini-button.primary {
  border-color: rgba(16, 163, 127, 0.35);
  background: rgba(16, 163, 127, 0.1);
  color: rgba(16, 163, 127, 0.95);
}

.mini-button.danger {
  border-color: rgba(239, 68, 68, 0.35);
  background: rgba(239, 68, 68, 0.1);
  color: rgba(220, 38, 38, 0.95);
}

.preset-list {
  border: 1px solid rgba(17, 24, 39, 0.12);
  border-radius: 14px;
  background: rgba(249, 250, 251, 0.8);
  overflow: hidden;
}

.preset-empty {
  padding: 14px 12px;
  color: rgba(17, 24, 39, 0.62);
  font-size: 0.9rem;
}

.preset-items {
  display: flex;
  flex-direction: column;
}

.preset-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 12px;
  border-top: 1px solid rgba(17, 24, 39, 0.08);
}

.preset-item:first-child {
  border-top: none;
}

.preset-avatar {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.12);
  overflow: hidden;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
}

.preset-avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.preset-avatar-fallback {
  font-weight: 800;
  color: rgba(15, 23, 42, 0.8);
  font-size: 0.85rem;
}

.preset-main {
  min-width: 0;
  flex: 1;
}

.preset-name {
  font-weight: 700;
  color: rgba(17, 24, 39, 0.92);
}

.preset-meta {
  margin-top: 2px;
  font-size: 0.8rem;
  color: rgba(17, 24, 39, 0.6);
}

.preset-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}

.preset-editor {
  margin-top: 12px;
  padding: 12px 12px 14px;
  border-radius: 14px;
  border: 1px solid rgba(17, 24, 39, 0.12);
  background: rgba(255, 255, 255, 0.92);
}

.preset-editor-title {
  margin: 0 0 10px;
  font-size: 0.92rem;
  color: rgba(17, 24, 39, 0.88);
}

.avatar-uploader {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.avatar-preview {
  width: 56px;
  height: 56px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.12);
  overflow: hidden;
  display: grid;
  place-items: center;
  flex: 0 0 auto;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-preview-fallback {
  font-weight: 800;
  color: rgba(15, 23, 42, 0.8);
  font-size: 0.9rem;
}

.avatar-controls {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.file-input {
  width: 100%;
  min-width: 0;
}

.preset-editor-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
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

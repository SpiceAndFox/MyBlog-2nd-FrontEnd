<script setup>
import { computed, reactive, watch } from "vue";
import { DEFAULT_ASSISTANT_AVATAR_URL, DEFAULT_PROMPT_PRESET_ID } from "@/config/chat";

const props = defineProps({
  open: { type: Boolean, default: false },
  promptPresets: { type: Array, default: () => [] },
  currentSettings: { type: Object, required: true },
  defaultSettings: { type: Object, default: () => ({}) },
  presetLocked: { type: Boolean, default: false },
  refreshPresets: { type: Function, default: null },
  createPreset: { type: Function, default: null },
  updatePreset: { type: Function, default: null },
  deletePreset: { type: Function, default: null },
  uploadPresetAvatar: { type: Function, default: null },
});

const emit = defineEmits(["close", "save"]);

const draft = reactive({
  systemPromptPresetId: "",
  systemPrompt: "",
});

function readDefaults() {
  const value = props.defaultSettings;
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value;
}

function resolvePreset(presetId, defaultsPresetId, presets = props.promptPresets) {
  const list = Array.isArray(presets) ? presets : [];
  const normalized = String(presetId || "").trim();
  const fallback = String(defaultsPresetId || "").trim();

  return (
    list.find((preset) => preset?.id === normalized) ||
    (fallback ? list.find((preset) => preset?.id === fallback) : null) ||
    list.find((preset) => preset?.id === DEFAULT_PROMPT_PRESET_ID) ||
    list[0] ||
    null
  );
}

function applyFromCurrentSettings() {
  const source = props.currentSettings || {};
  const defaults = readDefaults();

  const resolved = resolvePreset(source.systemPromptPresetId, defaults.systemPromptPresetId);
  draft.systemPromptPresetId =
    resolved?.id ||
    String(source.systemPromptPresetId || "").trim() ||
    String(defaults.systemPromptPresetId || "").trim() ||
    DEFAULT_PROMPT_PRESET_ID;

  draft.systemPrompt =
    resolved?.systemPrompt ||
    (typeof source.systemPrompt === "string" ? source.systemPrompt : "") ||
    defaults.systemPrompt ||
    "";
}

function isValidPresetId(value) {
  return /^[a-zA-Z0-9_-]{1,64}$/.test(String(value || "").trim());
}

function isReservedPresetId(presetId) {
  const normalizedId = String(presetId || "").trim();
  if (!normalizedId) return false;
  return props.promptPresets.some((p) => p?.isBuiltin && String(p.id) === normalizedId);
}

const presetEditor = reactive({
  open: false,
  mode: "create", // create | edit
  originalId: "",
  sourcePresetId: "",
  id: "",
  name: "",
  systemPrompt: "",
  avatarUrl: "",
  avatarFile: null,
  avatarObjectUrl: "",
  saving: false,
});

const allowPresetIdEdit = false;
const showPresetIdInput = computed(() => presetEditor.mode === "create" || allowPresetIdEdit);

function resetPresetEditor() {
  presetEditor.open = false;
  presetEditor.mode = "create";
  presetEditor.originalId = "";
  presetEditor.sourcePresetId = "";
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
  const builtin = Boolean(preset?.isBuiltin);
  resetPresetEditor();
  presetEditor.open = true;
  presetEditor.mode = builtin ? "create" : "edit";
  presetEditor.originalId = builtin ? "" : String(preset.id || "");
  presetEditor.sourcePresetId = builtin ? String(preset.id || "") : "";
  presetEditor.id = builtin ? `${String(preset.id || "preset")}_custom` : String(preset.id || "");
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
  if (!props.createPreset || !props.refreshPresets) return;
  if (presetEditor.mode === "edit" && !props.updatePreset) return;

  const id = String(presetEditor.id || "").trim();
  const name = String(presetEditor.name || "").trim();
  const systemPrompt = String(presetEditor.systemPrompt || "");

  if (!isValidPresetId(id)) {
    window.alert("预设ID仅支持字母数字/下划线/短横线，长度 1-64");
    return;
  }
  if (isReservedPresetId(id)) {
    window.alert("该预设ID为内置预设保留ID，请换一个ID（例如：my_assistant）");
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
      if (savedPreset?.id && !props.presetLocked) {
        draft.systemPromptPresetId = savedPreset.id;
        draft.systemPrompt = savedPreset.systemPrompt || "";
      }
    } else {
      const originalId = String(presetEditor.originalId || "").trim();
      if (!originalId) throw new Error("缺少原始预设ID");
      savedPreset = await props.updatePreset(originalId, { id, name, systemPrompt });

      if (!props.presetLocked && draft.systemPromptPresetId === originalId && savedPreset?.id) {
        draft.systemPromptPresetId = savedPreset.id;
      }
      if (!props.presetLocked && draft.systemPromptPresetId === savedPreset?.id) {
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
  if (preset?.isBuiltin) return;
  const confirmed = window.confirm(`确定要删除预设“${preset.name || preset.id}”吗？`);
  if (!confirmed) return;

  try {
    await props.deletePreset(String(preset.id));
    const nextPresets = await props.refreshPresets();

    if (!props.presetLocked && draft.systemPromptPresetId === preset.id) {
      const defaults = readDefaults();
      const fallbackPreset = (nextPresets || []).find((p) => p?.id) || null;
      const resolved = resolvePreset(fallbackPreset?.id, defaults.systemPromptPresetId, nextPresets);
      draft.systemPromptPresetId = resolved?.id || String(defaults.systemPromptPresetId || "").trim() || "";
      draft.systemPrompt = resolved?.systemPrompt || defaults.systemPrompt || "";
    }
  } catch (error) {
    window.alert(error?.message || "删除预设失败");
  }
}

function close() {
  resetPresetEditor();
  emit("close");
}

function save() {
  emit("save", {
    systemPromptPresetId: draft.systemPromptPresetId,
    systemPrompt: draft.systemPrompt,
  });
}

watch(
  () => props.open,
  (open) => {
    if (!open) {
      resetPresetEditor();
      return;
    }
    applyFromCurrentSettings();
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
      close();
    };
    window.addEventListener("keydown", onKeydown);
    onCleanup(() => window.removeEventListener("keydown", onKeydown));
  }
);
</script>

<template>
  <transition name="chat-dialog-fade">
    <div v-if="open" class="modal-overlay" role="dialog" aria-modal="true">
      <div class="modal">
        <header class="modal-header">
          <div class="header-left">
            <h3 class="modal-title">预设</h3>
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
            <h4 class="section-title">预设提示词（System Prompt）</h4>
            <div class="grid">
              <label class="field">
                <span class="label">Preset</span>
                <select v-model="draft.systemPromptPresetId" class="control" :disabled="presetLocked">
                  <option v-for="preset in promptPresets" :key="preset.id" :value="preset.id">
                    {{ preset.name }}
                  </option>
                </select>
                <span v-if="presetLocked" class="preset-lock-hint">当前会话已开始，不能更改预设。</span>
              </label>

              <label class="field full">
                <span class="label">System Prompt</span>
                <div class="prompt-preview" aria-label="System Prompt">{{ draft.systemPrompt }}</div>
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
                    <img v-else :src="DEFAULT_ASSISTANT_AVATAR_URL" class="preset-avatar-image" alt="" />
                  </div>

                  <div class="preset-main">
                    <div class="preset-name">{{ preset.name }}</div>
                    <div class="preset-meta">
                      ID: {{ preset.id }} <span v-if="preset.isBuiltin" class="preset-badge">内置</span>
                    </div>
                  </div>

                  <div class="preset-actions">
                    <button v-if="preset.isBuiltin" class="mini-button" type="button" @click="beginEditPreset(preset)">
                      基于此创建
                    </button>
                    <template v-else>
                      <button class="mini-button" type="button" @click="beginEditPreset(preset)">编辑</button>
                      <button class="mini-button danger" type="button" @click="removePreset(preset)">删除</button>
                    </template>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="presetEditor.open" class="preset-editor">
              <h5 class="preset-editor-title">{{ presetEditor.mode === "create" ? "新建预设" : "编辑预设" }}</h5>
              <p v-if="presetEditor.sourcePresetId" class="preset-editor-hint">
                基于内置预设 “{{ presetEditor.sourcePresetId }}” 创建副本
              </p>

              <div class="grid">
                <label class="field">
                  <span class="label">ID</span>
                  <input v-if="showPresetIdInput" v-model="presetEditor.id" class="control" placeholder="例如: my_assistant" />
                  <div v-else class="control preset-id-label">{{ presetEditor.id }}</div>
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
                        <button class="mini-button primary" type="button" :disabled="presetEditor.saving" @click="savePreset">
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
          <button class="button button-primary" type="button" @click="save">应用</button>
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
  width: min(980px, 100%);
  max-height: min(86vh, 860px);
  background: rgba(255, 255, 255, 0.96);
  border-radius: var(--chat-radius-lg, 14px);
  border: 1px solid rgba(17, 24, 39, 0.12);
  box-shadow: 0 24px 68px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  gap: 12px;
  border-bottom: 1px solid rgba(17, 24, 39, 0.12);
}

.modal-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 800;
  color: var(--chat-text, #111827);
}

.icon-button {
  width: 34px;
  height: 34px;
  border-radius: 12px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  color: rgba(17, 24, 39, 0.62);
  display: grid;
  place-items: center;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.icon-button:hover {
  background: rgba(17, 24, 39, 0.05);
  color: rgba(17, 24, 39, 0.9);
}

.modal-body {
  padding: 14px 16px 18px;
  overflow: auto;
}

.section + .section {
  margin-top: 18px;
}

.section-title {
  margin: 0 0 12px;
  font-size: 0.95rem;
  font-weight: 800;
  color: rgba(17, 24, 39, 0.9);
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field.full {
  grid-column: 1 / -1;
}

.label {
  font-size: 0.82rem;
  font-weight: 700;
  color: rgba(17, 24, 39, 0.72);
}

.control {
  width: 100%;
  border-radius: 12px;
  border: 1px solid rgba(17, 24, 39, 0.12);
  background: rgba(255, 255, 255, 0.92);
  padding: 10px 12px;
  font-size: 0.92rem;
  color: var(--chat-text, #111827);
  outline: none;
  box-sizing: border-box;
}

.control:focus {
  border-color: rgba(16, 163, 127, 0.45);
  box-shadow: 0 0 0 3px rgba(16, 163, 127, 0.18);
}

.textarea {
  resize: vertical;
  line-height: 1.5;
}

.preset-id-label {
  display: flex;
  align-items: center;
  min-height: 42px;
  background: rgba(15, 23, 42, 0.04);
}

.preset-lock-hint {
  font-size: 0.8rem;
  color: rgba(239, 68, 68, 0.82);
  margin-top: 2px;
}

.prompt-preview {
  border-radius: 12px;
  border: 1px solid rgba(17, 24, 39, 0.12);
  background: rgba(249, 250, 251, 0.88);
  padding: 12px 12px;
  font-size: 0.9rem;
  color: rgba(17, 24, 39, 0.88);
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  min-height: 90px;
}

.modal-footer {
  padding: 14px 16px;
  border-top: 1px solid rgba(17, 24, 39, 0.12);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
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

.preset-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  margin-left: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  border: 1px solid rgba(59, 130, 246, 0.28);
  background: rgba(59, 130, 246, 0.1);
  color: rgba(37, 99, 235, 0.95);
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

.preset-editor-hint {
  margin: -4px 0 10px;
  color: rgba(17, 24, 39, 0.62);
  font-size: 0.85rem;
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
    max-height: none;
  }

  .grid {
    grid-template-columns: 1fr;
  }
}
</style>

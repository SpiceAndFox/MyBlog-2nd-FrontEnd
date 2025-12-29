<script setup>
import { computed, watch } from "vue";

const props = defineProps({
  open: { type: Boolean, default: false },
  sessions: { type: Array, default: () => [] },
  presets: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits([
  "close",
  "refresh",
  "restore-session",
  "delete-session-permanent",
  "restore-preset",
  "delete-preset-permanent",
]);

const isEmpty = computed(() => !props.sessions.length && !props.presets.length);

function formatDate(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleString();
}

function requestPermanentDeleteSession(session) {
  if (!session?.id) return;
  const title = session?.title ? `“${session.title}”` : "该会话";
  const confirmed = window.confirm(`确定要彻底删除${title}吗？此操作不可恢复。`);
  if (!confirmed) return;
  emit("delete-session-permanent", session.id);
}

function requestPermanentDeletePreset(preset) {
  if (!preset?.id) return;
  const title = preset?.name ? `“${preset.name}”` : `“${preset.id}”`;
  const confirmed = window.confirm(`确定要彻底删除预设${title}吗？这将同时删除该预设下的所有会话与消息，且不可恢复。`);
  if (!confirmed) return;
  emit("delete-preset-permanent", preset.id);
}

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
</script>

<template>
  <transition name="chat-dialog-fade">
    <div v-if="open" class="modal-overlay" role="dialog" aria-modal="true" @click.self="emit('close')">
      <div class="modal">
        <header class="modal-header">
          <div class="header-left">
            <h3 class="modal-title">回收站</h3>
          </div>

          <div class="header-actions">
            <button class="text-button" type="button" :disabled="loading" @click="emit('refresh')">刷新</button>
            <button class="icon-button" type="button" @click="emit('close')" aria-label="关闭">
              <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                <path
                  d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12l-4.9 4.89a1 1 0 1 0 1.41 1.42L12 13.41l4.89 4.9a1 1 0 0 0 1.42-1.41L13.41 12l4.9-4.89a1 1 0 0 0-.01-1.4Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </header>

        <div class="modal-body">
          <p v-if="loading" class="hint">加载中...</p>
          <p v-else-if="isEmpty" class="hint">回收站为空</p>

          <div v-else class="list">
            <div v-if="sessions.length" class="section-label">会话</div>
            <div v-for="session in sessions" :key="`session:${session.id}`" class="item">
              <div class="item-main">
                <div class="item-title">{{ session.title }}</div>
                <div class="item-meta">删除时间：{{ formatDate(session.deletedAt) }}</div>
              </div>

              <div class="item-actions">
                <button
                  class="button button-secondary"
                  type="button"
                  :disabled="loading"
                  @click="emit('restore-session', session.id)"
                >
                  恢复
                </button>
                <button
                  class="button button-danger"
                  type="button"
                  :disabled="loading"
                  @click="requestPermanentDeleteSession(session)"
                >
                  彻底删除
                </button>
              </div>
            </div>

            <div v-if="presets.length" class="section-label">预设</div>
            <div v-for="preset in presets" :key="`preset:${preset.id}`" class="item">
              <div class="item-main">
                <div class="item-title">{{ preset.name || preset.id }}</div>
                <div class="item-meta">删除时间：{{ formatDate(preset.deletedAt) }}</div>
              </div>

              <div class="item-actions">
                <button
                  class="button button-secondary"
                  type="button"
                  :disabled="loading"
                  @click="emit('restore-preset', preset.id)"
                >
                  恢复
                </button>
                <button
                  class="button button-danger"
                  type="button"
                  :disabled="loading"
                  @click="requestPermanentDeletePreset(preset)"
                >
                  彻底删除
                </button>
              </div>
            </div>
          </div>
        </div>
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
  padding: 18px;
  background: rgba(17, 24, 39, 0.42);
  backdrop-filter: blur(6px);
  z-index: 30;
}

.modal {
  width: min(760px, 100%);
  max-height: min(80vh, 720px);
  border-radius: var(--chat-radius-lg, 14px);
  background: var(--chat-surface-2, #fff);
  border: 1px solid var(--chat-border, rgba(17, 24, 39, 0.12));
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--chat-border, rgba(17, 24, 39, 0.12));
}

.modal-title {
  margin: 0;
  font-size: 1rem;
  color: var(--chat-text, #111827);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.text-button {
  border: 1px solid var(--chat-border, rgba(17, 24, 39, 0.12));
  background: transparent;
  border-radius: 999px;
  padding: 8px 12px;
  cursor: pointer;
  color: var(--chat-text, #111827);
  font-weight: 600;
}

.text-button:hover {
  background: rgba(17, 24, 39, 0.04);
}

.text-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.icon-button {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  color: var(--chat-muted, rgba(17, 24, 39, 0.62));
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.icon-button:hover {
  background: rgba(17, 24, 39, 0.05);
  color: var(--chat-text, #111827);
}

.modal-body {
  padding: 12px 16px 16px;
  overflow: auto;
}

.hint {
  margin: 0;
  color: var(--chat-muted, rgba(17, 24, 39, 0.62));
}

.section-label {
  margin-top: 10px;
  font-size: 0.85rem;
  font-weight: 800;
  color: rgba(17, 24, 39, 0.68);
}

.section-label:first-child {
  margin-top: 0;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--chat-border, rgba(17, 24, 39, 0.12));
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.92);
}

.item-main {
  min-width: 0;
  flex: 1;
}

.item-title {
  font-weight: 700;
  color: var(--chat-text, #111827);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-meta {
  margin-top: 2px;
  font-size: 0.85rem;
  color: var(--chat-muted, rgba(17, 24, 39, 0.62));
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}

.button {
  border: 1px solid transparent;
  border-radius: 999px;
  padding: 9px 12px;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.06s ease;
}

.button:active {
  transform: translateY(1px);
}

.button:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.button-secondary {
  background: transparent;
  color: var(--chat-text, #111827);
  border-color: var(--chat-border, rgba(17, 24, 39, 0.12));
}

.button-secondary:hover {
  background: rgba(17, 24, 39, 0.04);
}

.button-danger {
  background: rgba(239, 68, 68, 0.95);
  color: #fff;
}

.button-danger:hover {
  background: rgba(220, 38, 38, 0.95);
}

.chat-dialog-fade-enter-active,
.chat-dialog-fade-leave-active {
  transition: opacity 0.18s ease;
}

.chat-dialog-fade-enter-from,
.chat-dialog-fade-leave-to {
  opacity: 0;
}
</style>


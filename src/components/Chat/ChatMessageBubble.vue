<script setup>
import { computed, nextTick, ref, watch } from "vue";

const props = defineProps({
  message: { type: Object, required: true },
  isEditing: { type: Boolean, default: false },
  editDraft: { type: String, default: "" },
  processing: { type: Boolean, default: false },
  actionsDisabled: { type: Boolean, default: false },
});

const emit = defineEmits(["request-edit", "cancel-edit", "commit-edit", "update:editDraft"]);

const isUser = computed(() => props.message?.role === "user");

const avatarText = computed(() => (isUser.value ? "你" : "AI"));

const timeLabel = computed(() => {
  const value = props.message?.createdAt;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
});

const editInputRef = ref(null);

watch(
  () => props.isEditing,
  async (editing) => {
    if (!editing) return;
    await nextTick();
    editInputRef.value?.focus?.();
    editInputRef.value?.select?.();
  }
);

const canStartEditing = computed(() => isUser.value && !props.isEditing && !props.processing && !props.actionsDisabled);
const canCancelEditing = computed(() => props.isEditing && !props.processing);
const canCommitEditing = computed(
  () => props.isEditing && !props.processing && String(props.editDraft || "").trim().length > 0
);

function requestEdit() {
  if (!canStartEditing.value) return;
  emit("request-edit", props.message);
}

function cancelEdit() {
  if (!canCancelEditing.value) return;
  emit("cancel-edit", String(props.message?.id ?? ""));
}

function commitEdit() {
  if (!canCommitEditing.value) return;
  emit("commit-edit", String(props.message?.id ?? ""));
}

function onEditKeydown(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    commitEdit();
    return;
  }

  if (event.key === "Escape") {
    event.preventDefault();
    cancelEdit();
  }
}
</script>

<template>
  <div class="row" :class="{ user: isUser, editing: isEditing }">
    <div class="avatar" :class="{ user: isUser }" aria-hidden="true">{{ avatarText }}</div>
    <div class="bubble" :class="{ user: isUser }">
      <div class="meta">
        <span class="name">{{ isUser ? "User" : "Assistant" }}</span>
        <div class="meta-right">
          <span v-if="timeLabel" class="time">{{ timeLabel }}</span>
          <button
            v-if="canCancelEditing"
            class="edit-button cancel"
            type="button"
            @click="cancelEdit"
            aria-label="取消修改"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
              <path
                d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12l-4.9 4.89a1 1 0 1 0 1.41 1.42L12 13.41l4.89 4.9a1 1 0 0 0 1.42-1.41L13.41 12l4.9-4.89a1 1 0 0 0-.01-1.4Z"
                fill="currentColor"
              />
            </svg>
          </button>
          <button
            v-else-if="canStartEditing"
            class="edit-button"
            type="button"
            @click="requestEdit"
            aria-label="编辑这条消息"
            title="编辑"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
              <path
                d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25Zm18-11.5a1 1 0 0 0 0-1.41l-1.34-1.34a1 1 0 0 0-1.41 0l-1.13 1.13 3.75 3.75L21 5.75Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
      </div>
      <div v-if="isEditing" class="edit-shell">
        <textarea
          ref="editInputRef"
          class="edit-input"
          :value="editDraft"
          :disabled="processing"
          rows="1"
          @input="emit('update:editDraft', $event.target.value)"
          @keydown="onEditKeydown"
        ></textarea>
        <div class="edit-hint">
          <span v-if="processing">保存中…</span>
          <span v-else>Enter 保存，Shift+Enter 换行，Esc 取消</span>
        </div>
      </div>
      <div v-else class="content" @dblclick="requestEdit">{{ message.content }}</div>
    </div>
  </div>
</template>

<style scoped>
.row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.row.user {
  flex-direction: row-reverse;
}

.avatar {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 0.85rem;
  color: var(--chat-avatar-text, #ffffff);
  background: var(--chat-avatar-bg, rgba(17, 24, 39, 0.78));
  flex: 0 0 auto;
}

.avatar.user {
  background: var(--chat-avatar-user-bg, rgba(59, 130, 246, 0.95));
  color: var(--chat-avatar-user-text, #ffffff);
}

.bubble {
  max-width: min(820px, 100%);
  border-radius: 18px;
  border: 1px solid var(--chat-bubble-border, rgba(17, 24, 39, 0.1));
  background: var(--chat-bubble-bg, rgba(255, 255, 255, 0.9));
  padding: 12px 14px 12px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06), 0 10px 24px rgba(15, 23, 42, 0.06);
}

.bubble.user {
  background: linear-gradient(180deg, rgba(16, 163, 127, 0.14), rgba(16, 163, 127, 0.08));
  border-color: var(--chat-bubble-user-border, rgba(16, 163, 127, 0.24));
}

.meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 6px;
}

.meta-right {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.name {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--chat-muted, rgba(17, 24, 39, 0.75));
}

.time {
  font-size: 0.75rem;
  color: rgba(15, 23, 42, 0.45);
  white-space: nowrap;
}

.edit-button {
  border: 1px solid transparent;
  background: transparent;
  color: rgba(15, 23, 42, 0.42);
  width: 28px;
  height: 28px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  cursor: pointer;
  opacity: 0;
  transform: translateY(-1px);
  transition: opacity 0.16s ease, background-color 0.16s ease, color 0.16s ease;
}

.row:hover .edit-button {
  opacity: 1;
}

.row.editing .edit-button {
  opacity: 1;
}

.edit-button:hover {
  background: rgba(15, 23, 42, 0.06);
  color: rgba(15, 23, 42, 0.72);
}

.edit-button.cancel {
  color: rgba(239, 68, 68, 0.7);
}

.edit-button.cancel:hover {
  background: rgba(239, 68, 68, 0.12);
  color: rgba(220, 38, 38, 0.9);
}

.edit-button:focus-visible {
  opacity: 1;
  outline: 2px solid rgba(16, 163, 127, 0.7);
  outline-offset: 2px;
}

.content {
  white-space: pre-wrap;
  line-height: 1.55;
  color: var(--chat-text, rgba(17, 24, 39, 0.9));
  font-size: 0.98rem;
}

.edit-shell {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.edit-input {
  width: 100%;
  border-radius: 12px;
  border: 1px solid rgba(17, 24, 39, 0.14);
  background: rgba(255, 255, 255, 0.85);
  padding: 9px 10px;
  font-size: 0.98rem;
  line-height: 1.55;
  resize: vertical;
  outline: none;
  font-family: inherit;
  color: var(--chat-text, rgba(17, 24, 39, 0.9));
  min-height: 42px;
  box-sizing: border-box;
}

.edit-input:focus {
  border-color: rgba(16, 163, 127, 0.65);
  box-shadow: 0 0 0 3px rgba(16, 163, 127, 0.18);
}

.edit-input:disabled {
  opacity: 0.7;
}

.edit-hint {
  font-size: 0.78rem;
  color: rgba(15, 23, 42, 0.5);
}

@media (max-width: 900px) {
  .edit-button {
    opacity: 1;
  }
}
</style>

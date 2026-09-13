<script setup>
import { computed, nextTick, ref, watch } from "vue";
import { renderChatMarkdown } from "@/views/chat/markdown";
import ChatAvatar from "./ChatAvatar.vue";

const props = defineProps({
  message: { type: Object, required: true },
  userProfile: { type: Object, default: null },
  assistantProfile: { type: Object, default: null },
  isEditing: { type: Boolean, default: false },
  editDraft: { type: String, default: "" },
  processing: { type: Boolean, default: false },
  actionsDisabled: { type: Boolean, default: false },
});

const emit = defineEmits([
  "request-edit",
  "cancel-edit",
  "commit-edit",
  "update:editDraft",
]);

const isUser = computed(() => props.message?.role === "user");
const avatarUrl = computed(() =>
  (isUser.value ? props.userProfile : props.assistantProfile)?.avatarUrl || "",
);
const renderedAssistantHtml = computed(() =>
  renderChatMarkdown(props.message?.content ?? ""),
);
const displayName = computed(() => {
  if (isUser.value)
    return String(
      props.userProfile?.username || props.userProfile?.name || "User",
    );
  return String(props.assistantProfile?.name || "Assistant");
});

const timeLabel = computed(() => {
  const value = props.message?.createdAt;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
});

const editInputRef = ref(null);

function resizeEditInput() {
  const input = editInputRef.value;
  if (!input) return;
  input.style.height = "auto";
  const maxHeight = Math.max(160, Math.floor(window.innerHeight * 0.45));
  input.style.height = `${Math.min(input.scrollHeight, maxHeight)}px`;
}

watch(
  () => props.isEditing,
  async (editing) => {
    if (!editing) return;
    await nextTick();
    resizeEditInput();
    const input = editInputRef.value;
    input?.focus?.();
    const cursorPosition = String(input?.value || "").length;
    input?.setSelectionRange?.(cursorPosition, cursorPosition);
  },
);

watch(
  () => props.editDraft,
  async () => {
    if (!props.isEditing) return;
    await nextTick();
    resizeEditInput();
  },
);

const canStartEditing = computed(
  () =>
    isUser.value &&
    !props.isEditing &&
    !props.processing &&
    !props.actionsDisabled,
);
const canCancelEditing = computed(() => props.isEditing && !props.processing);
const canCommitEditing = computed(
  () =>
    props.isEditing &&
    !props.processing &&
    String(props.editDraft || "").trim().length > 0,
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

async function onEditInput(event) {
  emit("update:editDraft", event.target.value);
  await nextTick();
  resizeEditInput();
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
  <div
    class="row"
    :class="{ user: isUser, editing: isEditing }"
    :aria-label="displayName"
  >
    <ChatAvatar class="message-avatar" :src="avatarUrl" :name="displayName" />
    <div class="message-body">
      <div class="bubble" :class="{ user: isUser }">
        <div v-if="isEditing" class="edit-shell">
          <textarea
            ref="editInputRef"
            class="edit-input"
            :value="editDraft"
            :disabled="processing"
            rows="4"
            @input="onEditInput"
            @keydown="onEditKeydown"
          ></textarea>
          <div class="edit-hint">
            <span v-if="processing">保存中…</span>
            <span v-else>Enter 保存，Shift+Enter 换行，Esc 取消</span>
          </div>
        </div>
        <div v-else class="content" @dblclick="requestEdit">
          <div v-if="isUser" class="plain">{{ message.content }}</div>
          <div v-else class="markdown" v-html="renderedAssistantHtml"></div>
        </div>
      </div>
      <div class="meta">
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
    </div>
  </div>
</template>

<style scoped>
.row {
  --message-avatar-size: 32px;
  --message-gap: 12px;
  display: flex;
  align-items: flex-start;
  gap: var(--message-gap);
  min-width: 0;
}
.row.user {
  flex-direction: row-reverse;
}
.message-avatar {
  width: var(--message-avatar-size);
  height: var(--message-avatar-size);
  margin-top: 3px;
}
.user .message-avatar {
  --chat-avatar-bg: var(--chat-avatar-user-bg);
  --chat-avatar-text: var(--chat-avatar-user-text);
}
.message-body {
  position: relative;
  min-width: 0;
  max-width: calc(100% - var(--message-avatar-size) - var(--message-gap));
}
.bubble {
  box-sizing: border-box;
  min-width: 0;
  max-width: 100%;
  padding: 4px 0;
  background: var(--chat-bubble-bg);
}
.bubble.user {
  padding: 10px 15px;
  border-radius: 16px 16px 5px 16px;
  background: var(--chat-bubble-user-bg);
}
.row.editing .message-body,
.row.editing .bubble {
  width: 100%;
}
.meta {
  position: absolute;
  left: 0;
  top: 100%;
  display: flex;
  align-items: center;
  min-height: 28px;
  opacity: 0;
  pointer-events: none;
}
.row.user .meta {
  left: auto;
  right: 0;
}
.meta-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.row:hover .meta,
.row:focus-within .meta,
.row.editing .meta {
  opacity: 1;
  pointer-events: auto;
}
.time {
  font-size: 11px;
  color: var(--chat-muted);
  white-space: nowrap;
}
.edit-button {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--chat-muted);
  cursor: pointer;
}
.edit-button:hover {
  background: var(--chat-sidebar-hover);
  color: var(--chat-text);
}
.edit-button.cancel {
  color: #ae4949;
}
.edit-button:focus-visible {
  outline: 2px solid var(--chat-accent);
  outline-offset: 2px;
}
.content {
  overflow-wrap: anywhere;
  word-break: break-word;
  line-height: 1.9;
  color: var(--chat-text, rgba(17, 24, 39, 0.9));
  font-size: 15px;
}

.plain {
  white-space: pre-wrap;
}

.markdown {
  white-space: normal;
}

.markdown :deep(p) {
  margin: 0.55em 0;
}

.markdown :deep(p:first-child) {
  margin-top: 0;
}

.markdown :deep(p:last-child) {
  margin-bottom: 0;
}

.markdown :deep(pre) {
  margin: 0.65em 0;
  padding: 12px 14px;
  background: rgba(15, 23, 42, 0.06);
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 12px;
  overflow: auto;
}

.markdown :deep(pre code) {
  display: block;
  padding: 0;
  background: transparent;
  border: none;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
    "Courier New", monospace;
  font-size: 0.9em;
  line-height: 1.55;
  white-space: pre;
}

.markdown :deep(code) {
  padding: 0.12em 0.35em;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.06);
  border: 1px solid rgba(15, 23, 42, 0.1);
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono",
    "Courier New", monospace;
  font-size: 0.92em;
}

.markdown :deep(pre code),
.markdown :deep(pre code code) {
  border: none;
}

.markdown :deep(a) {
  color: var(--chat-accent, #10a37f);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.markdown :deep(ul),
.markdown :deep(ol) {
  margin: 0.55em 0;
  padding-left: 1.25em;
}

.markdown :deep(blockquote) {
  margin: 0.65em 0;
  padding: 0.2em 0.9em;
  border-left: 4px solid rgba(15, 23, 42, 0.18);
  color: rgba(15, 23, 42, 0.75);
  background: rgba(15, 23, 42, 0.03);
  border-radius: 10px;
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
  font-size: 15px;
  line-height: 1.55;
  resize: vertical;
  outline: none;
  font-family: inherit;
  color: var(--chat-text, rgba(17, 24, 39, 0.9));
  min-height: 118px;
  max-height: 45vh;
  overflow-y: auto;
  box-sizing: border-box;
}

.edit-input:focus {
  border-color: var(--chat-accent);
  box-shadow: 0 0 0 2px var(--chat-sidebar-active);
}

.edit-input:disabled {
  opacity: 0.7;
}

.edit-hint {
  font-size: 0.78rem;
  color: rgba(15, 23, 42, 0.5);
}

@media (max-width: 900px), (pointer: coarse) {
  .row {
    --message-avatar-size: 28px;
    --message-gap: 9px;
  }
  .message-body {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  .row.user .message-body {
    align-items: flex-end;
  }
  .meta {
    /* Reserve space even before the first assistant token arrives. */
    position: static;
    align-self: flex-end;
    margin-top: 4px;
    min-height: 24px;
    opacity: 1;
    pointer-events: auto;
  }
  .time {
    font-size: 12px;
  }
  .edit-button {
    width: 44px;
    height: 36px;
  }
  .content,
  .edit-input {
    font-size: 17px;
  }
  .content {
    min-height: 1.9em;
  }
}
</style>

<script setup>
import ChatMessageList from "@/components/Chat/ChatMessageList.vue";
import ChatComposer from "@/components/Chat/ChatComposer.vue";
import { ref } from "vue";
import { DEFAULT_SESSION_TITLE } from "@/config/chat";

defineProps({
  sessionTitle: { type: String, default: DEFAULT_SESSION_TITLE },
  messages: { type: Array, default: () => [] },
  userProfile: { type: Object, default: null },
  assistantProfile: { type: Object, default: null },
  isMobile: { type: Boolean, default: false },
  readOnly: { type: Boolean, default: false },
  isSending: { type: Boolean, default: false },
  isStreaming: { type: Boolean, default: false },
  isEditingActive: { type: Boolean, default: false },
  editingMessageId: { type: String, default: "" },
  editingDraft: { type: String, default: "" },
  editingProcessing: { type: Boolean, default: false },
});

const emit = defineEmits([
  "open-sidebar",
  "go-today",
  "send-message",
  "stop-output",
  "request-edit-message",
  "update-edit-draft",
  "commit-edit-message",
  "cancel-edit-message",
]);

const composerRef = ref(null);
function focusComposer() {
  composerRef.value?.focus?.();
}

defineExpose({ focusComposer });
</script>

<template>
  <section class="conversation" :aria-label="`对话：${sessionTitle}`">
    <button
      v-if="isMobile"
      class="sidebar-float-button"
      type="button"
      @click="emit('open-sidebar')"
      aria-label="打开会话列表"
    >
      &gt;
    </button>

    <div v-if="readOnly" class="read-only-banner" role="note" aria-label="历史会话提示">
      <div class="read-only-text">历史对话，只读</div>
      <button class="read-only-action" type="button" @click="emit('go-today')">回到今天</button>
    </div>

    <ChatMessageList
      class="message-list"
      :messages="messages"
      :userProfile="userProfile"
      :assistantProfile="assistantProfile"
      :editingMessageId="editingMessageId"
      :editingDraft="editingDraft"
      :editingProcessing="editingProcessing"
      :actionsDisabled="readOnly || isSending || isStreaming || isEditingActive || editingProcessing"
      @request-edit="emit('request-edit-message', $event)"
      @update-edit-draft="emit('update-edit-draft', $event)"
      @commit-edit="emit('commit-edit-message', $event)"
      @cancel-edit="emit('cancel-edit-message', $event)"
    />

    <ChatComposer
      ref="composerRef"
      :disabled="readOnly"
      :placeholder="readOnly ? '历史会话只读，点击“回到今天”继续对话' : '输入消息…'"
      :isSending="isSending || isEditingActive"
      :isStreaming="isStreaming"
      @send="emit('send-message', $event)"
      @stop="emit('stop-output')"
    />
  </section>
</template>

<style scoped>
.conversation {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--chat-surface, #f7f7f8);
  position: relative;
}

.sidebar-float-button {
  position: absolute;
  left: 50%;
  top: 10px;
  transform: translateX(-50%);
  z-index: 5;

  padding: 5px 20px;
  border-radius: 12px;
  cursor: pointer;
  display: grid;
  place-items: center;
  font-size: 22px;
  font-weight: 700;
  line-height: 1;
  color: var(--chat-muted, rgba(17, 24, 39, 0.62));
  transition: color 0.18s ease, background-color 0.18s ease;

  background: rgba(163, 163, 163, 0.25);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
}

.sidebar-float-button:hover {
  color: var(--chat-text, #111827);
}

.sidebar-float-button:active {
  background: rgba(15, 23, 42, 0.06);
}

.sidebar-float-button:focus-visible {
  outline: 2px solid rgba(16, 163, 127, 0.7);
  outline-offset: 2px;
}

.message-list {
  flex: 1;
  min-height: 0;
}

.read-only-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  padding: 10px 14px;
  border-bottom: 1px solid var(--chat-border, rgba(17, 24, 39, 0.12));
  background: rgba(249, 250, 251, 0.92);
  backdrop-filter: blur(10px);
  z-index: 2;
}

.read-only-text {
  color: var(--chat-muted, rgba(17, 24, 39, 0.62));
  font-weight: 650;
  font-size: 0.92rem;
}

.read-only-action {
  border: 1px solid transparent;
  border-radius: 999px;
  padding: 8px 12px;
  cursor: pointer;
  font-weight: 750;
  background: var(--chat-accent, #10a37f);
  color: #fff;
  transition: filter 0.18s ease, transform 0.06s ease;
  flex: 0 0 auto;
}

.read-only-action:hover {
  filter: brightness(1.03);
}

.read-only-action:active {
  transform: translateY(1px);
}
</style>

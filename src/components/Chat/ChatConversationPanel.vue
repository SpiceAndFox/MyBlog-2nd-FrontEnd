<script setup>
import ChatMessageList from "@/components/Chat/ChatMessageList.vue";
import ChatComposer from "@/components/Chat/ChatComposer.vue";

defineProps({
  sessionTitle: { type: String, default: "新对话" },
  messages: { type: Array, default: () => [] },
  isMobile: { type: Boolean, default: false },
  isSending: { type: Boolean, default: false },
  isStreaming: { type: Boolean, default: false },
  isEditingActive: { type: Boolean, default: false },
  editingMessageId: { type: String, default: "" },
  editingDraft: { type: String, default: "" },
  editingProcessing: { type: Boolean, default: false },
});

const emit = defineEmits([
  "open-sidebar",
  "send-message",
  "stop-output",
  "request-edit-message",
  "update-edit-draft",
  "commit-edit-message",
  "cancel-edit-message",
]);
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

    <ChatMessageList
      class="message-list"
      :messages="messages"
      :editingMessageId="editingMessageId"
      :editingDraft="editingDraft"
      :editingProcessing="editingProcessing"
      :actionsDisabled="isSending || isStreaming || isEditingActive || editingProcessing"
      @request-edit="emit('request-edit-message', $event)"
      @update-edit-draft="emit('update-edit-draft', $event)"
      @commit-edit="emit('commit-edit-message', $event)"
      @cancel-edit="emit('cancel-edit-message', $event)"
    />

    <ChatComposer
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
</style>

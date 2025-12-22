<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import ChatMessageBubble from "@/components/Chat/ChatMessageBubble.vue";

const props = defineProps({
  messages: { type: Array, default: () => [] },
  userProfile: { type: Object, default: null },
  assistantProfile: { type: Object, default: null },
  editingMessageId: { type: String, default: "" },
  editingDraft: { type: String, default: "" },
  editingProcessing: { type: Boolean, default: false },
  actionsDisabled: { type: Boolean, default: false },
});

const emit = defineEmits(["request-edit", "update-edit-draft", "commit-edit", "cancel-edit"]);

const listRef = ref(null);

const AUTO_SCROLL_THRESHOLD_PX = 80;
const shouldAutoScroll = ref(true);
let pendingScrollFrame = 0;

function isNearBottom(element) {
  const distance = element.scrollHeight - element.scrollTop - element.clientHeight;
  return distance <= AUTO_SCROLL_THRESHOLD_PX;
}

function scrollToBottom() {
  const element = listRef.value;
  if (!element) return;
  element.scrollTop = element.scrollHeight;
  shouldAutoScroll.value = true;
}

async function scheduleScrollToBottom() {
  if (pendingScrollFrame) return;
  pendingScrollFrame = window.requestAnimationFrame(async () => {
    pendingScrollFrame = 0;
    await nextTick();
    scrollToBottom();
  });
}

function handleScroll() {
  const element = listRef.value;
  if (!element) return;
  shouldAutoScroll.value = isNearBottom(element);
}

onMounted(() => {
  const element = listRef.value;
  if (!element) return;
  element.addEventListener("scroll", handleScroll, { passive: true });
  shouldAutoScroll.value = isNearBottom(element);
});

onBeforeUnmount(() => {
  const element = listRef.value;
  if (element) element.removeEventListener("scroll", handleScroll);
  if (pendingScrollFrame) window.cancelAnimationFrame(pendingScrollFrame);
  pendingScrollFrame = 0;
});

watch(
  () => props.messages.length,
  async () => {
    const allowAutoScroll = shouldAutoScroll.value;
    await nextTick();
    if (!allowAutoScroll) return;
    scrollToBottom();
  },
  { immediate: true }
);

const lastMessageContent = computed(() => props.messages[props.messages.length - 1]?.content || "");
const lastMessageId = computed(() => props.messages[props.messages.length - 1]?.id || "");

watch(lastMessageContent, async () => {
  if (!shouldAutoScroll.value) return;
  await scheduleScrollToBottom();
});

watch(lastMessageId, async () => {
  if (!shouldAutoScroll.value) return;
  await scheduleScrollToBottom();
});
</script>

<template>
  <div ref="listRef" class="list">
    <div v-if="messages.length === 0" class="empty">
      <h3 class="empty-title">开始一轮新对话</h3>
    </div>

    <transition-group v-else name="chat-message" tag="div" class="messages">
      <ChatMessageBubble
        v-for="(message, index) in messages"
        :key="message.clientId || message.id || `${message.role || 'message'}_${index}`"
        :message="message"
        :userProfile="userProfile"
        :assistantProfile="assistantProfile"
        :isEditing="String(message.id) === String(editingMessageId)"
        :editDraft="String(message.id) === String(editingMessageId) ? editingDraft : ''"
        :processing="editingProcessing && String(message.id) === String(editingMessageId)"
        :actionsDisabled="actionsDisabled && String(message.id) !== String(editingMessageId)"
        @request-edit="emit('request-edit', $event)"
        @update:editDraft="emit('update-edit-draft', $event)"
        @commit-edit="emit('commit-edit', $event)"
        @cancel-edit="emit('cancel-edit', $event)"
      />
    </transition-group>
  </div>
</template>

<style scoped>
.list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  -webkit-overflow-scrolling: touch;
  padding: 16px 18px 22px;
  box-sizing: border-box;
  scrollbar-gutter: stable;
  scrollbar-width: thin;
  scrollbar-color: rgba(15, 23, 42, 0.22) transparent;
}

.list::-webkit-scrollbar {
  width: 10px;
}

.list::-webkit-scrollbar-track {
  background: transparent;
}

.list::-webkit-scrollbar-thumb {
  background: rgba(15, 23, 42, 0.22);
  border-radius: 999px;
  border: 3px solid transparent;
  background-clip: padding-box;
}

.list::-webkit-scrollbar-thumb:hover {
  background: rgba(15, 23, 42, 0.32);
}

.messages {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  max-width: 820px;
  margin: 0 auto;
}

.chat-message-enter-active {
  transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.2, 0.9, 0.2, 1);
}

.chat-message-enter-from {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}

.chat-message-enter-from.user {
  transform: translateY(12px) translateX(14px) scale(0.98);
}

.chat-message-enter-from:not(.user) {
  transform: translateY(12px) translateX(-14px) scale(0.98);
}

.chat-message-leave-active {
  transition: opacity 0.14s ease, transform 0.14s ease;
  position: absolute;
  width: 100%;
}

.chat-message-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.98);
}

.chat-message-leave-to.user {
  transform: translateY(-8px) translateX(10px) scale(0.98);
}

.chat-message-leave-to:not(.user) {
  transform: translateY(-8px) translateX(-10px) scale(0.98);
}

.chat-message-move {
  transition: transform 0.18s ease;
}

@media (prefers-reduced-motion: reduce) {
  .chat-message-enter-active,
  .chat-message-leave-active,
  .chat-message-move {
    transition: none;
  }
}

.empty {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px 8px;
}

.empty-title {
  margin: 0;
  font-size: 2rem;
  color: #414040;
}

@media (max-width: 900px) {
  .list {
    padding: 14px 14px 18px;
  }

  .empty-title {
    text-align: center;
  }
}
</style>

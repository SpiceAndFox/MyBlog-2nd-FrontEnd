<script setup>
import ChatMessageList from "@/components/Chat/ChatMessageList.vue";
import ChatComposer from "@/components/Chat/ChatComposer.vue";
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { DEFAULT_SESSION_TITLE } from "@/config/chat";

const props = defineProps({
  sessionTitle: { type: String, default: DEFAULT_SESSION_TITLE },
  messages: { type: Array, default: () => [] },
  userProfile: { type: Object, default: null },
  assistantProfile: { type: Object, default: null },
  isMobile: { type: Boolean, default: false },
  readOnly: { type: Boolean, default: false },
  composerDraft: { type: String, default: "" },
  dayRollover: { type: Object, default: null },
  isSending: { type: Boolean, default: false },
  isStreaming: { type: Boolean, default: false },
  memoryLockMessage: { type: String, default: "" },
  isEditingActive: { type: Boolean, default: false },
  editingMessageId: { type: String, default: "" },
  editingDraft: { type: String, default: "" },
  editingProcessing: { type: Boolean, default: false },
});

const emit = defineEmits([
  "open-sidebar",
  "go-today",
  "update:composerDraft",
  "send-message",
  "stop-output",
  "request-edit-message",
  "update-edit-draft",
  "commit-edit-message",
  "cancel-edit-message",
]);

const composerRef = ref(null);
const composerDraftModel = computed({
  get: () => props.composerDraft,
  set: (value) => emit("update:composerDraft", value),
});

const showDayRollover = ref(false);
const dayRolloverTo = ref("");
let dayRolloverTimer = null;

function clearDayRolloverTimer() {
  if (!dayRolloverTimer) return;
  window.clearTimeout(dayRolloverTimer);
  dayRolloverTimer = null;
}

watch(
  () => props.dayRollover?.at,
  async () => {
    const toKey = String(props.dayRollover?.toKey || "").trim();
    if (!toKey) return;

    dayRolloverTo.value = toKey;
    showDayRollover.value = false;
    clearDayRolloverTimer();

    await nextTick();
    showDayRollover.value = true;
    dayRolloverTimer = window.setTimeout(() => {
      showDayRollover.value = false;
      dayRolloverTimer = null;
    }, 2400);
  }
);

onBeforeUnmount(() => {
  clearDayRolloverTimer();
});

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

    <transition name="day-rollover-toast">
      <div v-if="showDayRollover" class="day-rollover-toast" role="status" aria-live="polite">
        <div class="day-rollover-card">
          <div class="day-rollover-title">新的一天</div>
          <div class="day-rollover-date">{{ dayRolloverTo }}</div>
        </div>
      </div>
    </transition>

    <div v-if="readOnly" class="read-only-banner" role="note" aria-label="历史会话提示">
      <div class="read-only-text">历史对话，只读</div>
      <button class="read-only-action" type="button" @click="emit('go-today')">回到今天</button>
    </div>

    <div v-else-if="memoryLockMessage" class="memory-lock-banner" role="note" aria-label="记忆重建提示">
      <div class="memory-lock-text">{{ memoryLockMessage }}</div>
    </div>

    <ChatMessageList
      class="message-list"
      :messages="messages"
      :userProfile="userProfile"
      :assistantProfile="assistantProfile"
      :editingMessageId="editingMessageId"
      :editingDraft="editingDraft"
      :editingProcessing="editingProcessing"
      :actionsDisabled="readOnly || isSending || isStreaming || isEditingActive || editingProcessing || Boolean(memoryLockMessage)"
      @request-edit="emit('request-edit-message', $event)"
      @update-edit-draft="emit('update-edit-draft', $event)"
      @commit-edit="emit('commit-edit-message', $event)"
      @cancel-edit="emit('cancel-edit-message', $event)"
    />

    <ChatComposer
      ref="composerRef"
      v-model="composerDraftModel"
      :disabled="readOnly"
      :placeholder="readOnly ? '历史会话只读，点击“回到今天”继续对话' : memoryLockMessage ? '记忆重建中，请稍后再试…' : '输入消息…'"
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

.day-rollover-toast {
  position: absolute;
  left: 50%;
  top: 10px;
  z-index: 6;
  transform: translateX(-50%);
  pointer-events: none;
}

.day-rollover-card {
  padding: 10px 14px;
  border-radius: 16px;
  display: grid;
  gap: 4px;
  overflow: hidden;
  position: relative;

  background: rgba(249, 250, 251, 0.88);
  border: 1px solid var(--chat-border, rgba(17, 24, 39, 0.12));
  box-shadow: 0 16px 50px rgba(15, 23, 42, 0.14);
  backdrop-filter: blur(14px);
}

.day-rollover-title {
  font-weight: 800;
  font-size: 0.95rem;
  color: var(--chat-text, rgba(17, 24, 39, 0.92));
  letter-spacing: 0.02em;
}

.day-rollover-date {
  font-weight: 720;
  font-size: 0.9rem;
  color: var(--chat-muted, rgba(17, 24, 39, 0.62));
}

.day-rollover-toast-enter-active,
.day-rollover-toast-leave-active {
  transition: opacity 0.32s ease, transform 0.32s ease;
}

.day-rollover-toast-enter-from,
.day-rollover-toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-10px) scale(0.98);
}

.day-rollover-toast-enter-to,
.day-rollover-toast-leave-from {
  opacity: 1;
  transform: translateX(-50%) translateY(0) scale(1);
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
  animation: read-only-banner-in 0.22s ease both;
}

.memory-lock-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  padding: 10px 14px;
  border-bottom: 1px solid var(--chat-border, rgba(17, 24, 39, 0.12));
  background: rgba(254, 243, 199, 0.92);
  backdrop-filter: blur(10px);
  z-index: 2;
  animation: read-only-banner-in 0.22s ease both;
}

.memory-lock-text {
  color: rgba(146, 64, 14, 0.95);
  font-weight: 650;
  font-size: 0.92rem;
}

@keyframes read-only-banner-in {
  from {
    transform: translateY(-8px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.day-rollover-card::after {
  content: "";
  position: absolute;
  inset: -40% -60%;
  background: radial-gradient(circle at 50% 50%, rgba(16, 163, 127, 0.22), transparent 55%);
  transform: rotate(12deg);
  opacity: 0.6;
  animation: day-rollover-glow 1.4s ease both;
  pointer-events: none;
}

@keyframes day-rollover-glow {
  from {
    opacity: 0;
    transform: rotate(12deg) translateY(10px);
  }
  to {
    opacity: 0.6;
    transform: rotate(12deg) translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .day-rollover-toast-enter-active,
  .day-rollover-toast-leave-active {
    transition: none;
  }

  .read-only-banner {
    animation: none;
  }

  .day-rollover-card::after {
    animation: none;
  }
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

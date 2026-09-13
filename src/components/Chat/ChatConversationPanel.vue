<script setup>
import ChatMessageList from "@/components/Chat/ChatMessageList.vue";
import ChatComposer from "@/components/Chat/ChatComposer.vue";
import ChatHealthBanner from "@/components/Chat/ChatHealthBanner.vue";
import ChatHeader from "./ChatHeader.vue";
import { formatSessionDateLabel } from "./utils/sessionDate";
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { DEFAULT_SESSION_TITLE } from "@/config/chat";

const props = defineProps({
  sessionTitle: { type: String, default: DEFAULT_SESSION_TITLE },
  messages: { type: Array, default: () => [] },
  userProfile: { type: Object, default: null },
  assistantProfile: { type: Object, default: null },
  promptPresets: { type: Array, default: () => [] },
  activePresetId: { type: String, default: "" },
  presetLocked: { type: Boolean, default: false },
  todayKey: { type: String, default: "" },
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
  healthWarnings: { type: Array, default: () => [] },
  healthRetryableComponents: { type: Array, default: () => [] },
  healthLoading: { type: Boolean, default: false },
  healthRetrying: { type: Object, default: () => ({}) },
});

const emit = defineEmits([
  "open-sidebar",
  "select-preset",
  "open-presets",
  "open-settings",
  "open-trash",
  "go-today",
  "update:composerDraft",
  "send-message",
  "stop-output",
  "request-edit-message",
  "update-edit-draft",
  "commit-edit-message",
  "cancel-edit-message",
  "refresh-health",
  "retry-health",
]);

const composerRef = ref(null);
const headerRef = ref(null);
const sessionLabel = computed(() =>
  formatSessionDateLabel(props.sessionTitle, props.todayKey),
);
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
  },
);

onBeforeUnmount(() => {
  clearDayRolloverTimer();
});

function focusComposer() {
  composerRef.value?.focus?.();
}

defineExpose({
  focusComposer,
  focusSidebarButton: () => headerRef.value?.focusSidebarButton(),
});
</script>

<template>
  <section class="conversation" :aria-label="`对话：${sessionTitle}`">
    <ChatHeader
      ref="headerRef"
      :assistantProfile="assistantProfile"
      :promptPresets="promptPresets"
      :activePresetId="activePresetId"
      :presetLocked="presetLocked"
      :isMobile="isMobile"
      @open-sidebar="emit('open-sidebar')"
      @select-preset="emit('select-preset', $event)"
      @open-presets="emit('open-presets')"
      @open-settings="emit('open-settings')"
      @open-trash="emit('open-trash')"
    />

    <transition name="day-rollover-toast">
      <div
        v-if="showDayRollover"
        class="day-rollover-toast"
        role="status"
        aria-live="polite"
      >
        <div class="day-rollover-card">
          <div class="day-rollover-title">新的一天</div>
          <div class="day-rollover-date">{{ dayRolloverTo }}</div>
        </div>
      </div>
    </transition>

    <div
      v-if="!readOnly && memoryLockMessage"
      class="memory-lock-banner"
      role="note"
      aria-label="记忆重建提示"
    >
      <div class="memory-lock-text">{{ memoryLockMessage }}</div>
    </div>

    <ChatHealthBanner
      :warnings="healthWarnings"
      :retryableComponents="healthRetryableComponents"
      :loading="healthLoading"
      :retrying="healthRetrying"
      @refresh="emit('refresh-health')"
      @retry="emit('retry-health', $event)"
    />

    <ChatMessageList
      class="message-list"
      :messages="messages"
      :sessionLabel="sessionLabel"
      :userProfile="userProfile"
      :assistantProfile="assistantProfile"
      :editingMessageId="editingMessageId"
      :editingDraft="editingDraft"
      :editingProcessing="editingProcessing"
      :actionsDisabled="
        readOnly ||
        isSending ||
        isStreaming ||
        isEditingActive ||
        editingProcessing ||
        Boolean(memoryLockMessage)
      "
      @request-edit="emit('request-edit-message', $event)"
      @update-edit-draft="emit('update-edit-draft', $event)"
      @commit-edit="emit('commit-edit-message', $event)"
      @cancel-edit="emit('cancel-edit-message', $event)"
    />

    <div v-if="readOnly" class="read-only-shell">
      <div class="read-only-banner" role="note" aria-label="历史会话提示">
        <span class="read-only-text">历史对话，只读</span>
        <button
          class="read-only-action"
          type="button"
          @click="emit('go-today')"
        >
          回到今天
        </button>
      </div>
    </div>
    <ChatComposer
      v-else
      ref="composerRef"
      v-model="composerDraftModel"
      :disabled="Boolean(memoryLockMessage)"
      :placeholder="
        memoryLockMessage ? '记忆重建中，请稍后再试…' : '想聊些什么？'
      "
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
  background: var(--chat-surface);
  position: relative;
}
.message-list {
  flex: 1;
  min-height: 0;
}
.day-rollover-toast {
  position: absolute;
  left: 50%;
  top: 76px;
  z-index: 6;
  transform: translateX(-50%);
  pointer-events: none;
}
.day-rollover-card {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid var(--chat-border);
  border-radius: 10px;
  background: var(--chat-surface);
  box-shadow: var(--chat-card-shadow);
  white-space: nowrap;
}
.day-rollover-title {
  color: var(--chat-text);
  font-size: 13px;
  font-weight: 500;
}
.day-rollover-date {
  color: var(--chat-muted);
  font-size: 12px;
}
.day-rollover-toast-enter-active,
.day-rollover-toast-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.day-rollover-toast-enter-from,
.day-rollover-toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-6px);
}
.read-only-shell {
  box-sizing: border-box;
  width: 100%;
  max-width: 780px;
  flex: 0 0 auto;
  align-self: center;
  padding: 10px 30px 24px;
  padding-bottom: calc(24px + env(safe-area-inset-bottom));
}
.read-only-banner {
  min-height: 59px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-top: 1px solid var(--chat-border);
}
.read-only-text {
  color: var(--chat-muted);
  font-size: 13px;
}
.read-only-action {
  border: 0;
  border-radius: 8px;
  padding: 9px 12px;
  background: var(--chat-sidebar-active);
  color: var(--chat-accent);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
  flex: 0 0 auto;
}
.read-only-action:hover {
  background: #e8dadd;
}
.read-only-action:focus-visible {
  outline: 2px solid var(--chat-accent);
  outline-offset: 3px;
}
.memory-lock-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 20px;
  background: #fbf3e2;
  color: #8a6525;
  font-size: 13px;
  flex: 0 0 auto;
}
@media (max-width: 900px) {
  .read-only-shell {
    padding: 10px 14px 18px;
    padding-bottom: calc(18px + env(safe-area-inset-bottom));
  }
  .read-only-action {
    min-height: 44px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .day-rollover-toast-enter-active,
  .day-rollover-toast-leave-active {
    transition: none;
  }
}
</style>

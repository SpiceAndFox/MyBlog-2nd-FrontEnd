<script setup>
import { computed, nextTick, ref } from "vue";

const props = defineProps({
  isSending: { type: Boolean, default: false },
  isStreaming: { type: Boolean, default: false },
});

const emit = defineEmits(["send", "stop"]);

const draftText = ref("");
const textareaRef = ref(null);

const canSend = computed(
  () => !props.isSending && !props.isStreaming && String(draftText.value || "").trim().length > 0
);

function send() {
  if (!canSend.value) return;
  emit("send", draftText.value);
  draftText.value = "";
  nextTick(resizeTextarea);
}

function stop() {
  if (!props.isStreaming) return;
  emit("stop");
}

function onKeydown(event) {
  if (event.key !== "Enter") return;
  if (event.shiftKey) return;
  event.preventDefault();
  if (props.isStreaming) {
    stop();
    return;
  }
  if (props.isSending) return;
  send();
}

function resizeTextarea() {
  const element = textareaRef.value;
  if (!element) return;
  element.style.height = "0px";
  const nextHeight = Math.min(element.scrollHeight, 160);
  element.style.height = `${Math.max(nextHeight, 44)}px`;
}

function onCardPointerDown(event) {
  const target = event?.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.closest("button")) return;
  if (target.closest("textarea")) return;

  event.preventDefault();
  textareaRef.value?.focus?.();
}
</script>

<template>
  <div class="composer-shell">
    <div class="composer-card" @pointerdown="onCardPointerDown">
      <textarea
        ref="textareaRef"
        v-model="draftText"
        class="input"
        rows="1"
        placeholder=""
        @keydown="onKeydown"
        @input="resizeTextarea"
      ></textarea>

      <button
        v-if="isStreaming"
        class="send-button stop-button"
        type="button"
        @click="stop"
        aria-label="停止"
        title="停止"
      >
        P
      </button>
      <button v-else class="send-button" type="button" :disabled="!canSend" @click="send" aria-label="发送">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path d="M3.4 20.6 21 12 3.4 3.4l.6 7.2L15 12 4 13.4l-.6 7.2Z" fill="currentColor" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.composer-shell {
  padding: 12px 14px 14px;
}

.composer-card {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  padding: 10px 10px;
  border-radius: 16px;
  cursor: text;
  width: 100%;
  max-width: 820px;
  margin: 0 auto;
  border: 1px solid var(--chat-border, rgba(17, 24, 39, 0.12));
  background: var(--chat-bubble-bg, rgba(255, 255, 255, 0.9));
  box-shadow: var(--chat-card-shadow, 0 12px 30px rgba(0, 0, 0, 0.06));
  box-sizing: border-box;
}

.input {
  flex: 1;
  border: none;
  outline: none;
  resize: none;
  min-height: 44px;
  max-height: 160px;
  padding: 8px 10px;
  font-size: 1rem;
  line-height: 1.5;
  background: transparent;
  color: var(--chat-text, rgba(17, 24, 39, 0.92));
  font-family: "Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", Arial, "Segoe UI", system-ui, sans-serif;
}

.send-button {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  border: 1px solid transparent;
  background: var(--chat-accent, #3b82f6);
  color: #fff;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: background-color 0.18s ease, transform 0.06s ease, opacity 0.18s ease;
}

.send-button:hover:not(:disabled) {
  background: var(--chat-accent-strong, #2563eb);
}

.send-button:active:not(:disabled) {
  transform: translateY(1px);
}

.send-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.stop-button {
  background: #ef4444;
  font-size: 0.95rem;
  font-weight: 700;
}

.stop-button:hover:not(:disabled) {
  background: #dc2626;
}
</style>

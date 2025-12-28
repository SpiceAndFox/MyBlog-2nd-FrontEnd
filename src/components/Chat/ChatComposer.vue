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
  if (event.isComposing || event.keyCode === 229) return;
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

function focus() {
  nextTick(() => {
    const element = textareaRef.value;
    if (!element) return;
    element.focus();
    const end = element.value?.length ?? 0;
    element.setSelectionRange(end, end);
  });
}

defineExpose({ focus });
</script>

<template>
  <div class="composer-shell">
    <div class="composer-card" @pointerdown="onCardPointerDown">
      <textarea
        ref="textareaRef"
        v-model="draftText"
        class="input"
        rows="1"
        placeholder="输入消息…"
        enterkeyhint="send"
        aria-label="输入消息"
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
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path d="M7 7h10v10H7V7Z" fill="currentColor" />
        </svg>
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
  padding: 12px 14px 16px;
  padding-bottom: calc(16px + env(safe-area-inset-bottom));
  background: transparent;
}

.composer-card {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  padding: 10px 10px 10px 12px;
  border-radius: 22px;
  cursor: text;
  width: 100%;
  max-width: 820px;
  margin: 0 auto;
  border: none;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.78), rgba(255, 255, 255, 0.62));
  backdrop-filter: blur(18px) saturate(180%);
  -webkit-backdrop-filter: blur(18px) saturate(180%);
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.65);
  box-sizing: border-box;
  transition: box-shadow 0.3s ease;
}

.composer-card:focus-within {
  box-shadow: 0 0 0 2px rgba(79, 88, 86, 0.16), 0 22px 60px rgba(51, 56, 68, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.input {
  flex: 1;
  border: none;
  outline: none;
  resize: none;
  min-height: 44px;
  max-height: 160px;
  padding: 8px 10px 8px 0;
  font-size: 1rem;
  line-height: 1.55;
  background: transparent;
  color: var(--chat-text, rgba(17, 24, 39, 0.92));
  font-family: "Microsoft YaHei", "PingFang SC", "Hiragino Sans GB", Arial, "Segoe UI", system-ui, sans-serif;
}

.input::placeholder {
  color: var(--chat-muted, rgba(17, 24, 39, 0.58));
}

.send-button {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: 1px solid transparent;
  background: linear-gradient(180deg, var(--chat-accent, #10a37f), var(--chat-accent-strong, #0f8a6c));
  color: #fff;
  cursor: pointer;
  display: grid;
  place-items: center;
  box-shadow: 0 12px 26px rgba(16, 163, 127, 0.18);
  transition: filter 0.18s ease, transform 0.06s ease, opacity 0.18s ease, box-shadow 0.18s ease;
}

.send-button:hover:not(:disabled) {
  filter: brightness(1.03);
  box-shadow: 0 14px 30px rgba(16, 163, 127, 0.22);
}

.send-button:active:not(:disabled) {
  transform: translateY(1px);
}

.send-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}

.stop-button {
  background: linear-gradient(180deg, rgba(239, 68, 68, 0.95), rgba(220, 38, 38, 0.95));
  box-shadow: 0 12px 26px rgba(239, 68, 68, 0.18);
}

.stop-button:hover:not(:disabled) {
  filter: brightness(1.03);
  box-shadow: 0 14px 30px rgba(239, 68, 68, 0.22);
}

@media (max-width: 900px) {
  .composer-shell {
    padding: 10px 10px 14px;
    padding-bottom: calc(14px + env(safe-area-inset-bottom));
  }

  .composer-card {
    gap: 8px;
    padding: 9px 9px 9px 11px;
    border-radius: 20px;
    box-shadow: 0 16px 44px rgba(15, 23, 42, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.62);
  }

  .input {
    font-size: 0.98rem;
  }
}
</style>

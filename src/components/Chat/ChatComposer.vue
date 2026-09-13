<script setup>
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import ChatIcon from "./ChatIcon.vue";

const props = defineProps({
  modelValue: { type: String, default: "" },
  disabled: { type: Boolean, default: false },
  placeholder: { type: String, default: "输入消息…" },
  isSending: { type: Boolean, default: false },
  isStreaming: { type: Boolean, default: false },
});

const emit = defineEmits(["send", "stop", "update:modelValue"]);

const draftText = computed({
  get: () => String(props.modelValue ?? ""),
  set: (value) => emit("update:modelValue", String(value ?? "")),
});
const textareaRef = ref(null);
let textareaObserver;
let lastTextareaWidth = 0;

onMounted(() => {
  textareaObserver = new ResizeObserver(([entry]) => {
    if (entry.contentRect.width === lastTextareaWidth) return;
    lastTextareaWidth = entry.contentRect.width;
    resizeTextarea();
  });
  if (textareaRef.value) textareaObserver.observe(textareaRef.value);
});
onBeforeUnmount(() => textareaObserver?.disconnect());

const canSend = computed(
  () =>
    !props.disabled &&
    !props.isSending &&
    !props.isStreaming &&
    String(draftText.value || "").trim().length > 0,
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
  if (props.disabled) return;
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
  element.style.height = `${Math.max(nextHeight, 36)}px`;
}

watch(
  () => props.modelValue,
  () => {
    nextTick(resizeTextarea);
  },
  { immediate: true },
);

function onCardPointerDown(event) {
  if (props.disabled) return;
  const target = event?.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.closest("button")) return;
  if (target.closest("textarea")) return;

  event.preventDefault();
  textareaRef.value?.focus?.();
}

function focus() {
  if (props.disabled) return;
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
        :placeholder="placeholder"
        :disabled="disabled"
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
      <button
        v-else
        class="send-button"
        type="button"
        :disabled="!canSend"
        @click="send"
        aria-label="发送"
      >
        <ChatIcon name="arrow" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.composer-shell {
  padding: 10px 30px 24px;
  padding-bottom: calc(24px + env(safe-area-inset-bottom));
  flex: 0 0 auto;
}
.composer-card {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  width: 100%;
  max-width: 720px;
  box-sizing: border-box;
  margin: 0 auto;
  padding: 11px 11px 11px 17px;
  border: 1px solid var(--chat-border);
  border-radius: 18px;
  background: var(--chat-composer-bg);
  box-shadow: 0 2px 5px rgba(57, 57, 52, 0.02);
  cursor: text;
  transition: border-color 0.16s ease;
}
.composer-card:focus-within {
  border-color: var(--chat-accent);
}
.input {
  flex: 1;
  min-width: 0;
  box-sizing: border-box;
  min-height: 36px;
  max-height: 160px;
  padding: 5px 0;
  border: 0;
  outline: none;
  resize: none;
  font: inherit;
  font-size: 15px;
  line-height: 26px;
  background: transparent;
  color: var(--chat-text);
  scrollbar-width: thin;
}
.input::placeholder {
  color: var(--chat-muted);
}
.send-button {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: var(--chat-accent);
  color: #fff;
  cursor: pointer;
  transition: background-color 0.16s ease;
}
.send-button:hover:not(:disabled) {
  background: var(--chat-accent-strong);
}
.send-button:focus-visible {
  outline: 2px solid var(--chat-accent);
  outline-offset: 3px;
}
.send-button:disabled {
  background: var(--chat-sidebar-hover);
  color: var(--chat-muted);
  cursor: default;
}
.stop-button {
  background: var(--chat-text);
}
.stop-button:hover:not(:disabled) {
  background: #56564e;
}
@media (max-width: 900px) {
  .composer-shell {
    padding: 10px 14px 18px;
    padding-bottom: calc(18px + env(safe-area-inset-bottom));
  }
  .composer-card {
    gap: 8px;
    padding: 8px 8px 8px 14px;
    border-radius: 20px;
  }
  .input {
    font-size: 16px;
    line-height: 28px;
  }
  .send-button {
    width: 40px;
    height: 40px;
  }
}
@media (pointer: coarse) {
  .send-button {
    min-width: 44px;
    min-height: 44px;
  }
  .input {
    font-size: 16px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .composer-card,
  .send-button {
    transition: none;
  }
}
</style>

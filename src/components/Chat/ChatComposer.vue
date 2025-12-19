<script setup>
import { computed, nextTick, ref } from "vue";

const emit = defineEmits(["send"]);

const draftText = ref("");
const textareaRef = ref(null);

const canSend = computed(() => String(draftText.value || "").trim().length > 0);

function send() {
  if (!canSend.value) return;
  emit("send", draftText.value);
  draftText.value = "";
  nextTick(resizeTextarea);
}

function onKeydown(event) {
  if (event.key !== "Enter") return;
  if (event.shiftKey) return;
  event.preventDefault();
  send();
}

function resizeTextarea() {
  const element = textareaRef.value;
  if (!element) return;
  element.style.height = "0px";
  const nextHeight = Math.min(element.scrollHeight, 160);
  element.style.height = `${Math.max(nextHeight, 44)}px`;
}
</script>

<template>
  <div class="composer-shell">
    <div class="composer-card">
      <textarea
        ref="textareaRef"
        v-model="draftText"
        class="input"
        rows="1"
        placeholder="给 AI 发消息…（Enter 发送，Shift+Enter 换行）"
        @keydown="onKeydown"
        @input="resizeTextarea"
      ></textarea>

      <button class="send-button" type="button" :disabled="!canSend" @click="send" aria-label="发送">
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
  border: 1px solid rgba(17, 24, 39, 0.12);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.06);
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
  color: rgba(17, 24, 39, 0.92);
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
</style>

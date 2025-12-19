<script setup>
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: "确认操作" },
  message: { type: String, default: "" },
  confirmText: { type: String, default: "确定" },
  cancelText: { type: String, default: "取消" },
});

const emit = defineEmits(["confirm", "cancel"]);
</script>

<template>
  <transition name="chat-dialog-fade">
    <div v-if="open" class="dialog-overlay" @click.self="emit('cancel')" role="dialog" aria-modal="true">
      <div class="dialog">
        <header class="dialog-header">
          <h3 class="dialog-title">{{ title }}</h3>
          <button class="icon-button" type="button" @click="emit('cancel')" aria-label="关闭">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7A1 1 0 0 0 5.7 7.11L10.59 12l-4.9 4.89a1 1 0 1 0 1.41 1.42L12 13.41l4.89 4.9a1 1 0 0 0 1.42-1.41L13.41 12l4.9-4.89a1 1 0 0 0-.01-1.4Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </header>

        <div class="dialog-body">
          <p class="dialog-message">{{ message }}</p>
        </div>

        <footer class="dialog-footer">
          <button class="button button-secondary" type="button" @click="emit('cancel')">{{ cancelText }}</button>
          <button class="button button-danger" type="button" @click="emit('confirm')">{{ confirmText }}</button>
        </footer>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.dialog-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: rgba(17, 24, 39, 0.42);
  backdrop-filter: blur(6px);
  z-index: 30;
}

.dialog {
  width: min(520px, 100%);
  border-radius: var(--chat-radius-lg, 14px);
  background: var(--chat-surface-2, #fff);
  border: 1px solid var(--chat-border, rgba(17, 24, 39, 0.12));
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
  overflow: hidden;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--chat-border, rgba(17, 24, 39, 0.12));
}

.dialog-title {
  margin: 0;
  font-size: 1rem;
  color: var(--chat-text, #111827);
}

.dialog-body {
  padding: 12px 16px 18px;
}

.dialog-message {
  margin: 0;
  line-height: 1.5;
  color: var(--chat-muted, rgba(17, 24, 39, 0.62));
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 16px;
  border-top: 1px solid var(--chat-border, rgba(17, 24, 39, 0.12));
}

.button {
  border: 1px solid transparent;
  border-radius: 999px;
  padding: 10px 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.06s ease;
}

.button:active {
  transform: translateY(1px);
}

.button-secondary {
  background: transparent;
  color: var(--chat-text, #111827);
  border-color: var(--chat-border, rgba(17, 24, 39, 0.12));
}

.button-secondary:hover {
  background: rgba(17, 24, 39, 0.04);
}

.button-danger {
  background: rgba(239, 68, 68, 0.95);
  color: #fff;
}

.button-danger:hover {
  background: rgba(220, 38, 38, 0.95);
}

.icon-button {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  color: var(--chat-muted, rgba(17, 24, 39, 0.62));
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.icon-button:hover {
  background: rgba(17, 24, 39, 0.05);
  color: var(--chat-text, #111827);
}

.chat-dialog-fade-enter-active,
.chat-dialog-fade-leave-active {
  transition: opacity 0.18s ease;
}

.chat-dialog-fade-enter-from,
.chat-dialog-fade-leave-to {
  opacity: 0;
}
</style>


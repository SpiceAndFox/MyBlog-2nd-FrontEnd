<script setup>
import ChatMessageList from "@/components/Chat/ChatMessageList.vue";
import ChatComposer from "@/components/Chat/ChatComposer.vue";

defineProps({
  sessionTitle: { type: String, default: "新对话" },
  messages: { type: Array, default: () => [] },
  isMobile: { type: Boolean, default: false },
});

const emit = defineEmits(["open-sidebar", "open-settings", "send-message"]);
</script>

<template>
  <section class="conversation">
    <header class="topbar">
      <div class="topbar-inner">
        <div class="topbar-left">
          <button
            v-if="isMobile"
            class="icon-button"
            type="button"
            @click="emit('open-sidebar')"
            aria-label="打开会话列表"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                d="M4 6h16a1 1 0 1 1 0 2H4a1 1 0 1 1 0-2Zm0 5h16a1 1 0 1 1 0 2H4a1 1 0 1 1 0-2Zm0 5h16a1 1 0 1 1 0 2H4a1 1 0 1 1 0-2Z"
                fill="currentColor"
              />
            </svg>
          </button>

          <div class="title-group">
            <h2 class="title" :title="sessionTitle">{{ sessionTitle }}</h2>
          </div>
        </div>

        <div class="topbar-right">
          <button class="icon-button" type="button" @click="emit('open-settings')" aria-label="设置">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path
                d="M19.14 12.94c.04-.31.06-.63.06-.94s-.02-.63-.06-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.28 7.28 0 0 0-1.63-.94l-.36-2.54A.5.5 0 0 0 13.9 1h-3.8a.5.5 0 0 0-.49.42l-.36 2.54c-.58.24-1.12.55-1.63.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 7.48a.5.5 0 0 0 .12.64l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94L2.83 14.52a.5.5 0 0 0-.12.64l1.92 3.32c.13.23.4.32.64.22l2.39-.96c.5.39 1.05.7 1.63.94l.36 2.54c.05.24.25.42.49.42h3.8c.24 0 .45-.18.49-.42l.36-2.54c.58-.24 1.12-.55 1.63-.94l2.39.96c.24.1.51.01.64-.22l1.92-3.32a.5.5 0 0 0-.12-.64l-2.03-1.58ZM12 15.5A3.5 3.5 0 1 1 12 8a3.5 3.5 0 0 1 0 7.5Z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>

    <ChatMessageList class="message-list" :messages="messages" />

    <ChatComposer @send="emit('send-message', $event)" />
  </section>
</template>

<style scoped>
.conversation {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: var(--chat-surface, #f7f7f8);
}

.topbar {
  padding: 12px 14px;
  border-bottom: 1px solid var(--chat-border, rgba(17, 24, 39, 0.12));
  background: var(--chat-topbar-bg, rgba(255, 255, 255, 0.6));
  backdrop-filter: blur(8px);
}

.topbar-inner {
  width: 100%;
  max-width: 820px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.title-group {
  min-width: 0;
}

.title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--chat-text, #111827);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-button {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 1px solid transparent;
  background: transparent;
  cursor: pointer;
  display: grid;
  place-items: center;
  color: var(--chat-muted, rgba(17, 24, 39, 0.62));
  transition: background-color 0.18s ease, color 0.18s ease, border-color 0.18s ease;
}

.icon-button:hover {
  background: var(--chat-topbar-hover, rgba(17, 24, 39, 0.04));
  color: var(--chat-text, #111827);
  border-color: rgba(17, 24, 39, 0.08);
}

.message-list {
  flex: 1;
  min-height: 0;
}
</style>
